import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AssociationEditor from './AssociationEditor';
import type { OntologyAssociation, OntologyElement } from '../types';

type AssociationsListProps = {
  associations: OntologyAssociation[];
  elements: OntologyElement[];
  onChange: (associations: OntologyAssociation[]) => void;
};

export default function AssociationsList({ associations, elements, onChange }: AssociationsListProps) {
  const [editingAssociation, setEditingAssociation] = useState<OntologyAssociation | null>(null);

  function saveAssociation(association: OntologyAssociation) {
    const exists = associations.some((item) => item.id === association.id);
    onChange(exists
      ? associations.map((item) => item.id === association.id ? association : item)
      : [...associations, association],
    );
    setEditingAssociation(null);
  }

  function deleteAssociation(id: string) {
    onChange(associations.filter((association) => association.id !== id));
  }

  return (
    <section className="space-y-2 border-t border-neutral-800 pt-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-neutral-300">Ассоциации</h3>
        <button
          aria-label="Добавить ассоциацию"
          className="rounded p-1 hover:bg-neutral-800"
          onClick={() => setEditingAssociation({
            id: crypto.randomUUID(),
            name: '',
            summary: '',
            elementIds: [],
            elementsAll: false,
          })}
          type="button"
        >
          <Plus aria-hidden="true" size={14} />
        </button>
      </div>
      {associations.length ? (
        <ul className="space-y-1">
          {associations.map((association) => (
            <li className="flex items-start gap-1 rounded border border-neutral-800 p-2" key={association.id}>
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => setEditingAssociation(association)}
                type="button"
              >
                <span className="block truncate text-xs text-neutral-200">{association.name}</span>
                <span className="mt-1 block text-xs text-neutral-500">
                  {association.elementsAll ? 'Все элементы' : `${association.elementIds.length} элементов`}
                </span>
              </button>
              <button
                aria-label={`Редактировать ассоциацию ${association.name}`}
                className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                onClick={() => setEditingAssociation(association)}
                type="button"
              >
                <Pencil aria-hidden="true" size={13} />
              </button>
              <button
                aria-label={`Удалить ассоциацию ${association.name}`}
                className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                onClick={() => deleteAssociation(association.id)}
                type="button"
              >
                <Trash2 aria-hidden="true" size={13} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-neutral-500">Нет ассоциаций</p>
      )}

      {editingAssociation && (
        <AssociationEditor
          association={editingAssociation}
          elements={elements}
          onOpenChange={(open) => {
            if (!open) {
              setEditingAssociation(null);
            }
          }}
          onSave={saveAssociation}
        />
      )}
    </section>
  );
}
