import { X } from 'lucide-react';
import type { GraphSelection, OntologyDocument, OntologyElement, OntologyRelation } from '../types';
import EdgeEditor from './EdgeEditor';
import VertexEditor from './VertexEditor';

type ElementEditorProps = {
  selection: GraphSelection;
  document: OntologyDocument;
  onClose: () => void;
  onVertexChange: (vertex: OntologyElement) => void;
  onEdgeChange: (edge: OntologyRelation) => void;
};

export default function ElementEditor({
  selection,
  document,
  onClose,
  onVertexChange,
  onEdgeChange,
}: ElementEditorProps) {
  if (!selection) {
    return null;
  }

  const isVertex = selection.kind === 'vertex';
  const vertex = isVertex
    ? document.elements.find((element) => element.id === selection.id)
    : undefined;
  const edge = !isVertex
    ? document.relations.find((relation) => relation.id === selection.id)
    : undefined;

  if (!vertex && !edge) {
    return null;
  }

  return (
    <aside aria-label="Редактор элемента" className="w-72 shrink-0 overflow-y-auto border-l border-neutral-800 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium">{vertex ? 'Вершина' : 'Связь'}</h2>
        <button
          aria-label="Закрыть редактор элемента"
          className="rounded p-1 hover:bg-neutral-800"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>
      {vertex ? (
        <VertexEditor elements={document.elements} onChange={onVertexChange} vertex={vertex} />
      ) : edge ? (
        <EdgeEditor edge={edge} onChange={onEdgeChange} vertices={document.elements} />
      ) : null}
    </aside>
  );
}
