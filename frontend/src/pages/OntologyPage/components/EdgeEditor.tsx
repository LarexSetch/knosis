import type { OntologyElement, OntologyRelation } from '../types';

type EdgeEditorProps = {
  edge: OntologyRelation;
  vertices: OntologyElement[];
  onChange: (edge: OntologyRelation) => void;
};

const fieldClassName = 'w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm outline-none focus:border-neutral-500';

export default function EdgeEditor({ edge, vertices, onChange }: EdgeEditorProps) {
  return (
    <div className="space-y-4">
      <label className="block space-y-1 text-xs text-neutral-400">
        ID
        <input className={fieldClassName} readOnly value={edge.id} />
      </label>
      <label className="block space-y-1 text-xs text-neutral-400">
        Название
        <input
          className={fieldClassName}
          onChange={(event) => onChange({ ...edge, name: event.target.value })}
          value={edge.name}
        />
      </label>
      <label className="block space-y-1 text-xs text-neutral-400">
        Описание
        <textarea
          className={`${fieldClassName} min-h-20 resize-y`}
          onChange={(event) => onChange({ ...edge, summary: event.target.value })}
          value={edge.summary}
        />
      </label>
      <label className="block space-y-1 text-xs text-neutral-400">
        Источник
        <select
          className={fieldClassName}
          onChange={(event) => onChange({ ...edge, sourceElementId: event.target.value })}
          value={edge.sourceElementId}
        >
          {vertices.map((vertex) => <option key={vertex.id} value={vertex.id}>{vertex.name}</option>)}
        </select>
      </label>
      <label className="block space-y-1 text-xs text-neutral-400">
        Цель
        <select
          className={fieldClassName}
          onChange={(event) => onChange({ ...edge, targetElementId: event.target.value })}
          value={edge.targetElementId}
        >
          {vertices.map((vertex) => <option key={vertex.id} value={vertex.id}>{vertex.name}</option>)}
        </select>
      </label>
    </div>
  );
}
