import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import type { OntologyEntity } from '../ontology/ontology.entity';
import type {
  Context,
  KnowlageGraph,
  Node,
  Relation,
} from './dto/graph.dto';
import type { KnowledgeEntity } from './knowledge.entity';

export interface GraphService {
  createNode(node: Node): Promise<void>;
  deleteNode(node: Node): Promise<void>;
  relate(source: Node, target: Node, relation?: Relation): Promise<void>;
  contextualize(context: Context, nodes: Node[]): Promise<void>;
  document(): Promise<KnowlageGraph>;
  saveGraph?(graph: KnowlageGraph): Promise<void>;
}

export class GraphServiceImpl implements GraphService {
  private readonly graphName: string;

  constructor(
    private readonly graph: KnowledgeEntity,
    private readonly repository: OntologyEntity,
    private readonly db: DatabaseService = new DatabaseService(),
  ) {
    this.graphName = process.env.AGE_GRAPH_NAME || 'knosis_graph';
  }

  /**
   * Creates or updates a node in Apache AGE.
   * Node label is determined by ontology:elementId (or ontology element name).
   * Node properties stored: id, name, summary, value, meta.
   */
  async createNode(node: Node): Promise<void> {
    const label = this.getNodeLabel(node);
    const knowledgeId = this.escapeCypher(this.graph?.id || '');
    const nodeId = this.escapeCypher(node.id);
    const name = this.escapeCypher(node.name || '');
    const summary = this.escapeCypher(node.summary || '');
    const value = this.escapeCypher(node.value || '');
    const metaJson = this.escapeCypher(JSON.stringify(node.meta || { position: { x: 0, y: 0 } }));
    const ontologyId = this.escapeCypher(node.ontology?.id || '');
    const elementId = this.escapeCypher(node.ontology?.elementId || '');

    await this.withClient(async (client) => {
      await this.ensureVertexLabel(client, label);

      const cypher = `
        MERGE (n:${label} { id: '${nodeId}' })
        SET n.name = '${name}',
            n.summary = '${summary}',
            n.value = '${value}',
            n.meta = '${metaJson}',
            n.knowledge_id = '${knowledgeId}',
            n.ontology_id = '${ontologyId}',
            n.element_id = '${elementId}'
        RETURN n
      `;
      await this.queryCypher(client, cypher);
    });
  }

  /**
   * Deletes a node and all its incoming/outgoing edges by node id.
   */
  async deleteNode(node: Node): Promise<void> {
    const nodeId = this.escapeCypher(node.id);

    await this.withClient(async (client) => {
      const cypher = `
        MATCH (n { id: '${nodeId}' })
        DETACH DELETE n
        RETURN count(n)
      `;
      await this.queryCypher(client, cypher);
    });
  }

  /**
   * Creates a relation between source and target nodes.
   * Relation label is determined by ontology.relationId.
   * Relation properties stored: only id (and knowledge_id for partitioning).
   */
  async relate(source: Node, target: Node, relation?: Relation): Promise<void> {
    const relLabel = this.getRelationLabel(source, target, relation);
    const relId = this.escapeCypher(relation?.id || randomUUID());
    const sourceId = this.escapeCypher(source.id);
    const targetId = this.escapeCypher(target.id);
    const knowledgeId = this.escapeCypher(this.graph?.id || '');

    await this.createNode(source);
    await this.createNode(target);

    await this.withClient(async (client) => {
      await this.ensureEdgeLabel(client, relLabel);

      const cypher = `
        MATCH (a { id: '${sourceId}' })
        MATCH (b { id: '${targetId}' })
        MERGE (a)-[r:${relLabel} { id: '${relId}' }]->(b)
        SET r.knowledge_id = '${knowledgeId}'
        RETURN r
      `;
      await this.queryCypher(client, cypher);
    });
  }

