import { InjectRepository } from '@nestjs/typeorm';
import type { PoolClient } from 'pg';
import { Repository } from 'typeorm';
import { DatabaseService } from '../database/database.service';
import { OntologyEntity } from '../ontology/ontology.entity';
import type {
  Context,
  ContextNodeRelation,
  KnowledgeGraph,
  Node,
  Relation,
} from './dto/graph.dto';
import { KnowledgeEntity } from './knowledge.entity';

export const GRAPH_SERVICE_TOKEN = 'GraphService';

export interface GraphService {
  save(graph: KnowledgeGraph): Promise<void>;
  load(id: string): Promise<KnowledgeGraph>;
}

interface GraphElemenetModifyer {
  createNode(node: Node): Promise<void>;
  deleteNode(node: Node): Promise<void>;
  relate(relation: Relation): Promise<void>;
  contextualize(context: Context, relations: ContextNodeRelation[]): Promise<void>;
  findNodes(): Promise<Node[]>;
  findRelations(): Promise<Relation[]>;
  findContexts(): Promise<Context[]>;
  findContextRelations(): Promise<ContextNodeRelation[]>;
}

export class GraphServiceImpl implements GraphService {
  constructor(
    @InjectRepository(KnowledgeEntity)
    private readonly knowledgeRepository: Repository<KnowledgeEntity>,
    @InjectRepository(OntologyEntity)
    private readonly ontologyRepository: Repository<OntologyEntity>,
    private readonly databaseService: DatabaseService,
  ) {}

  async save(graph: KnowledgeGraph): Promise<void> {
    const entity = await this.knowledgeRepository.findOne({ where: { id: graph.id } });
    if (!entity) {
      throw new Error(`Knowledge "${graph.id}" was not found`);
    }

    const ontology = await this.ontologyRepository.findOne({ where: { id: graph.ontologyId } });
    if (!ontology) {
      throw new Error(`Ontology "${graph.ontologyId}" was not found`);
    }

    const graphOps = new GraphElementsOps(entity, ontology, this.databaseService);

    for (const n of graph.nodes) {
      await graphOps.createNode(n);
    }
    for (const c of graph.contexts) {
      const relations = graph.contextRelations.filter((v) => v.contextId === c.id);
      await graphOps.contextualize(c, relations);
    }
    for (const r of graph.relations) {
      await graphOps.relate(r);
    }
  }

  async load(id: string): Promise<KnowledgeGraph> {
    const entity = await this.knowledgeRepository.findOne({ where: { id } });
    if (!entity) {
      throw new Error(`Knowledge "${id}" was not found`);
    }

    const ontology = await this.ontologyRepository.findOne({ where: { id: entity.id } });

    const graphOps = new GraphElementsOps(entity, ontology ?? null, this.databaseService);

    const [nodes, relations, contexts, contextRelations] = await Promise.all([
      graphOps.findNodes(),
      graphOps.findRelations(),
      graphOps.findContexts(),
      graphOps.findContextRelations(),
    ]);

    return {
      id: entity.id,
      ontologyId: ontology?.id ?? '',
      name: entity.name,
      summary: entity.summary,
      nodes,
      relations,
      contexts,
      contextRelations,
    };
  }
}

class GraphElementsOps implements GraphElemenetModifyer {
  private readonly graphName: string;

  constructor(
    private readonly knowledge: KnowledgeEntity,
    private readonly ontology: OntologyEntity | null,
    private readonly db: DatabaseService,
  ) {
    this.graphName = process.env.AGE_GRAPH_NAME || 'knosis_graph';
  }

  async createNode(node: Node): Promise<void> {
    const label = this.sanitizeLabel(node.ontology.elementId);
    await this.withClient(async (client) => {
      await this.ensureVertexLabel(client, label);
      await this.queryCypher(client, `
        MERGE (n:${label} { id: $nodeId })
        SET n.name = $name,
            n.summary = $summary,
            n.value = $value,
            n.meta = $metaJson,
            n.knowledge_id = $knowledgeId,
            n.ontology_id = $ontologyId,
            n.element_id = $elementId
        RETURN n
      `, {
        nodeId: node.id,
        name: node.name,
        summary: node.summary,
        value: node.value,
        metaJson: JSON.stringify(node.meta),
        knowledgeId: this.knowledge.id,
        ontologyId: this.ontology?.id,
        elementId: node.ontology.elementId,
      });
    });
  }

