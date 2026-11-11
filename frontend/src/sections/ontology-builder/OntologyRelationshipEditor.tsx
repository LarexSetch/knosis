import { ArrowLeftRight, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import type {
  OntologyProperty,
  OntologyRelationship,
} from '../../../../backend/src/ontology/ontology.types';
import type {
  OntologyNodeWrapper,
  OntologyRelationshipWrapper,
} from './ontology-flow.types';

interface OntologyRelationshipEditorProps {
  edge: OntologyRelationshipWrapper;
  nodes: OntologyNodeWrapper[];
  onChange: (relationship: OntologyRelationship) => void;
  onSwap: () => void;
}

export function OntologyRelationshipEditor({
  edge,
  nodes,
  onChange,
  onSwap,
}: OntologyRelationshipEditorProps) {
  const relationship = edge.data.ontologyRelationship;

  const updateProperty = (index: number, updates: Partial<OntologyProperty>) => {
    onChange({
      ...relationship,
      properties: relationship.properties.map((property, propertyIndex) =>
        propertyIndex === index ? { ...property, ...updates } : property,
      ),
    });
  };

  const sourceName =
    nodes.find((node) => node.id === edge.source)?.data.ontologyNode.name || 'Без названия';
  const targetName =
    nodes.find((node) => node.id === edge.target)?.data.ontologyNode.name || 'Без названия';

  return (
    <aside className="ontology-editor" aria-label="Редактирование связи">
      <div className="welcome-kicker">Редактор связи</div>

      <div className="ontology-relationship__path">
        <span className="ontology-relationship__endpoint" title={sourceName}>
          {sourceName}
        </span>
        <ArrowRight className="ontology-relationship__arrow" size={16} />
        <Input
          className="ontology-editor__control ontology-relationship__relation"
          aria-label="Relation"
          value={relationship.relation}
          placeholder="Relation"
          onChange={(event) => {
            const relation = event.target.value;
            onChange({ ...relationship, relation });
          }}
        />
        <ArrowRight className="ontology-relationship__arrow" size={16} />
        <span className="ontology-relationship__endpoint" title={targetName}>
          {targetName}
        </span>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="ontology-relationship__swap"
        type="button"
        aria-label="Поменять source и target"
        title="Поменять source и target"
        onClick={onSwap}
      >
        <ArrowLeftRight size={14} />
      </Button>

      <Textarea
        className="ontology-editor__control"
        aria-label="Описание связи"
        value={relationship.description}
        placeholder="Описание для LLM-промпта"
        rows={4}
        onChange={(event) =>
          onChange({ ...relationship, description: event.target.value })
        }
      />

      <div className="ontology-editor__properties-heading">
        <span>Свойства</span>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() =>
            onChange({
              ...relationship,
              properties: [
                ...relationship.properties,
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
        {relationship.properties.map((property, index) => (
          <section className="ontology-editor__property" key={index}>
            <div className="ontology-editor__property-row">
              <Input
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
                  onChange({
                    ...relationship,
                    properties: relationship.properties.filter(
                      (_, propertyIndex) => propertyIndex !== index,
                    ),
                  })
                }
              >
                <Trash2 size={14} />
              </Button>
            </div>
            <Textarea
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
        {relationship.properties.length === 0 && (
          <p className="ontology-editor__empty">Свойств пока нет.</p>
        )}
      </div>
    </aside>
  );
}