  /**
   * Creates a star-topology context linking common elements under a central context/tag hub.
   * Center: Context vertex (label from context.ontology.contextId).
   * Rays: Edges from the central hub to each related node in `nodes`.
   */
  async contextualize(context: Context, nodes: Node[]): Promise<void> {
    const contextLabel = this.getContextLabel(context);
    const contextId = this.escapeCypher(context.id);
    const summary = this.escapeCypher(context.summary || '');
    const ontologyId = this.escapeCypher(context.ontology?.id || '');
    const contextTypeId = this.escapeCypher(context.ontology?.contextId || '');
    const knowledgeId = this.escapeCypher(this.graph?.id || '');

    // Ensure all target nodes exist in the graph
    for (const node of nodes) {
      await this.createNode(node);
    }

    await this.withClient(async (client) => {
      await this.ensureVertexLabel(client, contextLabel);

      // Create central Context hub
      const hubCypher = `
        MERGE (c:${contextLabel} { id: '${contextId}' })
        SET c.summary = '${summary}',
            c.knowledge_id = '${knowledgeId}',
            c.ontology_id = '${ontologyId}',
            c.context_id = '${contextTypeId}',
            c.is_context_hub = 'true'
        RETURN c
      `;
      await this.queryCypher(client, hubCypher);

      // Create star-graph edges from central context hub to each node
      for (const node of nodes) {
        const relInfo = context.nodes?.find((r) => r.nodeId === node.id);
        const edgeId = this.escapeCypher(relInfo?.id || randomUUID());
        const edgeLabel = this.sanitizeLabel(relInfo?.name || 'CONTEXT_OF');
        const targetNodeId = this.escapeCypher(node.id);

        await this.ensureEdgeLabel(client, edgeLabel);

        const edgeCypher = `
          MATCH (c { id: '${contextId}' })
          MATCH (n { id: '${targetNodeId}' })
          MERGE (c)-[r:${edgeLabel} { id: '${edgeId}' }]->(n)
          SET r.knowledge_id = '${knowledgeId}'
          RETURN r
        `;
        await this.queryCypher(client, edgeCypher);
      }
    });
  }

  /**
   * Reads and reconstructs the KnowlageGraph document from Apache AGE.
   */
  async document(): Promise<KnowlageGraph> {
    const knowledgeId = this.escapeCypher(this.graph?.id || '');

    return this.withClient(async (client) => {
      // 1. Fetch all vertices for this knowledge graph
      const vertexCypher = knowledgeId
        ? `MATCH (n) WHERE n.knowledge_id = '${knowledgeId}' RETURN { v: n, lbls: labels(n) }`
        : `MATCH (n) RETURN { v: n, lbls: labels(n) }`;

      const vertexRows = await this.queryCypher<{ v: any; lbls: string[] }>(client, vertexCypher);

      // 2. Fetch all edges for this knowledge graph
      const edgeCypher = knowledgeId
        ? `MATCH (a)-[r]->(b) WHERE r.knowledge_id = '${knowledgeId}' RETURN { startId: a.id, edge: r, relType: type(r), endId: b.id }`
        : `MATCH (a)-[r]->(b) RETURN { startId: a.id, edge: r, relType: type(r), endId: b.id }`;

      const edgeRows = await this.queryCypher<{
        startId: string;
        edge: any;
        relType: string;
        endId: string;
      }>(client, edgeCypher);

      const nodes: Node[] = [];
      const contextHubs = new Map<string, { v: any; lbls: string[] }>();

      for (const row of vertexRows) {
        const v = row.v?.properties ?? row.v;
        const labels = row.lbls || [];
        if (v.is_context_hub === 'true' || v.context_id) {
          contextHubs.set(v.id, row);
        } else {
          nodes.push({
            id: v.id,
            name: v.name || '',
            summary: v.summary || '',
            value: v.value || '',
            meta: this.parseMeta(v.meta),
            ontology: {
              id: v.ontology_id || this.repository?.id || '',
              elementId: v.element_id || labels[0] || '',
            },
          });
        }
      }

      const relations: Relation[] = [];
      const contextNodesMap = new Map<string, Array<{ id: string; name: string; nodeId: string }>>();

      for (const row of edgeRows) {
        const edgeProps = row.edge?.properties ?? row.edge ?? {};
        const edgeId = edgeProps.id || String(row.edge?.id || randomUUID());
        const startId = String(row.startId);
        const endId = String(row.endId);
        const relType = row.relType;

        if (contextHubs.has(startId)) {
          // Part of star context graph
          const list = contextNodesMap.get(startId) || [];
          list.push({
            id: edgeId,
            name: relType,
            nodeId: endId,
          });
          contextNodesMap.set(startId, list);
        } else {
          relations.push({
            id: edgeId,
            sourceNodeId: startId,
            targetNodeId: endId,
            ontology: {
              id: this.repository?.id || '',
              relationId: relType,
            },
          });
        }
      }

      const contexts: Context[] = [];
      for (const [hubId, hub] of contextHubs.entries()) {
        const v = hub.v?.properties ?? hub.v;
        const labels = hub.lbls || [];
        contexts.push({
          id: hubId,
          summary: v.summary || '',
          ontology: {
            id: v.ontology_id || this.repository?.id || '',
            contextId: v.context_id || labels[0] || '',
          },
          nodes: contextNodesMap.get(hubId) || [],
        });
      }

      return {
        id: this.graph?.id || '',
        name: this.graph?.name || '',
        summary: this.graph?.summary || '',
        nodes,
        relations,
        contexts,
      };
    });
  }

