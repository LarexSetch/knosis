import { useCallback, useEffect, useRef, useState, type FocusEvent } from 'react';
import { X } from 'lucide-react';
import type { GraphSelection, OntologyDocument, OntologyElement, OntologyRelation } from '../types';
import EdgeEditor from './EdgeEditor';
import VertexEditor from './VertexEditor';

type EditableItem = OntologyElement | OntologyRelation;

type ElementEditorProps = {
  selection: GraphSelection;
  document: OntologyDocument;
  onClose: () => void;
  onChange: (item: EditableItem) => void;
};

function isVertexItem(item: EditableItem): item is OntologyElement {
  return 'meta' in item;
}

function serializeItem(item: EditableItem): string {
  return JSON.stringify(item);
}

export default function ElementEditor({
  selection,
  document,
  onClose,
  onChange,
}: ElementEditorProps) {
  const isVertex = selection?.kind === 'vertex';
  const sourceItem = selection
    ? isVertex
      ? document.elements.find((element) => element.id === selection.id)
      : document.relations.find((relation) => relation.id === selection.id)
    : undefined;

  const selectionKey = selection ? `${selection.kind}:${selection.id}` : null;

  const [draft, setDraft] = useState<EditableItem | undefined>(sourceItem);
  const draftRef = useRef<EditableItem | undefined>(sourceItem);
  const sourceItemRef = useRef<EditableItem | undefined>(sourceItem);
  const committedSnapshotRef = useRef<string>(sourceItem ? serializeItem(sourceItem) : '');
  const onChangeRef = useRef(onChange);

  sourceItemRef.current = sourceItem;
  onChangeRef.current = onChange;

  const updateDraft = useCallback((nextItem: EditableItem) => {
    draftRef.current = nextItem;
    setDraft(nextItem);
  }, []);

  const commitIfDirty = useCallback(() => {
    const currentDraft = draftRef.current;
    if (!currentDraft) {
      return;
    }

    const serialized = serializeItem(currentDraft);
    if (serialized === committedSnapshotRef.current) {
      return;
    }

    committedSnapshotRef.current = serialized;
    onChangeRef.current(currentDraft);
  }, []);

  useEffect(() => {
    const nextSource = sourceItemRef.current;
    draftRef.current = nextSource;
    committedSnapshotRef.current = nextSource ? serializeItem(nextSource) : '';
    setDraft(nextSource);

    return () => {
      commitIfDirty();
    };
  }, [selectionKey, commitIfDirty]);

  const vertexPositionX = sourceItem && isVertexItem(sourceItem) ? sourceItem.meta.position.x : null;
  const vertexPositionY = sourceItem && isVertexItem(sourceItem) ? sourceItem.meta.position.y : null;

  useEffect(() => {
    if (vertexPositionX === null || vertexPositionY === null) {
      return;
    }

    const currentDraft = draftRef.current;
    if (!currentDraft || !isVertexItem(currentDraft)) {
      return;
    }

    if (
      currentDraft.meta.position.x === vertexPositionX
      && currentDraft.meta.position.y === vertexPositionY
    ) {
      return;
    }

    const updatedDraft: OntologyElement = {
      ...currentDraft,
      meta: {
        ...currentDraft.meta,
        position: { x: vertexPositionX, y: vertexPositionY },
      },
    };
    const wasClean = serializeItem(currentDraft) === committedSnapshotRef.current;
    draftRef.current = updatedDraft;
    setDraft(updatedDraft);
    if (wasClean) {
      committedSnapshotRef.current = serializeItem(updatedDraft);
    }
  }, [vertexPositionX, vertexPositionY]);

  if (!selection || !sourceItem || !draft) {
    return null;
  }

  const isDirty = serializeItem(draft) !== committedSnapshotRef.current;

  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      commitIfDirty();
    }
  }

  function handleClose() {
    commitIfDirty();
    onClose();
  }

  return (
    <aside
      aria-label="Редактор элемента"
      className="w-72 shrink-0 overflow-y-auto border-l border-neutral-800 p-4"
      onBlur={handleBlur}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium">{isVertexItem(draft) ? 'Вершина' : 'Связь'}</h2>
        <button
          aria-label="Закрыть редактор элемента"
          className="rounded p-1 hover:bg-neutral-800"
          onClick={handleClose}
          type="button"
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>

      {isVertexItem(draft) ? (
        <VertexEditor elements={document.elements} onChange={updateDraft} vertex={draft} />
      ) : (
        <EdgeEditor edge={draft} onChange={updateDraft} vertices={document.elements} />
      )}

      <div className="mt-4 flex justify-end border-t border-neutral-800 pt-3">
        <button
          className="rounded bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isDirty}
          onClick={commitIfDirty}
          type="button"
        >
          Сохранить
        </button>
      </div>
    </aside>
  );
}
