import { useState } from 'react';
import { Dialog } from 'radix-ui';
import { Plus, Trash2, X } from 'lucide-react';
import type { OntologyContext, OntologyListItem } from '../types';

type OntologyConfiguratorProps = {
  ontology: OntologyListItem;
  contexts: OntologyContext[];
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, name: string, contexts: OntologyContext[]) => void;
  onDelete: (id: string) => void;
};

const fieldClassName = 'w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm outline-none focus:border-neutral-500';

export default function OntologyConfigurator({
  ontology,
  contexts,
  onOpenChange,
  onSave,
  onDelete,
}: OntologyConfiguratorProps) {
  const [name, setName] = useState(ontology.name);
  const [draftContexts, setDraftContexts] = useState(contexts);
  const canSave = name.trim() && draftContexts.every((context) => context.name.trim());

  function addContext() {
    setDraftContexts((current) => [
      ...current,
      { id: crypto.randomUUID(), name: 'Новый контекст', summary: '' },
    ]);
  }

  function updateContext(id: string, patch: Partial<OntologyContext>) {
    setDraftContexts((current) => current.map((context) =>
      context.id === id ? { ...context, ...patch } : context,
    ));
  }

  function deleteContext(id: string) {
    setDraftContexts((current) => current.filter((context) => context.id !== id));
  }

  function save() {
    if (!canSave) {
      return;
    }
    onSave(
      ontology.id,
      name.trim(),
      draftContexts.map((context) => ({
        ...context,
        name: context.name.trim(),
        summary: context.summary.trim(),
      })),
    );
    onOpenChange(false);
  }

  return (
    <Dialog.Root open onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded border border-neutral-700 bg-neutral-900 p-5 shadow-lg">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-medium">Настройки онтологии</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-neutral-400">
                Измените имя и контексты онтологии.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button aria-label="Закрыть" className="rounded p-1 hover:bg-neutral-800" type="button">
                <X aria-hidden="true" size={16} />
              </button>
            </Dialog.Close>
          </div>

          <label className="mb-6 block space-y-1 text-xs text-neutral-400">
            Имя онтологии
            <input
              autoFocus
              className={fieldClassName}
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </label>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium">Контексты</h3>
              <button
                className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-neutral-800"
                onClick={addContext}
                type="button"
              >
                <Plus aria-hidden="true" size={14} />
                Добавить контекст
              </button>
            </div>
            {draftContexts.length ? (
              <ul className="space-y-3">
                {draftContexts.map((context) => (
                  <li className="rounded border border-neutral-800 p-3" key={context.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-neutral-400">{context.name || 'Новый контекст'}</span>
                      <button
                        aria-label={`Удалить контекст ${context.name}`}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                        onClick={() => deleteContext(context.id)}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={14} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input
                        aria-label={`Название контекста ${context.id}`}
                        className={fieldClassName}
                        onChange={(event) => updateContext(context.id, { name: event.target.value })}
                        value={context.name}
                      />
                      <textarea
                        aria-label={`Описание контекста ${context.id}`}
                        className={`${fieldClassName} min-h-16 resize-y`}
                        onChange={(event) => updateContext(context.id, { summary: event.target.value })}
                        value={context.summary}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded border border-neutral-800 p-3 text-sm text-neutral-500">
                Контекстов пока нет.
              </p>
            )}
          </section>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              className="rounded px-3 py-1.5 text-sm text-red-300 hover:bg-red-950"
              onClick={() => onDelete(ontology.id)}
              type="button"
            >
              Удалить онтологию
            </button>
            <div className="flex gap-2">
              <Dialog.Close asChild>
                <button className="rounded px-3 py-1.5 text-sm hover:bg-neutral-800" type="button">
                  Отмена
                </button>
              </Dialog.Close>
              <button
                className="rounded bg-neutral-100 px-3 py-1.5 text-sm text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSave}
                onClick={save}
                type="button"
              >
                Сохранить
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
