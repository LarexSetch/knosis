import type {
  OntologyDocument,
  OntologyDocumentNode,
  OntologyDocumentProperty,
  OntologyDocumentRelationship,
} from './ontology-document.types';

const STORAGE_KEY = 'knosis.ontology-builder.ontology';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isOntologyProperty(value: unknown): value is OntologyDocumentProperty {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    (value.type === 'string' ||
      value.type === 'number' ||
      value.type === 'boolean') &&
    typeof value.required === 'boolean' &&
    typeof value.description === 'string'
  );
}

function isOntologyNode(value: unknown): value is OntologyDocumentNode {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.color === 'string' &&
    typeof value.description === 'string' &&
    Array.isArray(value.properties) &&
    value.properties.every(isOntologyProperty)
  );
}

function isOntologyRelationship(
  value: unknown,
): value is OntologyDocumentRelationship {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    (value.type === 'association' || value.type === 'relation') &&
    typeof value.sourceNodeId === 'string' &&
    typeof value.targetNodeId === 'string' &&
    typeof value.relationName === 'string' &&
    typeof value.description === 'string' &&
    Array.isArray(value.properties) &&
    value.properties.every(isOntologyProperty)
  );
}

function isOntologyDocument(value: unknown): value is OntologyDocument {
  if (!isRecord(value) || !isRecord(value.metadata)) {
    return false;
  }

  const metadata = value.metadata;
  if (
    typeof metadata.name !== 'string' ||
    typeof metadata.version !== 'string' ||
    typeof metadata.generatedAt !== 'string' ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.relationships)
  ) {
    return false;
  }

  const nodes = value.nodes.filter(isOntologyNode);
  const relationships = value.relationships.filter(isOntologyRelationship);
  if (
    nodes.length !== value.nodes.length ||
    relationships.length !== value.relationships.length
  ) {
    return false;
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  return relationships.every(
    (relationship) =>
      nodeIds.has(relationship.sourceNodeId) &&
      nodeIds.has(relationship.targetNodeId),
  );
}

function parseOntology(json: string): OntologyDocument {
  const parsed: unknown = JSON.parse(json);
  if (!isOntologyDocument(parsed)) {
    throw new Error('Файл не соответствует формату онтологии.');
  }
  return parsed;
}

export function saveOntology(ontology: OntologyDocument): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ontology));
}

export function loadOntology(): OntologyDocument | null {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === null ? null : parseOntology(saved);
}

export function importOntology(file: File): Promise<OntologyDocument> {
  return file.text().then(parseOntology);
}

export function exportOntology(ontology: OntologyDocument): void {
  const blob = new Blob([JSON.stringify(ontology, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = ontology.metadata.name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-');
  link.download = `${fileName || 'ontology'}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