  async deleteNode(node: Node): Promise<void> {
    await this.withClient(async (client) => {
      await this.queryCypher(client, `
        MATCH (n { id: $nodeId })
        DETACH DELETE n
        RETURN count(n)
      `, { nodeId: node.id });
    });
  }

  async relate(relation: Relation): Promise<void> {
    const label = this.sanitizeLabel(relation.ontology.relationId);
    await this.withClient(async (client) => {
      await this.ensureEdgeLabel(client, label);
      await this.queryCypher(client, `
        MATCH (a { id: $sourceId })
        MATCH (b { id: $targetId })
        MERGE (a)-[r:${label} { id: $relationId }]->(b)
        SET r.knowledge_id = $knowledgeId,
            r.ontology_id = $ontologyId
        RETURN r
      `, {
        relationId: relation.id,
        sourceId: relation.sourceId,
        targetId: relation.targetId,
        knowledgeId: this.knowledge.id,
        ontologyId: this.ontology?.id,
      });
    });
  }

  async contextualize(context: Context, relations: ContextNodeRelation[]): Promise<void> {
    const contextLabel = this.sanitizeLabel(context.ontology.contextId);
    await this.withClient(async (client) => {
      await this.ensureVertexLabel(client, contextLabel);
      await this.queryCypher(client, `
        MERGE (c:${contextLabel} { id: $contextId })
        SET c.summary = $summary,
            c.knowledge_id = $knowledgeId,
            c.ontology_id = $ontologyId,
            c.context_id = $contextTypeId,
            c.is_context_hub = true
        RETURN c
      `, {
        contextId: context.id,
        summary: context.summary,
        knowledgeId: this.knowledge.id,
        ontologyId: this.ontology?.id,
        contextTypeId: context.ontology.contextId,
      });

      for (const relation of relations) {
        const edgeLabel = this.sanitizeLabel(relation.name || context.ontology.contextId);
        await this.ensureEdgeLabel(client, edgeLabel);
        await this.queryCypher(client, `
          MATCH (c { id: $contextId })
          MATCH (n { id: $targetId })
          MERGE (c)-[r:${edgeLabel} { id: $relationId }]->(n)
          SET r.knowledge_id = $knowledgeId,
              r.ontology_id = $ontologyId,
              r.is_context_edge = true
          RETURN r
        `, {
          contextId: context.id,
          targetId: relation.targetId,
          relationId: relation.id,
          knowledgeId: this.knowledge.id,
          ontologyId: this.ontology?.id,
        });
      }
    });
  }

  async findNodes(): Promise<Node[]> {
    const results = await this.withClient(async (client) => {
      return await this.queryCypher<any>(client, `
        MATCH (n)
        WHERE n.knowledge_id = $knowledgeId
          AND n.ontology_id = $ontologyId
        RETURN n.id AS id,
               n.element_id AS element_id,
               n.name AS name,
               n.summary AS summary,
               n.value AS value,
               n.meta AS meta
        ORDER BY n.name
      `, {
        knowledgeId: this.knowledge.id,
        ontologyId: this.ontology?.id,
      });
    });

    return results.map((row: any) => ({
      id: row.id,
      ontology: {
        id: row.element_id,
        elementId: row.element_id,
      },
      name: row.name,
      summary: row.summary,
      value: row.value,
      meta: row.meta ? (typeof row.meta === 'string' ? JSON.parse(row.meta) : row.meta) : { position: { x: 0, y: 0 } },
    }));
  }

  async findRelations(): Promise<Relation[]> {
    const results = await this.withClient(async (client) => {
      return await this.queryCypher<any>(client, `
        MATCH (a)-[r]->(b)
        WHERE r.knowledge_id = $knowledgeId
          AND r.ontology_id = $ontologyId
        RETURN r.id AS id,
               a.id AS source_id,
               b.id AS target_id,
               type(r) AS relation_id
        ORDER BY id
      `, {
        knowledgeId: this.knowledge.id,
        ontologyId: this.ontology?.id,
      });
    });

    return results.map((row: any) => ({
      id: row.id,
      sourceId: row.source_id,
      targetId: row.target_id,
      ontology: {
        id: row.relation_id,
        relationId: row.relation_id,
      },
    }));
  }

