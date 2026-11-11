import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  OntologyNodeStatus,
} from '../../../../backend/src/ontology/ontology.types';
import type { OntologyNodeWrapper } from './ontology-flow.types';

const statusLabels = {
  [OntologyNodeStatus.ASSOCIATED]: 'Ассоциированная',
  [OntologyNodeStatus.RELATED]: 'Связанная',
  [OntologyNodeStatus.DETACHED]: 'Изолированная',
} satisfies Record<OntologyNodeStatus, string>;

export function OntologyNode({ data }: NodeProps<OntologyNodeWrapper>) {
  const { ontologyNode } = data;

  return (
    <article className="ontology-node">
      <Handle type="target" position={Position.Left} />
      <div className="ontology-node__header">
        <span
          className="ontology-node__color"
          style={{ backgroundColor: ontologyNode.meta.color }}
          aria-label={`Цвет ноды: ${ontologyNode.meta.color}`}
        />
        <span className="ontology-node__name">{ontologyNode.name}</span>
        <span className="ontology-node__status">
          {statusLabels[ontologyNode.status]}
        </span>
      </div>
      {ontologyNode.properties.length > 0 && (
        <ul className="ontology-node__properties">
          {ontologyNode.properties.map((property) => (
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
