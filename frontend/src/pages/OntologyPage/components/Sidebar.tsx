import { Pencil, Plus } from 'lucide-react';
import type { OntologyListItem } from '../types';

type SidebarProps = {
  items: OntologyListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onConfigure: (ontology: OntologyListItem) => void;
};

export default function Sidebar({ items, selectedId, onSelect, onAdd, onConfigure }: SidebarProps) {
  return (
    <aside aria-label="Список онтологий" className="w-60 shrink-0 border-r border-neutral-800 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-sm font-medium">Онтологии</h1>
        <button
          aria-label="Добавить онтологию"
          className="rounded p-1 hover:bg-neutral-800"
          onClick={onAdd}
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
            <button
              className="min-w-0 flex-1 truncate py-2 text-left text-sm"
              onClick={() => onSelect(ontology.id)}
              type="button"
            >
              {ontology.name}
            </button>
            <button
              aria-label={`Настроить онтологию ${ontology.name}`}
              className="invisible rounded p-1 text-neutral-400 group-hover:visible group-focus-within:visible hover:bg-neutral-700 hover:text-white"
              onClick={() => onConfigure(ontology)}
              type="button"
            >
              <Pencil aria-hidden="true" size={14} />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