  /**
   * Helper to persist an entire KnowlageGraph into Apache AGE.
   */
  async saveGraph(graph: KnowlageGraph): Promise<void> {
    if (graph.nodes) {
      for (const node of graph.nodes) {
        await this.createNode(node);
      }
    }

    if (graph.relations) {
      for (const rel of graph.relations) {
        const source = graph.nodes?.find((n) => n.id === rel.sourceNodeId) || {
          id: rel.sourceNodeId,
          name: '',
          summary: '',
          value: '',
          meta: { position: { x: 0, y: 0 } },
          ontology: { id: rel.ontology?.id || '', elementId: '' },
        };
        const target = graph.nodes?.find((n) => n.id === rel.targetNodeId) || {
          id: rel.targetNodeId,
          name: '',
          summary: '',
          value: '',
          meta: { position: { x: 0, y: 0 } },
          ontology: { id: rel.ontology?.id || '', elementId: '' },
        };
        await this.relate(source, target, rel);
      }
    }

    if (graph.contexts) {
      for (const ctx of graph.contexts) {
        const contextTargetNodes: Node[] = [];
        for (const cn of ctx.nodes || []) {
          const matched = graph.nodes?.find((n) => n.id === cn.nodeId) || {
            id: cn.nodeId,
            name: cn.name || '',
            summary: '',
            value: '',
            meta: { position: { x: 0, y: 0 } },
            ontology: { id: ctx.ontology?.id || '', elementId: '' },
          };
          contextTargetNodes.push(matched);
        }
        await this.contextualize(ctx, contextTargetNodes);
      }
    }
  }

  // --- Private Helpers ---

  private getNodeLabel(node: Node): string {
    const elementId = node.ontology?.elementId;
    if (this.repository?.data?.elements) {
      const el = this.repository.data.elements.find((e) => e.id === elementId);
      if (el?.name) {
        return this.sanitizeLabel(el.name);
      }
      if (el?.id) {
        return this.sanitizeLabel(el.id);
      }
    }
    return this.sanitizeLabel(elementId || 'Node');
  }

  private getRelationLabel(source: Node, target: Node, relation?: Relation): string {
    if (relation?.ontology?.relationId) {
      return this.sanitizeLabel(relation.ontology.relationId);
    }

    if (this.repository?.data?.relations) {
      const found = this.repository.data.relations.find(
        (r) =>
          r.sourceElementId === source.ontology?.elementId &&
          r.targetElementId === target.ontology?.elementId,
      );
      if (found?.name) {
        return this.sanitizeLabel(found.name);
      }
      if (found?.id) {
        return this.sanitizeLabel(found.id);
      }
    }

    return 'RELATES_TO';
  }

  private getContextLabel(context: Context): string {
    if (context.ontology?.contextId) {
      if (this.repository?.data?.contexts) {
        const found = this.repository.data.contexts.find((c) => c.id === context.ontology?.contextId);
        if (found?.name) {
          return this.sanitizeLabel(found.name);
        }
      }
      return this.sanitizeLabel(context.ontology.contextId);
    }
    return 'Context';
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

  private parseMeta(raw: any): { position: { x: number; y: number } } {
    if (!raw) return { position: { x: 0, y: 0 } };
    if (typeof raw === 'object' && raw.position) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.position) return parsed;
      } catch {
        // fallback
      }
    }
    return { position: { x: 0, y: 0 } };
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

  private async queryCypher<T = any>(client: PoolClient, cypherQuery: string): Promise<T[]> {
    const sql = `SELECT * FROM cypher('${this.graphName}', $cypher$ ${cypherQuery} $cypher$) as (result agtype);`;
    const res = await client.query(sql);
    return res.rows.map((row) => this.parseAgtype(row.result));
  }

  private async ensureGraph(client: PoolClient): Promise<void> {
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM ag_catalog.ag_graph WHERE name = '${this.graphName}') THEN
          PERFORM create_graph('${this.graphName}');
        END IF;
      END $$;
    `);
  }

  private async ensureVertexLabel(client: PoolClient, label: string): Promise<void> {
    const safeLabel = this.sanitizeLabel(label);
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM ag_catalog.ag_label
          WHERE name = '${safeLabel}'
            AND graph = (SELECT graphid FROM ag_catalog.ag_graph WHERE name = '${this.graphName}')
        ) THEN
          PERFORM create_vlabel('${this.graphName}', '${safeLabel}');
        END IF;
      END $$;
    `);
  }

  private async ensureEdgeLabel(client: PoolClient, label: string): Promise<void> {
    const safeLabel = this.sanitizeLabel(label);
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM ag_catalog.ag_label
          WHERE name = '${safeLabel}'
            AND graph = (SELECT graphid FROM ag_catalog.ag_graph WHERE name = '${this.graphName}')
        ) THEN
          PERFORM create_elabel('${this.graphName}', '${safeLabel}');
        END IF;
      END $$;
    `);
  }
}
