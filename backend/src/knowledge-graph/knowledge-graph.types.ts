export interface KnowledgeGraphDocument {
  nodes: KnowledgeGraphNode[];
  relations: KnowledgeGraphRelation[];
  associations: KnowledgeGraphAssociation[];
}

export interface KnowledgeGraphNode {
  id: string;
  ontologyNodeId: string;
  name: string;
  properties: Record<string, unknown>;
  meta: KnowledgeGraphNodeMeta;
}

export interface KnowledgeGraphNodeMeta {
  position: {
    x: number;
    y: number;
  };
}

export interface KnowledgeGraphRelation {
  sourceNodeId: string;
  targetNodeId: string;
  ontologyRelationId: string;
}

export interface KnowledgeGraphAssociation {
  ontologyAssociationId: string;
  sourceNodeId: string;
  targetNodeId: string;
}
