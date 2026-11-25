import type {
  Document as OntologyDocument,
  Element as OntologyElement,
  Relation as OntologyRelation,
} from '../../../../backend/src/ontology/dto/ontology.dto';

export type { OntologyDocument, OntologyElement, OntologyRelation };

export type OntologyListItem = {
  id: string;
  name: string;
};

export type GraphSelection =
  | { kind: 'vertex'; id: string }
  | { kind: 'edge'; id: string }
  | null;
