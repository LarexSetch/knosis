import { useEffect, useState } from 'react';
import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';
import type { OntologyAssociation, OntologyElement } from '../types';

type AssociationEditorProps = {
  association: OntologyAssociation;
  elements: OntologyElement[];
  onOpenChange: (open: boolean) => void;
  onSave: (association: OntologyAssociation) => void;
};

const fieldClassName = 'w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm outline-none focus:border-neutral-500';

export default function AssociationEditor({
  association,
  elements,
  onOpenChange,
  onSave,
}: AssociationEditorProps) {
  const [draft, setDraft] = useState(association);

  useEffect(() => {
    setDraft(association);
  }, [association]);

  function save() {
    const name = draft.name.trim();
    if (!name) {
      return;
    }
    onSave({ ...draft, name, summary: draft.summary.trim() });
    onOpenChange(false);
  }

  function setElementSelected(id: string, selected: boolean) {
    setDraft((current) => ({
      ...current,
      elementIds: selected
        ? [...new Set([...current.elementIds, id])]
        : current.elementIds.filter((elementId) => elementId !== id),
    }));
  }

  return (
    <Dialog.Root open onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-700 bg-neutral-900 p-5 shadow-lg">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-medium">Ассоциация</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-neutral-400">
                Укажите элементы, к которым относится ассоциация.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button aria-label="Закрыть" className="rounded p-1 hover:bg-neutral-800" type="button">
                <X aria-hidden="true" size={16} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            <label className="block space-y-1 text-xs text-neutral-400">
              Название
              <input
                autoFocus
                className={fieldClassName}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                value={draft.name}
              />
            </label>
            <label className="block space-y-1 text-xs text-neutral-400">
              Описание
              <textarea
                className={`${fieldClassName} min-h-20 resize-y`}
                onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
                value={draft.summary}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={draft.elementsAll}
                onChange={(event) => setDraft((current) => ({
                  ...current,
                  elementsAll: event.target.checked,
                }))}
                type="checkbox"
              />
              Все элементы (elementsAll)
            </label>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-xs text-neutral-400">Элементы</legend>
              <div className="max-h-44 overflow-y-auto rounded border border-neutral-800 p-2">
                {elements.length ? elements.map((element) => (
                  <label className="flex items-center gap-2 rounded px-1 py-1.5 text-sm hover:bg-neutral-800" key={element.id}>
                    <input
                      checked={draft.elementsAll || draft.elementIds.includes(element.id)}
                      disabled={draft.elementsAll}
                      onChange={(event) => setElementSelected(element.id, event.target.checked)}
                      type="checkbox"
                    />
                    {element.name}
                  </label>
                )) : (
                  <p className="py-2 text-sm text-neutral-500">В онтологии пока нет элементов.</p>
                )}
              </div>
            </fieldset>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="rounded px-3 py-1.5 text-sm hover:bg-neutral-800" type="button">
                Отмена
              </button>
            </Dialog.Close>
            <button
              className="rounded bg-neutral-100 px-3 py-1.5 text-sm text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!draft.name.trim()}
              onClick={save}
              type="button"
            >
              Сохранить
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
