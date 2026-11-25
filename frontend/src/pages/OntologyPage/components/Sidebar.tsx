import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { OntologyListItem } from '../types';

type SidebarProps = {
  items: OntologyListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => OntologyListItem;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
};

export default function Sidebar({ items, selectedId, onSelect, onAdd, onRename, onDelete }: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  function addOntology() {
    const ontology = onAdd();
    setEditingId(ontology.id);
    setDraftName(ontology.name);
  }

  function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draftName.trim();
    if (name && editingId) {
      onRename(editingId, name);
    }
    setEditingId(null);
  }

  function handleEditKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setEditingId(null);
    }
  }

  function startRename(ontology: OntologyListItem) {
    setEditingId(ontology.id);
    setDraftName(ontology.name);
  }

  return (
    <aside aria-label="Список онтологий" className="w-60 shrink-0 border-r border-neutral-800 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-sm font-medium">Онтологии</h1>
        <button
          aria-label="Добавить онтологию"
          className="rounded p-1 hover:bg-neutral-800"
          onClick={addOntology}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
        </button>
      </div>

      <ul className="space-y-1">
        {items.map((ontology) => (
          <li
            className={`group flex min-w-0 items-center rounded px-2 ${selectedId === ontology.id ? 'bg-neutral-800' : 'hover:bg-neutral-900'}`}
            key={ontology.id}
          >
            {editingId === ontology.id ? (
              <form className="min-w-0 flex-1 py-1" onSubmit={saveName}>
                <input
                  aria-label="Название онтологии"
                  autoFocus
                  className="w-full rounded border border-neutral-600 bg-neutral-950 px-1 py-1 text-sm outline-none"
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={handleEditKeyDown}
                  value={draftName}
                />
              </form>
            ) : (
              <>
                <button
                  className="min-w-0 flex-1 truncate py-2 text-left text-sm"
                  onClick={() => onSelect(ontology.id)}
                  type="button"
                >
                  {ontology.name}
                </button>
                <div className="invisible flex shrink-0 group-hover:visible group-focus-within:visible">
                  <button
                    aria-label={`Переименовать ${ontology.name}`}
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                    onClick={() => startRename(ontology)}
                    type="button"
                  >
                    <Pencil aria-hidden="true" size={14} />
                  </button>
                  <button
                    aria-label={`Удалить ${ontology.name}`}
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                    onClick={() => onDelete(ontology.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={14} />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
