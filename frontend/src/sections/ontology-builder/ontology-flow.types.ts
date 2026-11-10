import type { Edge, Node } from '@xyflow/react';
import type {
  OntologyAssociation,
  OntologyNodeStatus,
  OntologyProperty,
  OntologyRelationship,
} from '../../../../backend/src/ontology/ontology.types';

export interface OntologyFlowNodeData extends Record<string, unknown> {
  color: string;
  name: string;
  description: string;
  status: OntologyNodeStatus;
  properties: OntologyProperty[];
  associations: OntologyAssociation[];
}

export interface OntologyFlowRelationshipData extends Record<string, unknown> {
  relation: string;
  description: string;
  properties: OntologyProperty[];
}

export type OntologyFlowNode = Node<OntologyFlowNodeData, 'ontology'>;

export type OntologyFlowRelationship = Edge<
  OntologyFlowRelationshipData,
  string | undefined
>;
