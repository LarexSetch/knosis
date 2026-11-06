import type { Edge, Node } from '@xyflow/react';

export type OntologyPropertyType = 'string' | 'number' | 'boolean';

export enum OntologyNodeIcon {
  ASSOCIATIONS = 'ASSOCIATIONS',
  DETACHED = 'DETACHED',
}

export interface OntologyProperty {
  name: string;
  type: OntologyPropertyType;
  description: string;
}

export interface OntologyNodeData extends Record<string, unknown> {
  color: string;
  name: string;
  description: string;
  icons: OntologyNodeIcon[];
  properties: OntologyProperty[];
}

export type OntologyFlowNode = Node<OntologyNodeData, 'ontology'>;

export interface OntologyRelationshipData extends Record<string, unknown> {
  description?: string;
}

export type OntologyRelationship = Edge<OntologyRelationshipData>;
