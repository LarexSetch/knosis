import { ArrowLeftRight, ArrowRight, Plus, Trash2 } from 'lucide-react';
import type {
  OntologyFlowNode,
  OntologyProperty,
  OntologyRelationship,
  OntologyRelationshipData,
} from './ontology-types';

interface OntologyRelationshipEditorProps {
  edge: OntologyRelationship;
  nodes: OntologyFlowNode[];
  onChange: (data: OntologyRelationshipData) => void;
  onSwap: () => void;
}

export function OntologyRelationshipEditor({
  edge,
  nodes,
  onChange,
  onSwap,
}: OntologyRelationshipEditorProps) {
  const data = edge.data;
  if (!data) {
    return null;
  }

  const updateProperty = (index: number, updates: Partial<OntologyProperty>) => {
    onChange({
      ...data,
      properties: data.properties.map((property, propertyIndex) =>
        propertyIndex === index ? { ...property, ...updates } : property,
      ),
    });
  };

  const sourceName =
    nodes.find((node) => node.id === edge.source)?.data.name || 'Без названия';
  const targetName =
    nodes.find((node) => node.id === edge.target)?.data.name || 'Без названия';

  return (
    <aside className="ontology-editor" aria-label="Редактирование связи">
      <div className="welcome-kicker">Редактор связи</div>

      <div className="ontology-relationship__path">
        <span className="ontology-relationship__endpoint" title={sourceName}>
          {sourceName}
        </span>
        <ArrowRight className="ontology-relationship__arrow" size={16} />
        <input
          className="ontology-editor__control ontology-relationship__relation"
          aria-label="Relation"
          value={data.relation}
          placeholder="Relation"
          onChange={(event) => {
            const relation = event.target.value;
            onChange({ ...data, relation });
          }}
        />
        <ArrowRight className="ontology-relationship__arrow" size={16} />
        <span className="ontology-relationship__endpoint" title={targetName}>
          {targetName}
        </span>
      </div>

      <button
        className="ontology-relationship__swap"
        type="button"
        aria-label="Поменять source и target"
        title="Поменять source и target"
        onClick={onSwap}
      >
        <ArrowLeftRight size={14} />
      </button>

      <textarea
        className="ontology-editor__control"
        aria-label="Описание связи"
        value={data.description}
        placeholder="Описание для LLM-промпта"
        rows={4}
        onChange={(event) =>
          onChange({ ...data, description: event.target.value })
        }
      />

      <div className="ontology-editor__properties-heading">
        <span>Свойства</span>
        <button
          className="ontology-editor__add"
          type="button"
          onClick={() =>
            onChange({
              ...data,
              properties: [
                ...data.properties,
                { name: '', type: 'string', description: '' },
              ],
            })
          }
        >
          <Plus size={14} />
          Добавить
        </button>
      </div>

      <div className="ontology-editor__properties">
        {data.properties.map((property, index) => (
          <section className="ontology-editor__property" key={index}>
            <div className="ontology-editor__property-row">
              <input
                className="ontology-editor__control"
                aria-label={`Имя свойства ${index + 1}`}
                value={property.name}
                placeholder="Имя"
                onChange={(event) =>
                  updateProperty(index, { name: event.target.value })
                }
              />
              <select
                className="ontology-editor__control"
                aria-label={`Тип свойства ${index + 1}`}
                value={property.type}
                onChange={(event) => {
                  const type = event.target.value;
                  if (type === 'string' || type === 'number' || type === 'boolean') {
                    updateProperty(index, { type });
                  }
                }}
              >
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="boolean">boolean</option>
              </select>
              <button
                className="ontology-editor__remove"
                type="button"
                aria-label={`Удалить свойство ${property.name || index + 1}`}
                onClick={() =>
                  onChange({
                    ...data,
                    properties: data.properties.filter(
                      (_, propertyIndex) => propertyIndex !== index,
                    ),
                  })
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
            <textarea
              className="ontology-editor__control"
              aria-label={`Описание свойства ${index + 1}`}
              value={property.description}
              placeholder="Описание свойства"
              rows={2}
              onChange={(event) =>
                updateProperty(index, { description: event.target.value })
              }
            />
          </section>
        ))}
        {data.properties.length === 0 && (
          <p className="ontology-editor__empty">Свойств пока нет.</p>
        )}
      </div>
    </aside>
  );
}
