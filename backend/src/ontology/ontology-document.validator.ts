import type {
  OntologyDocument,
  OntologyNodeStatus,
  OntologyPropertyType,
} from './ontology.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOntologyPropertyType(value: unknown): value is OntologyPropertyType {
  return value === 'string' || value === 'number' || value === 'boolean';
}

function isOntologyNodeStatus(value: unknown): value is OntologyNodeStatus {
  return value === 'associated' || value === 'related' || value === 'detached';
}

function isOntologyProperty(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    isOntologyPropertyType(value.type) &&
    typeof value.description === 'string' &&
    (value.required === undefined || typeof value.required === 'boolean')
  );
}

export function isOntologyDocument(value: unknown): value is OntologyDocument {
  if (
    !isRecord(value) ||
    !isRecord(value.metadata) ||
    typeof value.metadata.name !== 'string' ||
    typeof value.metadata.version !== 'string' ||
    typeof value.metadata.generatedAt !== 'string' ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.relationships)
  ) {
    return false;
  }

  const nodeIds = new Set<string>();
  for (const node of value.nodes) {
    if (
      !isRecord(node) ||
      typeof node.id !== 'string' ||
      typeof node.name !== 'string' ||
      typeof node.description !== 'string' ||
      !isOntologyNodeStatus(node.status) ||
      !isRecord(node.meta) ||
      typeof node.meta.color !== 'string' ||
      !isRecord(node.meta.position) ||
      typeof node.meta.position.x !== 'number' ||
      !Number.isFinite(node.meta.position.x) ||
      typeof node.meta.position.y !== 'number' ||
      !Number.isFinite(node.meta.position.y) ||
      !Array.isArray(node.properties) ||
      !node.properties.every(isOntologyProperty) ||
      !Array.isArray(node.associations) ||
      !node.associations.every(
        (association) =>
          isRecord(association) &&
          typeof association.id === 'string' &&
          typeof association.relation === 'string' &&
          typeof association.description === 'string' &&
          Array.isArray(association.nodeIds) &&
          association.nodeIds.every((nodeId) => typeof nodeId === 'string') &&
          typeof association.nodesAll === 'boolean',
      )
    ) {
      return false;
    }
    nodeIds.add(node.id);
  }

  const associationsAreValid = value.nodes.every(
    (node) =>
      isRecord(node) &&
      Array.isArray(node.associations) &&
      node.associations.every(
        (association) =>
          isRecord(association) &&
          Array.isArray(association.nodeIds) &&
          association.nodeIds.every(
            (nodeId) => typeof nodeId === 'string' && nodeIds.has(nodeId),
          ),
      ),
  );

  return (
    associationsAreValid &&
    value.relationships.every(
      (relationship) =>
        isRecord(relationship) &&
        typeof relationship.id === 'string' &&
        typeof relationship.sourceNodeId === 'string' &&
        nodeIds.has(relationship.sourceNodeId) &&
        typeof relationship.targetNodeId === 'string' &&
        nodeIds.has(relationship.targetNodeId) &&
        typeof relationship.relation === 'string' &&
        typeof relationship.description === 'string',
    )
  );
}

export function normalizeOntologyDocument(value: unknown): unknown {
  if (!isRecord(value) || !Array.isArray(value.nodes)) {
    return value;
  }

  const nodes = value.nodes.map((node) => {
    if (!isRecord(node) || !Array.isArray(node.associations)) {
      return node;
    }

    return {
      ...node,
      associations: node.associations.map((association, index) => {
        if (
          !isRecord(association) ||
          association.id !== undefined ||
          typeof node.id !== 'string'
        ) {
          return association;
        }
        return { ...association, id: `legacy-${node.id}-${index}` };
      }),
    };
  });

  const relationships = Array.isArray(value.relationships)
    ? value.relationships.map((relationship) => {
        if (!isRecord(relationship)) {
          return relationship;
        }
        return Object.fromEntries(
          Object.entries(relationship).filter(([key]) => key !== 'properties'),
        );
      })
    : value.relationships;

  return { ...value, nodes, relationships };
}
