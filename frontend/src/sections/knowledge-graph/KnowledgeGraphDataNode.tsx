import { Handle, Position, type NodeProps } from '@xyflow/react';
import type {
  KnowledgeGraphDataProperty,
  KnowledgeGraphNodeData,
} from './knowledge-graph-types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isKnowledgeGraphNodeData(
  data: Record<string, unknown>,
): data is KnowledgeGraphNodeData {
  return (
    typeof data.ontologyNodeName === 'string' &&
    typeof data.title === 'string' &&
    typeof data.color === 'string' &&
    Array.isArray(data.properties) &&
    data.properties.every(
      (property) =>
        isRecord(property) &&
        typeof property.name === 'string' &&
        'value' in property,
    )
  );
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function KnowledgeGraphDataNode({ data }: NodeProps) {
  if (!isKnowledgeGraphNodeData(data)) {
    return null;
  }

  return (
    <article className="knowledge-graph-data-node">
      <Handle type="target" position={Position.Left} />
      <header className="knowledge-graph-data-node__header">
        <span
          className="knowledge-graph-node-list__color"
          style={{ backgroundColor: data.color }}
        />
        <span className="knowledge-graph-data-node__title">{data.title}</span>
        <span className="knowledge-graph-data-node__type">
          {data.ontologyNodeName}
        </span>
      </header>
      {data.properties.length > 0 && (
        <ul className="knowledge-graph-data-node__properties">
          {data.properties.map((property) => (
            <li key={property.name}>
              <span>{property.name}</span>
              <span className="knowledge-graph-data-node__value">
                {formatValue(property.value)}
              </span>
              {property.type && (
                <span className="knowledge-graph-data-node__property-type">
                  {property.type}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <Handle type="source" position={Position.Right} />
    </article>
  );
}
