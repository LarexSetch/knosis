export interface OntologyDocument {
  metadata: OntologyMetadata;
  nodes: OntologyNode[];
  relationships: OntologyRelationship[];
}

export interface OntologyMetadata {
  name: string;
  version: string;
  generatedAt: string;
}

export interface OntologyNode {
  id: string;
  name: string;
  description: string;
  properties: OntologyProperty[];
  status: OntologyNodeStatus;
  associations: OntologyAssociation[];
  meta: OntologyNodeMeta;
}

export interface OntologyRelationship {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relation: string;
  description: string;
}

export interface OntologyProperty {
  name: string;
  type: OntologyPropertyType;
  required?: boolean;
  description: string;
}

export enum OntologyNodeStatus {
  ASSOCIATED = 'associated',
  RELATED = 'related',
  DETACHED = 'detached',
}

export type OntologyPropertyType = 'string' | 'number' | 'boolean';

export interface OntologyAssociation {
  id: string;
  relation: string;
  description: string;
  nodeIds: string[];
  nodesAll: boolean;
}

export interface OntologyNodeMeta {
  color: string;
  position: {
    x: number;
    y: number;
  };
}
