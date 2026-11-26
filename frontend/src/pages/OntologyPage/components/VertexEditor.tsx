import AssociationsList from './AssociationsList';
import type { OntologyElement } from '../types';

type VertexEditorProps = {
  vertex: OntologyElement;
  elements: OntologyElement[];
  labelError?: string | null;
  onChange: (vertex: OntologyElement) => void;
};

const fieldClassName = 'w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm outline-none focus:border-neutral-500';

export default function VertexEditor({
  vertex,
  elements,
  labelError,
  onChange,
}: VertexEditorProps) {
  return (
    <div className="space-y-4">
      <label className="block space-y-1 text-xs text-neutral-400">
        Label
        <input
          className={`${fieldClassName}${labelError ? ' border-red-700 focus:border-red-500' : ''}`}
          onChange={(event) => onChange({ ...vertex, id: event.target.value })}
          value={vertex.id}
        />
        {labelError && (
          <span className="block text-xs text-red-300">{labelError}</span>
        )}
      </label>
      <label className="block space-y-1 text-xs text-neutral-400">
        Название
        <input
          className={fieldClassName}
          onChange={(event) => onChange({ ...vertex, name: event.target.value })}
          value={vertex.name}
        />
      </label>
      <label className="block space-y-1 text-xs text-neutral-400">
        Описание
        <textarea
          className={`${fieldClassName} min-h-20 resize-y`}
          onChange={(event) => onChange({ ...vertex, summary: event.target.value })}
          value={vertex.summary}
        />
      </label>
      <label className="flex items-center justify-between gap-3 text-xs text-neutral-400">
        Цвет
        <input
          aria-label="Цвет вершины"
          className="h-8 w-12 cursor-pointer rounded border border-neutral-700 bg-transparent p-1"
          onChange={(event) => onChange({
            ...vertex,
            meta: { ...vertex.meta, color: event.target.value },
          })}
          type="color"
          value={vertex.meta.color}
        />
      </label>
      <p className="text-xs text-neutral-500">
        Позиция: {Math.round(vertex.meta.position.x)}, {Math.round(vertex.meta.position.y)}
      </p>

      <AssociationsList
        associations={vertex.associations}
        elements={elements}
        onChange={(associations) => onChange({ ...vertex, associations })}
      />
    </div>
  );
}
