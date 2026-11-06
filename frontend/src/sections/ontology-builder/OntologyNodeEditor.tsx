import { Plus, Trash2 } from 'lucide-react';
import type { OntologyFlowNode, OntologyNodeData } from './ontology-types';

interface OntologyNodeEditorProps {
  node: OntologyFlowNode;
  onChange: (data: OntologyNodeData) => void;
}

export function OntologyNodeEditor({ node, onChange }: OntologyNodeEditorProps) {
  const updateNode = (updates: Partial<OntologyNodeData>) => {
    onChange({ ...node.data, ...updates });
  };

  const updateProperty = (
    index: number,
    updates: Partial<OntologyNodeData['properties'][number]>,
  ) => {
    updateNode({
      properties: node.data.properties.map((property, propertyIndex) =>
        propertyIndex === index ? { ...property, ...updates } : property,
      ),
    });
  };

  return (
    <aside className="ontology-editor" aria-label="Редактирование ноды">
      <div className="ontology-editor__heading">
        <div className="welcome-kicker">Редактор ноды</div>
        <div className="ontology-editor__node-row">
          <input
            className="ontology-editor__control"
            aria-label="Название ноды"
            value={node.data.name}
            onChange={(event) => updateNode({ name: event.target.value })}
            placeholder="Название ноды"
          />
          <input
            aria-label="Цвет ноды"
            className="ontology-editor__color"
            type="color"
            value={node.data.color}
            onChange={(event) => updateNode({ color: event.target.value })}
          />
        </div>
      </div>

      <div className="ontology-editor__field">
        <textarea
          className="ontology-editor__control"
          aria-label="Описание ноды"
          value={node.data.description}
          onChange={(event) => updateNode({ description: event.target.value })}
          placeholder="Описание для LLM-промпта"
          rows={4}
        />
      </div>

      <div className="ontology-editor__properties-heading">
        <span>Свойства</span>
        <button
          className="ontology-editor__add"
          type="button"
          onClick={() =>
            updateNode({
              properties: [
                ...node.data.properties,
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
        {node.data.properties.map((property, index) => (
          <section className="ontology-editor__property" key={index}>
            <div className="ontology-editor__property-row">
              <input
                className="ontology-editor__control"
                aria-label={`Имя свойства ${index + 1}`}
                value={property.name}
                onChange={(event) =>
                  updateProperty(index, { name: event.target.value })
                }
                placeholder="Имя"
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
                  updateNode({
                    properties: node.data.properties.filter(
                      (_, propertyIndex) => propertyIndex !== index,
                    ),
                  })
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="ontology-editor__field">
              <textarea
                className="ontology-editor__control"
                aria-label={`Описание свойства ${index + 1}`}
                value={property.description}
                onChange={(event) =>
                  updateProperty(index, { description: event.target.value })
                }
                placeholder="Описание свойства"
                rows={2}
              />
            </div>
          </section>
        ))}
        {node.data.properties.length === 0 && (
          <p className="ontology-editor__empty">Свойств пока нет.</p>
        )}
      </div>
    </aside>
  );
}
