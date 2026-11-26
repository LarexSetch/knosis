import type { OntologyRelation } from '../types';

type EdgeEditorProps = {
  edge: OntologyRelation;
  labelError?: string | null;
  onChange: (edge: OntologyRelation) => void;
};

const fieldClassName = 'w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm outline-none focus:border-neutral-500';

export default function EdgeEditor({ edge, labelError, onChange }: EdgeEditorProps) {
  return (
    <div className="space-y-4">
      <label className="block space-y-1 text-xs text-neutral-400">
        Label
        <input
          className={`${fieldClassName}${labelError ? ' border-red-700 focus:border-red-500' : ''}`}
          onChange={(event) => onChange({ ...edge, id: event.target.value })}
          value={edge.id}
        />
        {labelError && (
          <span className="block text-xs text-red-300">{labelError}</span>
        )}
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
    </div>
  );
}
