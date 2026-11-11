import type { Edge, Node } from '@xyflow/react';
import type {
  OntologyNode,
  OntologyRelationship,
} from '../../../../backend/src/ontology/ontology.types';

export interface OntologyNodeWrapperData extends Record<string, unknown> {
  ontologyNode: OntologyNode;
}

export interface OntologyRelationshipWrapperData
  extends Record<string, unknown> {
  ontologyRelationship: OntologyRelationship;
}

export type OntologyNodeWrapper = Node<
  OntologyNodeWrapperData,
  'ontology'
> & { data: OntologyNodeWrapperData };

export type OntologyRelationshipWrapper = Edge<
  OntologyRelationshipWrapperData,
  string | undefined
> & { data: OntologyRelationshipWrapperData };
