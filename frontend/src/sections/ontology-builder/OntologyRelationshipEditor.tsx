import { ArrowLeftRight, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import type { OntologyRelationship } from '../../../../backend/src/ontology/ontology.types';
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
  const sourceName =
    nodes.find((node) => node.id === edge.source)?.data.ontologyNode.name ||
    'Без названия';
  const targetName =
    nodes.find((node) => node.id === edge.target)?.data.ontologyNode.name ||
    'Без названия';

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
          onChange={(event) =>
            onChange({ ...relationship, relation: event.target.value })
          }
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
    </aside>
  );
}
