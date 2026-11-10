import type { Node } from '@xyflow/react';
import type { OntologyPropertyType } from '../../../../backend/src/ontology/ontology.types';

export interface KnowledgeGraphDataProperty {
  name: string;
  value: unknown;
  type?: OntologyPropertyType;
}

export interface KnowledgeGraphNodeData extends Record<string, unknown> {
  ontologyNodeName: string;
  title: string;
  color: string;
  properties: KnowledgeGraphDataProperty[];
}

export type KnowledgeGraphFlowNode = Node<
  KnowledgeGraphNodeData,
  'knowledgeGraph'
>;
