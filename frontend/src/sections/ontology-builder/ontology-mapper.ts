import {
  MarkerType,
  type XYPosition,
} from '@xyflow/react';
import type {
  OntologyDocument,
  OntologyDocumentNode,
  OntologyDocumentProperty,
  OntologyDocumentRelationship,
  OntologyMetadata,
} from './ontology-document.types';
import {
  OntologyNodeIcon,
  type OntologyFlowNode,
  type OntologyProperty,
  type OntologyRelationship,
} from './ontology-types';

const DEFAULT_NODE_COLOR = '#789a83';

function mapPropertyToDocument(
  property: OntologyProperty,
): OntologyDocumentProperty {
  return {
    name: property.name,
    type: property.type,
    required: property.required ?? false,
    description: property.description,
  };
}

function mapDocumentToProperty(
  property: OntologyDocumentProperty,
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
  edges: OntologyRelationship[],
  metadata: OntologyMetadata,
): OntologyDocument {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const relationships: OntologyDocumentRelationship[] = [];

  for (const node of nodes) {
    node.data.associations.forEach((association, associationIndex) => {
      const targets = association.targetsAll
        ? nodes.map((targetNode) => targetNode.id)
        : association.targets;

      for (const targetNodeId of new Set(targets)) {
        if (!nodeIds.has(targetNodeId)) {
          throw new Error(
            `Ассоциация "${association.relation}" ссылается на отсутствующую ноду "${targetNodeId}".`,
          );
        }

        relationships.push({
          id: `${node.id}:association:${associationIndex}:${targetNodeId}`,
          type: 'association',
          sourceNodeId: node.id,
          targetNodeId,
          relationName: association.relation,
          properties: [],
          description: association.description,
        });
      }
    });
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error(`Связь "${edge.id}" ссылается на отсутствующую ноду.`);
    }

    relationships.push({
      id: edge.id,
      type: 'relation',
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
      relationName: edge.data?.relation ?? '',
      properties: (edge.data?.properties ?? []).map(mapPropertyToDocument),
      description: edge.data?.description ?? '',
    });
  }

  return {
    metadata,
    nodes: nodes.map((node) => ({
      id: node.id,
      name: node.data.name,
      color: node.data.color,
      description: node.data.description,
      positionX: node.position.x,
      positionY: node.position.y,
      properties: node.data.properties.map(mapPropertyToDocument),
    })),
    relationships,
  };
}

function getNodePosition(index: number): XYPosition {
  return {
    x: 80 + (index % 3) * 300,
    y: 80 + Math.floor(index / 3) * 220,
  };
}

export function mapOntologyToGraph(ontology: OntologyDocument): {
  nodes: OntologyFlowNode[];
  edges: OntologyRelationship[];
} {
  const associationsByNode = new Map<
    string,
    OntologyFlowNode['data']['associations']
  >();

  for (const node of ontology.nodes) {
    associationsByNode.set(node.id, []);
  }

  const edges: OntologyRelationship[] = [];
  for (const relationship of ontology.relationships) {
    if (
      !associationsByNode.has(relationship.sourceNodeId) ||
      !associationsByNode.has(relationship.targetNodeId)
    ) {
      throw new Error(
        `Связь "${relationship.id}" ссылается на отсутствующую ноду.`,
      );
    }

    if (relationship.type === 'association') {
      const sourceAssociations = associationsByNode.get(
        relationship.sourceNodeId,
      );
      if (!sourceAssociations) {
        throw new Error(`Не найдена исходная нода связи "${relationship.id}".`);
      }

      const existing = sourceAssociations.find(
        (association) =>
          association.relation === relationship.relationName &&
          association.description === relationship.description,
      );
      if (existing) {
        if (!existing.targets.includes(relationship.targetNodeId)) {
          existing.targets.push(relationship.targetNodeId);
        }
      } else {
        sourceAssociations.push({
          relation: relationship.relationName,
          description: relationship.description,
          targets: [relationship.targetNodeId],
          targetsAll: false,
        });
      }
      continue;
    }

    edges.push({
      id: relationship.id,
      source: relationship.sourceNodeId,
      target: relationship.targetNodeId,
      label: relationship.relationName,
      data: {
        relation: relationship.relationName,
        description: relationship.description,
        properties: relationship.properties.map(mapDocumentToProperty),
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#548064' },
    });
  }

  const connectedNodeIds = new Set(
    edges.flatMap((edge) => [edge.source, edge.target]),
  );
  for (const [sourceNodeId, associations] of associationsByNode) {
    if (associations.length > 0) {
      connectedNodeIds.add(sourceNodeId);
      associations.forEach((association) =>
        association.targets.forEach((targetNodeId) =>
          connectedNodeIds.add(targetNodeId),
        ),
      );
    }
  }

  const nodes: OntologyFlowNode[] = ontology.nodes.map((node, index) => {
    const associations = associationsByNode.get(node.id) ?? [];
    const defaultPosition = getNodePosition(index);
    return {
      id: node.id,
      type: 'ontology',
      draggable: true,
      deletable: false,
      position: {
        x: node.positionX ?? defaultPosition.x,
        y: node.positionY ?? defaultPosition.y,
      },
      data: {
        color: node.color || DEFAULT_NODE_COLOR,
        name: node.name,
        description: node.description,
        icons: connectedNodeIds.has(node.id)
          ? [OntologyNodeIcon.ASSOCIATIONS]
          : [OntologyNodeIcon.DETACHED],
        properties: node.properties.map(mapDocumentToProperty),
        associations,
      },
    };
  });

  return { nodes, edges };
}
