import type { KnowledgeGraphDocument } from './knowledge-graph.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isKnowledgeGraphDocument(
  value: unknown,
): value is KnowledgeGraphDocument {
  if (
    !isRecord(value) ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.relations) ||
    !Array.isArray(value.associations)
  ) {
    return false;
  }

  const nodeIds = new Set<string>();
  for (const node of value.nodes) {
    if (
      !isRecord(node) ||
      typeof node.id !== 'string' ||
      typeof node.ontologyNodeId !== 'string' ||
      typeof node.name !== 'string' ||
      !isRecord(node.properties) ||
      !isRecord(node.meta) ||
      !isRecord(node.meta.position) ||
      typeof node.meta.position.x !== 'number' ||
      !Number.isFinite(node.meta.position.x) ||
      typeof node.meta.position.y !== 'number' ||
      !Number.isFinite(node.meta.position.y) ||
      nodeIds.has(node.id)
    ) {
      return false;
    }
    nodeIds.add(node.id);
  }

  return (
    value.relations.every(
      (relation) =>
        isRecord(relation) &&
        typeof relation.sourceNodeId === 'string' &&
        nodeIds.has(relation.sourceNodeId) &&
        typeof relation.targetNodeId === 'string' &&
        nodeIds.has(relation.targetNodeId) &&
        typeof relation.ontologyRelationId === 'string',
    ) &&
    value.associations.every(
      (association) =>
        isRecord(association) &&
        typeof association.ontologyAssociationId === 'string' &&
        typeof association.sourceNodeId === 'string' &&
        nodeIds.has(association.sourceNodeId) &&
        typeof association.targetNodeId === 'string' &&
        nodeIds.has(association.targetNodeId),
    )
  );
}
