import { Plus, Trash2 } from 'lucide-react';
import type {
  OntologyAssociation,
  OntologyFlowNode,
  OntologyNodeData,
} from './ontology-types';
import { OntologyNodeIcon } from './ontology-types';

interface OntologyNodeEditorProps {
  node: OntologyFlowNode;
  availableNodes: OntologyFlowNode[];
  onChange: (data: OntologyNodeData) => void;
}

export function OntologyNodeEditor({
  node,
  availableNodes,
  onChange,
}: OntologyNodeEditorProps) {
  const updateNode = (updates: Partial<OntologyNodeData>) => {
    const icons = updates.associations
      ? updates.associations.length > 0
        ? [OntologyNodeIcon.ASSOCIATIONS]
        : [OntologyNodeIcon.DETACHED]
      : node.data.icons;
    onChange({ ...node.data, ...updates, icons });
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

  const updateAssociation = (
    index: number,
    updates: Partial<OntologyAssociation>,
  ) => {
    updateNode({
      associations: node.data.associations.map((association, associationIndex) =>
        associationIndex === index
          ? { ...association, ...updates }
          : association,
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

      <div className="ontology-editor__properties-heading">
        <span>Ассоциации</span>
        <button
          className="ontology-editor__add"
          type="button"
          onClick={() =>
            updateNode({
              associations: [
                ...node.data.associations,
                { relation: '', description: '', targets: [], targetsAll: false },
              ],
            })
          }
        >
          <Plus size={14} />
          Добавить
        </button>
      </div>

      <div className="ontology-editor__properties">
        {node.data.associations.map((association, index) => (
          <section className="ontology-editor__property" key={index}>
            <div className="ontology-editor__property-row">
              <input
                className="ontology-editor__control"
                aria-label={`Тип связи ${index + 1}`}
                value={association.relation}
                onChange={(event) =>
                  updateAssociation(index, { relation: event.target.value })
                }
                placeholder="Связь, например DEFINES"
              />
              <button
                className="ontology-editor__remove"
                type="button"
                aria-label={`Удалить ассоциацию ${association.relation || index + 1}`}
                onClick={() =>
                  updateNode({
                    associations: node.data.associations.filter(
                      (_, associationIndex) => associationIndex !== index,
                    ),
                  })
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
            <textarea
              className="ontology-editor__control"
              aria-label={`Описание связи ${index + 1}`}
              value={association.description}
              onChange={(event) =>
                updateAssociation(index, { description: event.target.value })
              }
              placeholder="Описание связи"
              rows={2}
            />
            <label className="ontology-editor__targets-all">
              <input
                type="checkbox"
                checked={association.targetsAll}
                onChange={(event) =>
                  updateAssociation(index, { targetsAll: event.target.checked })
                }
              />
              Связать со всеми нодами
            </label>
            <div className="ontology-editor__targets" aria-label="Цели связи">
              {availableNodes.map((target) => {
                const isSelf = target.id === node.id;
                const isChecked =
                  association.targetsAll || association.targets.includes(target.id);

                return (
                  <label
                    className={`ontology-editor__target${isSelf ? ' ontology-editor__target--self' : ''}`}
                    key={target.id}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={association.targetsAll}
                      onChange={(event) => {
                        const targets = new Set(association.targets);
                        if (event.target.checked) {
                          targets.add(target.id);
                        } else {
                          targets.delete(target.id);
                        }
                        updateAssociation(index, { targets: [...targets] });
                      }}
                    />
                    <span>{target.data.name || 'Без названия'}</span>
                    {isSelf && <small>self</small>}
                  </label>
                );
              })}
            </div>
          </section>
        ))}
        {node.data.associations.length === 0 && (
          <p className="ontology-editor__empty">Ассоциаций пока нет.</p>
        )}
      </div>
    </aside>
  );
}
