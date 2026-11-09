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

function summarizeValue(value: unknown): string {
  if (value === undefined) {
    return 'отсутствует';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    const summary = JSON.stringify(value);
    return summary.length > 82 ? `${summary.slice(0, 79)}...` : summary;
  }
  if (Array.isArray(value)) {
    return `массив (${value.length} элементов)`;
  }
  if (isRecord(value)) {
    return 'объект';
  }
  return String(value);
}

function validateRecord(
  value: unknown,
  path: string,
  errors: string[],
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    errors.push(`${path}: ожидался объект, получено ${summarizeValue(value)}.`);
    return false;
  }
  return true;
}

function validateStringField(
  record: Record<string, unknown>,
  field: string,
  path: string,
  errors: string[],
): boolean {
  if (typeof record[field] !== 'string') {
    errors.push(
      `${path}.${field}: ожидалась строка, получено ${summarizeValue(record[field])}.`,
    );
    return false;
  }
  return true;
}

function validateOptionalStringField(
  record: Record<string, unknown>,
  field: string,
  path: string,
  errors: string[],
): boolean {
  if (record[field] === undefined) {
    return true;
  }
  return validateStringField(record, field, path, errors);
}

function validateProperty(
  value: unknown,
  path: string,
  errors: string[],
): value is OntologyDocumentProperty {
  if (!validateRecord(value, path, errors)) {
    return false;
  }

  const record = value;
  let valid = true;
  valid = validateStringField(record, 'name', path, errors) && valid;
  valid =
    (record.type === 'string' ||
      record.type === 'number' ||
      record.type === 'boolean' ||
      record.type === 'array')
      ? valid
      : (errors.push(
          `${path}.type: ожидалось "string", "number", "boolean" или "array", получено ${summarizeValue(record.type)}.`,
        ),
        false);
  valid =
    typeof record.required === 'boolean'
      ? valid
      : (errors.push(
          `${path}.required: ожидался boolean, получено ${summarizeValue(record.required)}.`,
        ),
        false);
  valid = validateOptionalStringField(record, 'description', path, errors) && valid;
  return valid;
}

function validateNode(
  value: unknown,
  path: string,
  errors: string[],
): value is OntologyDocumentNode {
  if (!validateRecord(value, path, errors)) {
    return false;
  }

  const record = value;
  let valid = true;
  valid = validateStringField(record, 'id', path, errors) && valid;
  valid = validateStringField(record, 'name', path, errors) && valid;
  valid = validateStringField(record, 'color', path, errors) && valid;
  valid = validateOptionalStringField(record, 'description', path, errors) && valid;
  if (record.position !== undefined) {
    if (!isRecord(record.position)) {
      errors.push(
        `${path}.position: ожидался объект координат, получено ${summarizeValue(record.position)}.`,
      );
      valid = false;
    } else {
      for (const axis of ['x', 'y'] as const) {
        if (typeof record.position[axis] !== 'number' || !Number.isFinite(record.position[axis])) {
          errors.push(
            `${path}.position.${axis}: ожидалось конечное число, получено ${summarizeValue(record.position[axis])}.`,
          );
          valid = false;
        }
      }
    }
  }

  if (!Array.isArray(record.properties)) {
    errors.push(
      `${path}.properties: ожидался массив, получено ${summarizeValue(record.properties)}.`,
    );
    return false;
  }

  record.properties.forEach((property, index) => {
    valid = validateProperty(property, `${path}.properties[${index}]`, errors) && valid;
  });
  return valid;
}

function validateRelationship(
  value: unknown,
  path: string,
  errors: string[],
): value is OntologyDocumentRelationship {
  if (!validateRecord(value, path, errors)) {
    return false;
  }

  const record = value;
  let valid = true;
  valid = validateStringField(record, 'id', path, errors) && valid;
  valid =
    record.type === 'association' || record.type === 'relation'
      ? valid
      : (errors.push(
          `${path}.type: ожидалось "association" или "relation", получено ${summarizeValue(record.type)}.`,
        ),
        false);
  valid = validateStringField(record, 'sourceNodeId', path, errors) && valid;
  valid = validateStringField(record, 'targetNodeId', path, errors) && valid;
  valid = validateStringField(record, 'relationName', path, errors) && valid;
  valid = validateOptionalStringField(record, 'description', path, errors) && valid;

  if (!Array.isArray(record.properties)) {
    errors.push(
      `${path}.properties: ожидался массив, получено ${summarizeValue(record.properties)}.`,
    );
    return false;
  }

  record.properties.forEach((property, index) => {
    valid = validateProperty(property, `${path}.properties[${index}]`, errors) && valid;
  });
  return valid;
}

function validateOntologyDocument(
  value: unknown,
  errors: string[],
): value is OntologyDocument {
  if (!validateRecord(value, '$', errors)) {
    return false;
  }

  const root = value;
  if (!validateRecord(root.metadata, '$.metadata', errors)) {
    return false;
  }
  const metadata = root.metadata;
  validateStringField(metadata, 'name', '$.metadata', errors);
  validateStringField(metadata, 'version', '$.metadata', errors);
  validateStringField(metadata, 'generatedAt', '$.metadata', errors);

  let nodes: OntologyDocumentNode[] = [];
  if (!Array.isArray(root.nodes)) {
    errors.push(
      `$.nodes: ожидался массив, получено ${summarizeValue(root.nodes)}.`,
    );
  } else {
    nodes = root.nodes.filter((node, index) =>
      validateNode(node, `$.nodes[${index}]`, errors),
    );
  }

  let relationships: OntologyDocumentRelationship[] = [];
  if (!Array.isArray(root.relationships)) {
    errors.push(
      `$.relationships: ожидался массив, получено ${summarizeValue(root.relationships)}.`,
    );
  } else {
    relationships = root.relationships.filter((relationship, index) =>
      validateRelationship(
        relationship,
        `$.relationships[${index}]`,
        errors,
      ),
    );
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  relationships.forEach((relationship, index) => {
    if (!nodeIds.has(relationship.sourceNodeId)) {
      errors.push(
        `$.relationships[${index}].sourceNodeId: нода "${relationship.sourceNodeId}" отсутствует в $.nodes.`,
      );
    }
    if (!nodeIds.has(relationship.targetNodeId)) {
      errors.push(
        `$.relationships[${index}].targetNodeId: нода "${relationship.targetNodeId}" отсутствует в $.nodes.`,
      );
    }
  });

  if (errors.length > 0) {
    return false;
  }

  return true;
}

function parseOntology(json: string): OntologyDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(
      `Некорректный JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const errors: string[] = [];
  if (!validateOntologyDocument(parsed, errors)) {
    throw new Error(
      `Файл не соответствует формату онтологии:\n${errors.map((issue) => `• ${issue}`).join('\n')}`,
    );
  }
  return {
    ...parsed,
    nodes: parsed.nodes.map((node) => ({
      ...node,
      description: node.description ?? '',
      properties: node.properties.map((property) => ({
        ...property,
        description: property.description ?? '',
      })),
    })),
    relationships: parsed.relationships.map((relationship) => ({
      ...relationship,
      description: relationship.description ?? '',
      properties: relationship.properties.map((property) => ({
        ...property,
        description: property.description ?? '',
      })),
    })),
  };
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