  async findContexts(): Promise<Context[]> {
    const results = await this.withClient(async (client) => {
      return await this.queryCypher<any>(client, `
        MATCH (n)
        WHERE n.knowledge_id = $knowledgeId
          AND n.ontology_id = $ontologyId
          AND n.is_context_hub = true
        RETURN n.id AS id,
               n.summary AS summary,
               n.context_id AS context_id
        ORDER BY n.summary
      `, {
        knowledgeId: this.knowledge.id,
        ontologyId: this.ontology?.id,
      });
    });

    return results.map((row: any) => ({
      id: row.id,
      summary: row.summary,
      ontology: {
        id: row.context_id,
        contextId: row.context_id,
      },
    }));
  }

  async findContextRelations(): Promise<ContextNodeRelation[]> {
    const results = await this.withClient(async (client) => {
      return await this.queryCypher<any>(client, `
        MATCH (c)-[r]->(n)
        WHERE r.knowledge_id = $knowledgeId
          AND r.ontology_id = $ontologyId
          AND r.is_context_edge = true
        RETURN r.id AS id,
               c.id AS context_id,
               n.id AS target_id,
               type(r) AS name
        ORDER BY r.id
      `, {
        knowledgeId: this.knowledge.id,
        ontologyId: this.ontology?.id,
      });
    });

    return results.map((row: any) => ({
      id: row.id,
      contextId: row.context_id,
      targetId: row.target_id,
      name: row.name,
    }));
  }

  private sanitizeLabel(raw: string): string {
    if (!raw) return 'Label';
    const cleaned = raw.trim().replace(/[^a-zA-Z0-9_]/g, '_');
    if (/^[0-9]/.test(cleaned)) {
      return '_' + cleaned.slice(0, 63);
    }
    return cleaned.slice(0, 63) || 'Label';
  }

  private async withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.db.getClient();
    try {
      await client.query("LOAD 'age';");
      await client.query('SET search_path = ag_catalog, "$user", public;');
      await this.ensureGraph(client);
      return await fn(client);
    } finally {
      client.release();
    }
  }

  private async queryCypher<T = any>(
    client: PoolClient,
    cypherQuery: string,
    params: Record<string, string | number | boolean | null | undefined>,
  ): Promise<T[]> {
    const keys = Object.keys(params);
    const values = keys.map((k) => params[k]);

    let sql = cypherQuery;
    for (let i = 0; i < keys.length; i++) {
      sql = sql.replace(`$${keys[i]}`, `$${i + 1}`);
    }

    const querySql = `SELECT * FROM cypher('${this.graphName}', $cypher$, $params$) as (result agtype);`;
    const res = await client.query(querySql, [sql, JSON.stringify(values)]);
    return res.rows.map((row) => this.parseAgtype(row.result));
  }

  private parseAgtype(value: any): any {
    if (!value) return null;
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/::[a-zA-Z0-9_]+$/g, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch {
        return value;
      }
    }
    return value;
  }

  private async ensureGraph(client: PoolClient): Promise<void> {
    const sql = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM ag_catalog.ag_graph WHERE name = $1) THEN
          PERFORM create_graph($1);
        END IF;
      END $$;
    `;
    await client.query(sql, [this.graphName]);
  }

  private async ensureVertexLabel(client: PoolClient, label: string): Promise<void> {
    const safeLabel = this.sanitizeLabel(label);
    const sql = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM ag_catalog.ag_label
          WHERE name = $1
            AND graph = (SELECT graphid FROM ag_catalog.ag_graph WHERE name = $2)
        ) THEN
          PERFORM create_vlabel($2, $1);
        END IF;
      END $$;
    `;
    await client.query(sql, [safeLabel, this.graphName]);
  }

  private async ensureEdgeLabel(client: PoolClient, label: string): Promise<void> {
    const safeLabel = this.sanitizeLabel(label);
    const sql = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM ag_catalog.ag_label
          WHERE name = $1
            AND graph = (SELECT graphid FROM ag_catalog.ag_graph WHERE name = $2)
        ) THEN
          PERFORM create_elabel($2, $1);
        END IF;
      END $$;
    `;
    await client.query(sql, [safeLabel, this.graphName]);
  }
}
