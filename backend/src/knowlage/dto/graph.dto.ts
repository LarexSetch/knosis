export interface KnowlageGraph {
  id: string;
  ontologyId: string;
  name: string;
  summary: string;
  nodes: Node[];
  relations: Relation[];
  contexts: Context[];
  contextRelations: ContextNodeRelation[];
}

export type KnowledgeGraphDocument = KnowlageGraph;
export type KnowledgeGraph = KnowlageGraph;

export interface Node {
  id: string;
  ontology: {
    id: string;
    elementId: string;
  };
  name: string;
  summary: string;
  value: string;
  meta: Meta;
}

export interface Meta {
  position: {
    x: number;
    y: number;
  };
}

export interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  ontology: {
    id: string;
    relationId: string;
  };
}

export interface Context {
  id: string;
  summary: string;
  ontology: {
    id: string;
    contextId: string;
  };
}

export interface ContextNodeRelation {
  id: string;
  name: string;
  sourceId: string;
  targetId: string;
}
