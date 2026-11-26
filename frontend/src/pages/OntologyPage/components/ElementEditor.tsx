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
  onChange: (item: EditableItem, previousId: string) => void;
  onDelete: (id: string) => void;
};

function isVertexItem(item: EditableItem): item is OntologyElement {
  return 'meta' in item;
}

function serializeItem(item: EditableItem): string {
  return JSON.stringify(item);
}

function getItemLabelError(
  draft: EditableItem | undefined,
  previousId: string,
  document: OntologyDocument,
): string | null {
  if (!draft) {
    return null;
  }

  const trimmedId = draft.id.trim();
  if (!trimmedId) {
    return 'Label не может быть пустым';
  }

  const siblings = isVertexItem(draft) ? document.elements : document.relations;
  const isDuplicate = siblings.some((item) => item.id !== previousId && item.id === trimmedId);
  return isDuplicate ? 'Элемент с таким Label уже существует' : null;
}

export default function ElementEditor({
  selection,
  document,
  onClose,
  onChange,
  onDelete,
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
  const documentRef = useRef<OntologyDocument>(document);
  const committedIdRef = useRef<string>(sourceItem?.id ?? '');
  const committedSnapshotRef = useRef<string>(sourceItem ? serializeItem(sourceItem) : '');
  const onChangeRef = useRef(onChange);

  sourceItemRef.current = sourceItem;
  documentRef.current = document;
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

    const previousId = committedIdRef.current;
    if (getItemLabelError(currentDraft, previousId, documentRef.current)) {
      return;
    }

    const normalizedDraft: EditableItem = { ...currentDraft, id: currentDraft.id.trim() };

    const serialized = serializeItem(normalizedDraft);
    if (serialized === committedSnapshotRef.current) {
      return;
    }

    draftRef.current = normalizedDraft;
    committedIdRef.current = normalizedDraft.id;
    committedSnapshotRef.current = serialized;
    setDraft(normalizedDraft);
    onChangeRef.current(normalizedDraft, previousId);
  }, []);

  useEffect(() => {
    const nextSource = sourceItemRef.current;
    draftRef.current = nextSource;
    committedIdRef.current = nextSource?.id ?? '';
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

  const labelError = getItemLabelError(draft, committedIdRef.current, document);
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

  function handleDelete() {
    const idToDelete = committedIdRef.current;
    if (!idToDelete) {
      return;
    }

    // Clear draft refs before deleting so unmount cleanup does not commit a stale edit.
    draftRef.current = undefined;
    committedIdRef.current = '';
    committedSnapshotRef.current = '';
    onDelete(idToDelete);
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
        <VertexEditor
          elements={document.elements}
          labelError={labelError}
          onChange={updateDraft}
          vertex={draft}
        />
      ) : (
        <EdgeEditor edge={draft} labelError={labelError} onChange={updateDraft} />
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-800 pt-3">
        {isVertexItem(draft) ? (
          <button
            className="rounded px-3 py-1.5 text-xs text-red-300 hover:bg-red-950"
            onClick={handleDelete}
            type="button"
          >
            Удалить
          </button>
        ) : (
          <span />
        )}
        <button
          className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-100 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isDirty || Boolean(labelError)}
          onClick={commitIfDirty}
          type="button"
        >
          Сохранить
        </button>
      </div>
    </aside>
  );
}
