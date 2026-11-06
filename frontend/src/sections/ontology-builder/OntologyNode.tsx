import { Network, Unlink } from 'lucide-react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  OntologyNodeIcon,
  type OntologyFlowNode,
} from './ontology-types';

const iconComponents = {
  [OntologyNodeIcon.ASSOCIATIONS]: { label: 'Связи', Icon: Network },
  [OntologyNodeIcon.DETACHED]: { label: 'Изолированная', Icon: Unlink },
} satisfies Record<OntologyNodeIcon, { label: string; Icon: typeof Network }>;

export function OntologyNode({ data }: NodeProps<OntologyFlowNode>) {
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
        <div className="ontology-node__icons" aria-label="Содержимое ноды">
          {data.icons.map((icon) => {
            const { label, Icon } = iconComponents[icon];
            return (
              <span className="ontology-node__icon" key={icon} title={label}>
                <Icon size={14} aria-label={label} />
              </span>
            );
          })}
        </div>
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
