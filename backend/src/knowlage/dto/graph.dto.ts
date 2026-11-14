export interface KnowledgeGraphDocument {
  nodes: Node[];
  relations: Relation[];
  contexts: Context[];
}

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
  sourceNodeId: string;
  targetNodeId: string;
  ontology: {
    id: string;
    relationId: string;
  }
}

export interface Context {
    id: string;
    summary: string;
    ontology: {
        id: string;
        contextId: string;
    }
    nodes: ContextNodeRelation[];
}

export interface ContextNodeRelation {
    id: string;
    name: string;
    nodeId: string;
}