import type { OntologyDocument } from '../../../../backend/src/ontology/ontology.types';

const STORAGE_KEY = 'knosis.knowledge-graph.data';

export interface KnowledgeGraphRecord extends Record<string, unknown> {
  nodeId: string;
  ontologyNodeName: string;
  positionX?: number;
  positionY?: number;
}

export interface KnowledgeGraphRelation {
  relationId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationName: string;
}

export interface KnowledgeGraphDocument {
  nodes: KnowledgeGraphRecord[];
  relations: KnowledgeGraphRelation[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): string | null {
  const value = record[key];
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path}.${key}: ожидалась непустая строка.`);
    return null;
  }
  return value;
}

export function parseKnowledgeGraph(
  json: string,
  ontology: OntologyDocument,
): KnowledgeGraphDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(
      `Некорректный JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const errors: string[] = [];
  if (!isRecord(parsed)) {
    throw new Error('Файл графа должен содержать JSON-объект.');
  }
  const rawNodes = parsed.nodes;
  const rawRelations = parsed.relations;
  if (!Array.isArray(rawNodes)) {
    errors.push('$.nodes: ожидался массив.');
  }
  if (!Array.isArray(rawRelations)) {
    errors.push('$.relations: ожидался массив.');
  }
  if (!Array.isArray(rawNodes) || !Array.isArray(rawRelations)) {
    throw new Error(errors.join('\n'));
  }

  const ontologyNodeNames = new Set(ontology.nodes.map((node) => node.name));
  const nodeIds = new Set<string>();
  const nodes: KnowledgeGraphRecord[] = [];

  rawNodes.forEach((value: unknown, index: number) => {
    const path = `$.nodes[${index}]`;
    if (!isRecord(value)) {
      errors.push(`${path}: ожидался объект.`);
      return;
    }

    const nodeId = requireString(value, 'nodeId', path, errors);
    const ontologyNodeName = requireString(
      value,
      'ontologyNodeName',
      path,
      errors,
    );
    if (!nodeId || !ontologyNodeName) {
      return;
    }
    if (nodeIds.has(nodeId)) {
      errors.push(`${path}.nodeId: идентификатор "${nodeId}" повторяется.`);
    } else {
      nodeIds.add(nodeId);
    }
    if (!ontologyNodeNames.has(ontologyNodeName)) {
      errors.push(
        `${path}.ontologyNodeName: нода онтологии "${ontologyNodeName}" не найдена.`,
      );
    }
    const positionX = value.positionX;
    const positionY = value.positionY;
    for (const [coordinate, coordinateValue] of [
      ['positionX', positionX],
      ['positionY', positionY],
    ] as const) {
      if (
        coordinateValue !== undefined &&
        (typeof coordinateValue !== 'number' ||
          !Number.isFinite(coordinateValue))
      ) {
        errors.push(`${path}.${coordinate}: ожидалось конечное число.`);
      }
    }
    nodes.push({
      ...value,
      nodeId,
      ontologyNodeName,
      ...(typeof positionX === 'number' ? { positionX } : {}),
      ...(typeof positionY === 'number' ? { positionY } : {}),
    });
  });

  const relationIds = new Set<string>();
  const relations: KnowledgeGraphRelation[] = [];
  rawRelations.forEach((value: unknown, index: number) => {
    const path = `$.relations[${index}]`;
    if (!isRecord(value)) {
      errors.push(`${path}: ожидался объект.`);
      return;
    }

    const relationId = requireString(value, 'relationId', path, errors);
    const sourceNodeId = requireString(value, 'sourceNodeId', path, errors);
    const targetNodeId = requireString(value, 'targetNodeId', path, errors);
    const relationName = requireString(value, 'relationName', path, errors);
    if (!relationId || !sourceNodeId || !targetNodeId || !relationName) {
      return;
    }
    if (relationIds.has(relationId)) {
      errors.push(
        `${path}.relationId: идентификатор "${relationId}" повторяется.`,
      );
    } else {
      relationIds.add(relationId);
    }
    if (!nodeIds.has(sourceNodeId)) {
      errors.push(
        `${path}.sourceNodeId: нода "${sourceNodeId}" отсутствует в $.nodes.`,
      );
    }
    if (!nodeIds.has(targetNodeId)) {
      errors.push(
        `${path}.targetNodeId: нода "${targetNodeId}" отсутствует в $.nodes.`,
      );
    }
    relations.push({
      relationId,
      sourceNodeId,
      targetNodeId,
      relationName,
    });
  });

  if (errors.length > 0) {
    throw new Error(`Файл графа не прошёл проверку:\n${errors.join('\n')}`);
  }

  return { nodes, relations };
}

export function saveKnowledgeGraph(graph: KnowledgeGraphDocument): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(graph));
}

export function loadKnowledgeGraph(
  ontology: OntologyDocument,
): KnowledgeGraphDocument | null {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === null ? null : parseKnowledgeGraph(saved, ontology);
}
