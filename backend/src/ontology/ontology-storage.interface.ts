import type { OntologyDocument } from './ontology.types';

export const ONTOLOGY_STORAGE = Symbol('ONTOLOGY_STORAGE');

export function isValidOntologyId(id: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(id);
}

export interface OntologyStorage {
  save(id: string, ontology: OntologyDocument): Promise<void>;
  load(id: string): Promise<OntologyDocument | null>;
}
