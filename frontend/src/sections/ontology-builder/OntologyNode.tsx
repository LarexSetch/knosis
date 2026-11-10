import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  OntologyNodeStatus,
} from '../../../../backend/src/ontology/ontology.types';
import type { OntologyFlowNodeData } from './ontology-flow.types';

const statusLabels = {
  [OntologyNodeStatus.ASSOCIATED]: 'Ассоциированная',
  [OntologyNodeStatus.RELATED]: 'Связанная',
  [OntologyNodeStatus.DETACHED]: 'Изолированная',
} satisfies Record<OntologyNodeStatus, string>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isOntologyNodeData(
  data: unknown,
): data is OntologyFlowNodeData {
  if (!isRecord(data)) {
    return false;
  }
  return (
    typeof data.color === 'string' &&
    typeof data.name === 'string' &&
    typeof data.description === 'string' &&
    (data.status === OntologyNodeStatus.ASSOCIATED ||
      data.status === OntologyNodeStatus.RELATED ||
      data.status === OntologyNodeStatus.DETACHED) &&
    Array.isArray(data.properties) &&
    data.properties.every(
      (property) =>
        isRecord(property) &&
        typeof property.name === 'string' &&
        typeof property.type === 'string',
    ) &&
    Array.isArray(data.associations) &&
    data.associations.every(
      (association) =>
        isRecord(association) &&
        typeof association.relation === 'string' &&
        typeof association.description === 'string' &&
        Array.isArray(association.nodeIds) &&
        typeof association.nodesAll === 'boolean',
    )
  );
}

export function OntologyNode({ data }: NodeProps) {
  if (!isOntologyNodeData(data)) {
    return null;
  }

  return (
    <article className="ontology-node">
      <Handle type="target" position={Position.Left} />
      <div className="ontology-node__header">
        <span
          className="ontology-node__color"
          style={{ backgroundColor: data.color }}
          aria-label={`Цвет ноды: ${data.color}`}
        />
        <span className="ontology-node__name">{data.name}</span>
        <span className="ontology-node__status">
          {statusLabels[data.status]}
        </span>
      </div>
      {data.properties.length > 0 && (
        <ul className="ontology-node__properties">
          {data.properties.map((property) => (
            <li className="ontology-node__property" key={property.name}>
              <span>{property.name}</span>
              <span className="ontology-node__property-type">{property.type}</span>
            </li>
          ))}
        </ul>
      )}
      <Handle type="source" position={Position.Right} />
    </article>
  );
}
