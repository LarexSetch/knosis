import type { OntologyPropertyType } from './ontology-types';

export type OntologyRelationshipType = 'association' | 'relation';

export interface OntologyMetadata {
  name: string;
  version: string;
  generatedAt: string;
}

export interface OntologyDocumentProperty {
  name: string;
  type: OntologyPropertyType;
  required: boolean;
  description: string;
}

export interface OntologyDocumentNode {
  id: string;
  name: string;
  color: string;
  description: string;
  properties: OntologyDocumentProperty[];
}

export interface OntologyDocumentRelationship {
  id: string;
  type: OntologyRelationshipType;
  sourceNodeId: string;
  targetNodeId: string;
  relationName: string;
  properties: OntologyDocumentProperty[];
  description: string;
}

export interface OntologyDocument {
  metadata: OntologyMetadata;
  nodes: OntologyDocumentNode[];
  relationships: OntologyDocumentRelationship[];
}
