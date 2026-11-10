import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  OntologyNodeStatus,
  type OntologyAssociation,
} from '../../../../backend/src/ontology/ontology.types';
import type {
  OntologyFlowNode,
  OntologyFlowNodeData,
} from './ontology-flow.types';

interface OntologyNodeEditorProps {
  node: OntologyFlowNode;
  availableNodes: OntologyFlowNode[];
  onDelete: () => void;
  onChange: (data: OntologyFlowNodeData) => void;
}

export function OntologyNodeEditor({
  node,
  availableNodes,
  onDelete,
  onChange,
}: OntologyNodeEditorProps) {
  const updateNode = (updates: Partial<OntologyFlowNodeData>) => {
    const status = updates.associations
      ? updates.associations.length > 0
        ? OntologyNodeStatus.ASSOCIATED
        : node.data.status === OntologyNodeStatus.RELATED
          ? OntologyNodeStatus.RELATED
          : OntologyNodeStatus.DETACHED
      : node.data.status;
    onChange({ ...node.data, ...updates, status });
  };

  const updateProperty = (
    index: number,
    updates: Partial<OntologyFlowNodeData['properties'][number]>,
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
        <div className="ontology-editor__title-row">
          <div className="welcome-kicker">Редактор ноды</div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-300 hover:text-red-200"
            type="button"
            onClick={onDelete}
          >
            Удалить ноду
          </Button>
        </div>
        <div className="ontology-editor__node-row">
          <Input
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
        <Textarea
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
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() =>
            updateNode({
              properties: [
                ...node.data.properties,
                { name: '', type: 'string', required: false, description: '' },
              ],
            })
          }
        >
          <Plus size={14} />
          Добавить
        </Button>
      </div>

      <div className="ontology-editor__properties">
        {node.data.properties.map((property, index) => (
          <section className="ontology-editor__property" key={index}>
            <div className="ontology-editor__property-row">
              <Input
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
              <label
                className="ontology-editor__required"
                title="Обязательное свойство"
              >
                <input
                  type="checkbox"
                  checked={property.required ?? false}
                  aria-label={`Обязательное свойство ${index + 1}`}
                  onChange={(event) =>
                    updateProperty(index, { required: event.target.checked })
                  }
                />
                Обязательное
              </label>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
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
              </Button>
            </div>
            <div className="ontology-editor__field">
              <Textarea
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
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() =>
            updateNode({
              associations: [
                ...node.data.associations,
                { relation: '', description: '', nodeIds: [], nodesAll: false },
              ],
            })
          }
        >
          <Plus size={14} />
          Добавить
        </Button>
      </div>

      <div className="ontology-editor__properties">
        {node.data.associations.map((association, index) => (
          <section className="ontology-editor__property" key={index}>
            <div className="ontology-editor__property-row">
              <Input
                className="ontology-editor__control"
                aria-label={`Тип связи ${index + 1}`}
                value={association.relation}
                onChange={(event) =>
                  updateAssociation(index, { relation: event.target.value })
                }
                placeholder="Связь, например DEFINES"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
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
              </Button>
            </div>
            <Textarea
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
                checked={association.nodesAll}
                onChange={(event) =>
                  updateAssociation(index, { nodesAll: event.target.checked })
                }
              />
              Связать со всеми нодами
            </label>
            <div className="ontology-editor__targets" aria-label="Цели связи">
              {availableNodes.map((target) => {
                const isSelf = target.id === node.id;
                const isChecked =
                  association.nodesAll || association.nodeIds.includes(target.id);

                return (
                  <label
                    className={`ontology-editor__target${isSelf ? ' ontology-editor__target--self' : ''}`}
                    key={target.id}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={association.nodesAll}
                      onChange={(event) => {
                        const nodeIds = new Set(association.nodeIds);
                        if (event.target.checked) {
                          nodeIds.add(target.id);
                        } else {
                          nodeIds.delete(target.id);
                        }
                        updateAssociation(index, { nodeIds: [...nodeIds] });
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
