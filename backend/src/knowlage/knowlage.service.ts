import type { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import type { OntologyEntity } from '../ontology/ontology.entity';
import type {
  Context,
  ContextNodeRelation,
  Node,
  Relation,
} from './dto/graph.dto';
import type { KnowledgeEntity } from './knowledge.entity';

export interface GraphService {
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
  private readonly graphName: string;

  constructor(
    private readonly knowledge: KnowledgeEntity,
    private readonly ontology: OntologyEntity,
    private readonly db: DatabaseService = new DatabaseService(),
  ) {
    this.graphName = process.env.AGE_GRAPH_NAME || 'knosis_graph';
  }

  async createNode(node: Node): Promise<void> {
    const label = this.sanitizeLabel(node.ontology.elementId);
    await this.withClient(async (client) => {
      await this.ensureVertexLabel(client, label);
      await this.queryCypher(client, `
        MERGE (n:${label} { id: '{nodeId}' })
        SET n.name = '{name}',
            n.summary = '{summary}',
            n.value = '{value}',
            n.meta = '{metaJson}',
            n.knowledge_id = '{knowledgeId}',
            n.ontology_id = '{ontologyId}',
            n.element_id = '{elementId}'
        RETURN n
      `, {
        nodeId: node.id,
        name: node.name,
        summary: node.summary,
        value: node.value,
        metaJson: JSON.stringify(node.meta),
        knowledgeId: this.knowledge.id,
        ontologyId: this.ontology.id,
        elementId: node.ontology.elementId,
      });
    });
  }

  async deleteNode(node: Node): Promise<void> {
    await this.withClient(async (client) => {
      await this.queryCypher(client, `
        MATCH (n { id: '{nodeId}' })
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
        MATCH (a { id: '{sourceId}' })
        MATCH (b { id: '{targetId}' })
        MERGE (a)-[r:${label} { id: '{relationId}' }]->(b)
        SET r.knowledge_id = '{knowledgeId}'
            r.ontology_id = '{ontologyId}'
        RETURN r
      `, {
        relationId: relation.id,
        sourceId: relation.sourceId,
        targetId: relation.targetId,
        knowledgeId: this.knowledge.id,
        ontologyId: this.ontology.id,
      });
    });
  }

  async contextualize(context: Context, relations: ContextNodeRelation[]): Promise<void> {
    const contextLabel = this.sanitizeLabel(context.ontology.contextId);
    await this.withClient(async (client) => {
      await this.ensureVertexLabel(client, contextLabel);
      await this.queryCypher(client, `
        MERGE (c:${contextLabel} { id: '{contextId}' })
        SET c.summary = '{summary}',
            c.knowledge_id = '{knowledgeId}',
            c.ontology_id = '{ontologyId}',
            c.context_id = '{contextTypeId}',
            c.is_context_hub = 'true'
        RETURN c
      `, {
        contextId: context.id,
        summary: context.summary,
        knowledgeId: this.knowledge.id,
        ontologyId: this.ontology.id,
        contextTypeId: context.ontology.contextId,
      });

      for (const relation of relations) {
        const edgeLabel = this.sanitizeLabel(context.ontology.contextId);
        await this.ensureEdgeLabel(client, edgeLabel);
        await this.queryCypher(client, `
          MATCH (c { id: '{contextId}' })
          MATCH (n { id: '{targetId}' })
          MERGE (c)-[r:${edgeLabel} { id: '{relationId}' }]->(n)
          SET r.knowledge_id = '{knowledgeId}',
              r.ontology_id = '{ontologyId}',
              r.is_context_edge = 'true'
          RETURN r
        `, {
          contextId: context.id,
          targetId: relation.targetId,
          relationId: relation.id,
          knowledgeId: this.knowledge.id,
          ontologyId: this.ontology.id,
        });
      }
    });
  }

  async findNodes(): Promise<Node[]> {
    const results = await this.withClient(async (client) => {
      return await this.queryCypher<any>(client, `
        MATCH (n)
        WHERE n.knowledge_id = '{knowledgeId}' AND n.ontology_id = '{ontologyId}'
        RETURN n.id AS id,
               n.element_id AS element_id,
               n.name AS name,
               n.summary AS summary,
               n.value AS value,
               n.meta AS meta
        ORDER BY n.name
      `, {
        knowledgeId: this.knowledge.id,
        ontologyId: this.ontology.id,
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
        WHERE r.knowledge_id = '{knowledgeId}' AND r.ontology_id = '{ontologyId}'
        RETURN r.id AS id,
               a.id AS source_id,
               b.id AS target_id,
               type(r) AS relation_id
        ORDER BY id
      `, {
        knowledgeId: this.knowledge.id,
        ontologyId: this.ontology.id,
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
        WHERE n.knowledge_id = '{knowledgeId}'
          AND n.ontology_id = '{ontologyId}'
          AND n.is_context_hub = 'true'
        RETURN n.id AS id,
               n.summary AS summary,
               n.context_id AS context_id
        ORDER BY n.summary
      `, {
        knowledgeId: this.knowledge.id,
        ontologyId: this.ontology.id,
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
        WHERE r.knowledge_id = '{knowledgeId}'
          AND r.ontology_id = '{ontologyId}'
          AND r.is_context_edge = 'true'
        RETURN r.id AS id,
               c.id AS context_id,
               n.id AS target_id,
               type(r) AS name
        ORDER BY r.id
      `, {
        knowledgeId: this.knowledge.id,
        ontologyId: this.ontology.id,
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
      return `_${cleaned}`.slice(0, 63);
    }
    return cleaned.slice(0, 63) || 'Label';
  }

  private escapeCypher(value: string | undefined | null): string {
    if (value === undefined || value === null) return '';
    return String(value)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
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
    substitutions?: Record<string, string>,
  ): Promise<T[]> {
    const escaped = this.escapeAndSubstitute(cypherQuery, substitutions);
    const sql = `SELECT * FROM cypher('${this.graphName}', $cypher$ ${escaped} $cypher$) as (result agtype);`;
    const res = await client.query(sql);
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

  private escapeAndSubstitute(query: string, substitutions?: Record<string, string>): string {
    if (!substitutions) return query;
    let result = query;
    for (const [key, value] of Object.entries(substitutions)) {
      const escaped = this.escapeCypher(value);
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), escaped);
    }
    return result;
  }

  private async ensureGraph(client: PoolClient): Promise<void> {
    const sql = this.escapeAndSubstitute(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM ag_catalog.ag_graph WHERE name = '{graphName}') THEN
          PERFORM create_graph('{graphName}');
        END IF;
      END $$;
    `, { graphName: this.graphName });
    await client.query(sql);
  }

  private async ensureVertexLabel(client: PoolClient, label: string): Promise<void> {
    const safeLabel = this.sanitizeLabel(label);
    const sql = this.escapeAndSubstitute(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM ag_catalog.ag_label
          WHERE name = '{label}'
            AND graph = (SELECT graphid FROM ag_catalog.ag_graph WHERE name = '{graphName}')
        ) THEN
          PERFORM create_vlabel('{graphName}', '{label}');
        END IF;
      END $$;
    `, { label: safeLabel, graphName: this.graphName });
    await client.query(sql);
  }

  private async ensureEdgeLabel(client: PoolClient, label: string): Promise<void> {
    const safeLabel = this.sanitizeLabel(label);
    const sql = this.escapeAndSubstitute(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM ag_catalog.ag_label
          WHERE name = '{label}'
            AND graph = (SELECT graphid FROM ag_catalog.ag_graph WHERE name = '{graphName}')
        ) THEN
          PERFORM create_elabel('{graphName}', '{label}');
        END IF;
      END $$;
    `, { label: safeLabel, graphName: this.graphName });
    await client.query(sql);
  }
}
