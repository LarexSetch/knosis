import { MarkerType } from '@xyflow/react';
import {
  OntologyNodeStatus,
  type OntologyDocument,
  type OntologyMetadata,
  type OntologyProperty,
  type OntologyRelationship,
} from '../../../../backend/src/ontology/ontology.types';
import type {
  OntologyFlowNode,
  OntologyFlowRelationship,
} from './ontology-flow.types';

const DEFAULT_NODE_COLOR = '#789a83';

function mapPropertyToDocument(
  property: OntologyProperty,
): OntologyProperty {
  return {
    name: property.name,
    type: property.type,
    required: property.required ?? false,
    description: property.description,
  };
}

function mapDocumentToProperty(
  property: OntologyProperty,
): OntologyProperty {
  return {
    name: property.name,
    type: property.type,
    required: property.required,
    description: property.description,
  };
}

export function mapGraphToOntology(
  nodes: OntologyFlowNode[],
  edges: OntologyFlowRelationship[],
  metadata: OntologyMetadata,
): OntologyDocument {
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error(`Связь "${edge.id}" ссылается на отсутствующую ноду.`);
    }

  }

  const relatedNodeIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
  const associatedNodeIds = new Set<string>();
  for (const node of nodes) {
    for (const association of node.data.associations) {
      const targetIds = association.nodesAll
        ? nodes.map((targetNode) => targetNode.id)
        : association.nodeIds;
      if (targetIds.some((targetId) => !nodeIds.has(targetId))) {
        throw new Error(
          `Ассоциация "${association.relation}" ссылается на отсутствующую ноду.`,
        );
      }
      if (targetIds.length > 0) {
        associatedNodeIds.add(node.id);
        targetIds.forEach((targetId) => associatedNodeIds.add(targetId));
      }
    }
  }

  return {
    metadata,
    nodes: nodes.map((node) => ({
      id: node.id,
      name: node.data.name,
      description: node.data.description,
      properties: node.data.properties.map(mapPropertyToDocument),
      status: associatedNodeIds.has(node.id)
        ? OntologyNodeStatus.ASSOCIATED
        : relatedNodeIds.has(node.id)
          ? OntologyNodeStatus.RELATED
          : OntologyNodeStatus.DETACHED,
      associations: node.data.associations,
      meta: {
        color: node.data.color,
        position: { x: node.position.x, y: node.position.y },
      },
    })),
    relationships: edges.map((edge) => ({
      id: edge.id,
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
      relation: edge.data?.relation ?? '',
      properties: (edge.data?.properties ?? []).map(mapPropertyToDocument),
      description: edge.data?.description ?? '',
    })),
  };
}

export function mapOntologyToGraph(ontology: OntologyDocument): {
  nodes: OntologyFlowNode[];
  edges: OntologyFlowRelationship[];
} {
  const edges: OntologyFlowRelationship[] = [];
  for (const relationship of ontology.relationships) {
    if (!ontology.nodes.some((node) => node.id === relationship.sourceNodeId) ||
      !ontology.nodes.some((node) => node.id === relationship.targetNodeId)) {
      throw new Error(
        `Связь "${relationship.id}" ссылается на отсутствующую ноду.`,
      );
    }

    edges.push({
      id: relationship.id,
      source: relationship.sourceNodeId,
      target: relationship.targetNodeId,
      label: relationship.relation,
      data: {
        relation: relationship.relation,
        description: relationship.description,
        properties: relationship.properties.map(mapDocumentToProperty),
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#548064' },
    });
  }

  const relatedNodeIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
  const associatedNodeIds = new Set<string>();
  const ontologyNodeIds = new Set(ontology.nodes.map((node) => node.id));
  for (const node of ontology.nodes) {
    for (const association of node.associations) {
      const targetIds = association.nodesAll
        ? ontology.nodes.map((targetNode) => targetNode.id)
        : association.nodeIds;
      if (targetIds.some((targetId) => !ontologyNodeIds.has(targetId))) {
        throw new Error(
          `Ассоциация "${association.relation}" ссылается на отсутствующую ноду.`,
        );
      }
      if (targetIds.length > 0) {
        associatedNodeIds.add(node.id);
        targetIds.forEach((targetId) => associatedNodeIds.add(targetId));
      }
    }
  }

  const nodes: OntologyFlowNode[] = ontology.nodes.map((node) => {
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
        color: node.meta.color || DEFAULT_NODE_COLOR,
        name: node.name,
        description: node.description,
        status: associatedNodeIds.has(node.id)
          ? OntologyNodeStatus.ASSOCIATED
          : relatedNodeIds.has(node.id)
            ? OntologyNodeStatus.RELATED
            : OntologyNodeStatus.DETACHED,
        properties: node.properties.map(mapDocumentToProperty),
        associations: node.associations,
      },
    };
  });

  return { nodes, edges };
}
