import type { KnowledgeGraphDocument } from './knowledge-graph.types';

export const KNOWLEDGE_GRAPH_STORAGE = Symbol('KNOWLEDGE_GRAPH_STORAGE');

export function isValidKnowledgeGraphId(id: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(id);
}

export interface KnowledgeGraphStorage {
  save(id: string, graph: KnowledgeGraphDocument): Promise<void>;
  load(id: string): Promise<KnowledgeGraphDocument | null>;
}
