import type {
  OntologyDocument,
  OntologyNode,
  OntologyAssociation,
  OntologyProperty,
  OntologyRelationship,
} from '../../../../backend/src/ontology/ontology.types';
import { OntologyNodeStatus } from '../../../../backend/src/ontology/ontology.types';

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
): value is OntologyProperty {
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
): value is OntologyNode {
  if (!validateRecord(value, path, errors)) {
    return false;
  }

  const record = value;
  let valid = true;
  valid = validateStringField(record, 'id', path, errors) && valid;
  valid = validateStringField(record, 'name', path, errors) && valid;
  valid =
    record.status === 'associated' ||
    record.status === 'related' ||
    record.status === 'detached'
      ? valid
      : (errors.push(
          `${path}.status: ожидалось "associated", "related" или "detached", получено ${summarizeValue(record.status)}.`,
        ),
        false);
  valid = validateOptionalStringField(record, 'description', path, errors) && valid;
  if (!validateRecord(record.meta, `${path}.meta`, errors)) {
    valid = false;
  } else {
    const meta = record.meta;
    valid = validateStringField(meta, 'color', `${path}.meta`, errors) && valid;
    if (!isRecord(meta.position)) {
      errors.push(
        `${path}.meta.position: ожидался объект координат, получено ${summarizeValue(meta.position)}.`,
      );
      valid = false;
    } else {
      for (const axis of ['x', 'y'] as const) {
        if (
          typeof meta.position[axis] !== 'number' ||
          !Number.isFinite(meta.position[axis])
        ) {
          errors.push(
            `${path}.meta.position.${axis}: ожидалось конечное число, получено ${summarizeValue(meta.position[axis])}.`,
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
  if (!Array.isArray(record.associations)) {
    errors.push(
      `${path}.associations: ожидался массив, получено ${summarizeValue(record.associations)}.`,
    );
    return false;
  }
  record.associations.forEach((association, index) => {
    if (!validateRecord(association, `${path}.associations[${index}]`, errors)) {
      valid = false;
      return;
    }
    valid =
      validateStringField(
        association,
        'relation',
        `${path}.associations[${index}]`,
        errors,
      ) && valid;
    valid =
      validateStringField(
        association,
        'description',
        `${path}.associations[${index}]`,
        errors,
      ) && valid;
    if (!Array.isArray(association.nodeIds)) {
      errors.push(
        `${path}.associations[${index}].nodeIds: ожидался массив, получено ${summarizeValue(association.nodeIds)}.`,
      );
      valid = false;
    } else {
      association.nodeIds.forEach((nodeId, nodeIndex) => {
        if (typeof nodeId !== 'string') {
          errors.push(
            `${path}.associations[${index}].nodeIds[${nodeIndex}]: ожидалась строка, получено ${summarizeValue(nodeId)}.`,
          );
          valid = false;
        }
      });
    }
    if (typeof association.nodesAll !== 'boolean') {
      errors.push(
        `${path}.associations[${index}].nodesAll: ожидался boolean, получено ${summarizeValue(association.nodesAll)}.`,
      );
      valid = false;
    }
  });
  return valid;
}

function validateRelationship(
  value: unknown,
  path: string,
  errors: string[],
): value is OntologyRelationship {
  if (!validateRecord(value, path, errors)) {
    return false;
  }

  const record = value;
  let valid = true;
  valid = validateStringField(record, 'id', path, errors) && valid;
  valid = validateStringField(record, 'sourceNodeId', path, errors) && valid;
  valid = validateStringField(record, 'targetNodeId', path, errors) && valid;
  valid = validateStringField(record, 'relation', path, errors) && valid;
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

  let nodes: OntologyNode[] = [];
  if (!Array.isArray(root.nodes)) {
    errors.push(
      `$.nodes: ожидался массив, получено ${summarizeValue(root.nodes)}.`,
    );
  } else {
    nodes = root.nodes.filter((node, index) =>
      validateNode(node, `$.nodes[${index}]`, errors),
    );
  }

  let relationships: OntologyRelationship[] = [];
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
  nodes.forEach((node, nodeIndex) => {
    node.associations.forEach((association, associationIndex) => {
      const targetIds = association.nodesAll
        ? nodes.map((targetNode) => targetNode.id)
        : association.nodeIds;
      targetIds.forEach((targetId, targetIndex) => {
        if (!nodeIds.has(targetId)) {
          errors.push(
            `$.nodes[${nodeIndex}].associations[${associationIndex}].nodeIds[${targetIndex}]: нода "${targetId}" отсутствует в $.nodes.`,
          );
        }
      });
    });
  });
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

  const normalized = (() => {
    if (!isRecord(parsed) || !Array.isArray(parsed.nodes)) {
      return parsed;
    }

    const rawRelationships = Array.isArray(parsed.relationships)
      ? parsed.relationships
      : [];
    const migratedAssociations = new Map<string, OntologyAssociation[]>();
    const relationships = rawRelationships.flatMap((value: unknown) => {
      if (!isRecord(value)) {
        return [value];
      }
      if (value.type === 'association') {
        if (
          typeof value.sourceNodeId !== 'string' ||
          typeof value.targetNodeId !== 'string' ||
          typeof value.relationName !== 'string' ||
          typeof value.description !== 'string'
        ) {
          return [value];
        }
        const associations =
          migratedAssociations.get(value.sourceNodeId) ?? [];
        const existing = associations.find(
          (association) =>
            association.relation === value.relationName &&
            association.description === value.description,
        );
        if (existing) {
          if (!existing.nodeIds.includes(value.targetNodeId)) {
            existing.nodeIds.push(value.targetNodeId);
          }
        } else {
          associations.push({
            relation: value.relationName,
            description: value.description,
            nodeIds: [value.targetNodeId],
            nodesAll: false,
          });
        }
        migratedAssociations.set(value.sourceNodeId, associations);
        return [];
      }

      const relationship = { ...value };
      delete relationship.type;
      if (relationship.relation === undefined) {
        relationship.relation = relationship.relationName;
      }
      delete relationship.relationName;
      return [relationship];
    });

    const nodes = parsed.nodes.map((value: unknown, index: number) => {
      if (!isRecord(value)) {
        return value;
      }
      const meta = isRecord(value.meta) ? { ...value.meta } : value.meta;
      if (meta !== undefined && !isRecord(meta)) {
        return value;
      }
      const normalizedMeta = isRecord(meta) ? meta : {};
      if (normalizedMeta.color === undefined && value.color !== undefined) {
        normalizedMeta.color = value.color;
      }
      if (normalizedMeta.position === undefined) {
        const defaultPosition = {
          x: 80 + (index % 3) * 300,
          y: 80 + Math.floor(index / 3) * 220,
        };
        const legacyPosition = isRecord(value.position)
          ? value.position
          : undefined;
        normalizedMeta.position = value.position === undefined || legacyPosition
          ? {
              x: value.positionX ?? legacyPosition?.x ?? defaultPosition.x,
              y: value.positionY ?? legacyPosition?.y ?? defaultPosition.y,
            }
          : value.position;
      }

      let associations = value.associations;
      if (Array.isArray(associations)) {
        associations = associations.map((association: unknown) => {
          if (!isRecord(association)) {
            return association;
          }
          const normalizedAssociation = { ...association };
          if (normalizedAssociation.nodeIds === undefined) {
            normalizedAssociation.nodeIds = normalizedAssociation.targets;
          }
          if (normalizedAssociation.nodesAll === undefined) {
            normalizedAssociation.nodesAll = normalizedAssociation.targetsAll;
          }
          delete normalizedAssociation.targets;
          delete normalizedAssociation.targetsAll;
          return normalizedAssociation;
        });
      } else if (associations === undefined) {
        associations = [];
      }
      if (Array.isArray(associations)) {
        associations.push(...(migratedAssociations.get(String(value.id)) ?? []));
      }

      const node: Record<string, unknown> = {
        ...value,
        meta: normalizedMeta,
        associations,
      };
      delete node.color;
      delete node.position;
      delete node.positionX;
      delete node.positionY;
      return node;
    });

    const relationNodeIds = new Set(
      relationships.flatMap((value: unknown) =>
        isRecord(value) &&
          typeof value.sourceNodeId === 'string' &&
          typeof value.targetNodeId === 'string'
          ? [value.sourceNodeId, value.targetNodeId]
          : [],
      ),
    );
    const nodeIds = new Set(
      nodes.flatMap((value: unknown) =>
        isRecord(value) && typeof value.id === 'string' ? [value.id] : [],
      ),
    );
    const associatedNodeIds = new Set<string>();
    for (const value of nodes) {
      if (!isRecord(value) || !Array.isArray(value.associations)) {
        continue;
      }
      for (const association of value.associations) {
        if (!isRecord(association)) {
          continue;
        }
        const targets = association.nodesAll === true
          ? [...nodeIds]
          : Array.isArray(association.nodeIds)
            ? association.nodeIds.filter(
                (nodeId): nodeId is string => typeof nodeId === 'string',
              )
            : [];
        if (targets.length > 0) {
          if (typeof value.id === 'string') {
            associatedNodeIds.add(value.id);
          }
          targets.forEach((nodeId) => associatedNodeIds.add(nodeId));
        }
      }
    }

    return {
      ...parsed,
      nodes: nodes.map((value: unknown) => {
        if (!isRecord(value) || typeof value.id !== 'string') {
          return value;
        }
        return {
          ...value,
          status: associatedNodeIds.has(value.id)
            ? OntologyNodeStatus.ASSOCIATED
            : relationNodeIds.has(value.id)
              ? OntologyNodeStatus.RELATED
              : OntologyNodeStatus.DETACHED,
        };
      }),
      relationships: Array.isArray(parsed.relationships)
        ? relationships
        : parsed.relationships,
    };
  })();

  const errors: string[] = [];
  if (!validateOntologyDocument(normalized, errors)) {
    throw new Error(
      `Файл не соответствует формату онтологии:\n${errors.map((issue) => `• ${issue}`).join('\n')}`,
    );
  }
  return {
    ...normalized,
    nodes: normalized.nodes.map((node) => {
      return {
        ...node,
        description: node.description ?? '',
        properties: node.properties.map((property) => ({
          ...property,
          description: property.description ?? '',
        })),
      };
    }),
    relationships: normalized.relationships.map((relationship) => ({
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
