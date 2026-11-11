import { MarkerType } from '@xyflow/react';
import {
  OntologyNodeStatus,
  type OntologyDocument,
  type OntologyMetadata,
  type OntologyNode,
  type OntologyRelationship,
} from '../../../../backend/src/ontology/ontology.types';
import type {
  OntologyNodeWrapper,
  OntologyRelationshipWrapper,
} from './ontology-flow.types';

const DEFAULT_NODE_COLOR = '#789a83';

export function mapGraphToOntology(
  nodes: OntologyNodeWrapper[],
  edges: OntologyRelationshipWrapper[],
  metadata: OntologyMetadata,
): OntologyDocument {
  const relatedNodeIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
  const associatedNodeIds = new Set<string>();
  for (const node of nodes) {
    for (const association of node.data.ontologyNode.associations) {
      const targetIds = association.nodesAll
        ? nodes.map((targetNode) => targetNode.id)
        : association.nodeIds;
      if (targetIds.length > 0) {
        associatedNodeIds.add(node.id);
        targetIds.forEach((targetId) => associatedNodeIds.add(targetId));
      }
    }
  }

  return {
    metadata,
    nodes: nodes.map((node): OntologyNode => ({
      ...node.data.ontologyNode,
      id: node.id,
      status: associatedNodeIds.has(node.id)
        ? OntologyNodeStatus.ASSOCIATED
        : relatedNodeIds.has(node.id)
          ? OntologyNodeStatus.RELATED
          : OntologyNodeStatus.DETACHED,
      meta: {
        ...node.data.ontologyNode.meta,
        position: { x: node.position.x, y: node.position.y },
      },
    })),
    relationships: edges.map((edge): OntologyRelationship => ({
      ...edge.data.ontologyRelationship,
      id: edge.id,
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
    })),
  };
}

export function mapOntologyToGraph(ontology: OntologyDocument): {
  nodes: OntologyNodeWrapper[];
  edges: OntologyRelationshipWrapper[];
} {
  const edges: OntologyRelationshipWrapper[] = [];
  for (const relationship of ontology.relationships) {
    edges.push({
      id: relationship.id,
      source: relationship.sourceNodeId,
      target: relationship.targetNodeId,
      label: relationship.relation,
      data: {
        ontologyRelationship: {
          id: relationship.id,
          sourceNodeId: relationship.sourceNodeId,
          targetNodeId: relationship.targetNodeId,
          relation: relationship.relation,
          description: relationship.description,
        },
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#548064' },
    });
  }

  const relatedNodeIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
  const associatedNodeIds = new Set<string>();
  for (const node of ontology.nodes) {
    for (const association of node.associations) {
      const targetIds = association.nodesAll
        ? ontology.nodes.map((targetNode) => targetNode.id)
        : association.nodeIds;
      if (targetIds.length > 0) {
        associatedNodeIds.add(node.id);
        targetIds.forEach((targetId) => associatedNodeIds.add(targetId));
      }
    }
  }

  const nodes: OntologyNodeWrapper[] = ontology.nodes.map((node) => {
    return {
      id: node.id,
      type: 'ontology',
      draggable: true,
      deletable: false,
      position: {
        x: node.meta.position.x,
        y: node.meta.position.y,
      },
      data: {
        ontologyNode: {
          ...node,
          associations: node.associations.map((association, index) => ({
            ...association,
            id: association.id || `legacy-${node.id}-${index}`,
          })),
          status: associatedNodeIds.has(node.id)
            ? OntologyNodeStatus.ASSOCIATED
            : relatedNodeIds.has(node.id)
              ? OntologyNodeStatus.RELATED
              : OntologyNodeStatus.DETACHED,
          meta: {
            ...node.meta,
            color: node.meta.color || DEFAULT_NODE_COLOR,
          },
        },
      },
    };
  });

  return { nodes, edges };
}
