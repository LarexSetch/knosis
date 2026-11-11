import type { OntologyDocument } from '../../../../backend/src/ontology/ontology.types';

const ONTOLOGY_ID = 'ontology-builder';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const LEGACY_STORAGE_KEY = 'knosis.ontology-builder.ontology';

export interface OntologyService {
  save(ontology: OntologyDocument): Promise<void>;
  load(): Promise<OntologyDocument | null>;
}

export const ontologyService: OntologyService = {
  async save(ontology) {
    const response = await fetch(
      `${API_URL.replace(/\/+$/, '')}/ontologies/${ONTOLOGY_ID}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ontology),
      },
    );
    if (!response.ok) {
      const message = await response.text();
      throw new Error(
        `Не удалось сохранить онтологию (${response.status}): ${message || response.statusText}`,
      );
    }
  },

  async load() {
    const response = await fetch(
      `${API_URL.replace(/\/+$/, '')}/ontologies/${ONTOLOGY_ID}`,
    );
    if (response.status === 404) {
      const saved = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved !== null) {
        const ontology = JSON.parse(saved) as OntologyDocument;
        await this.save(ontology);
        return ontology;
      }
      return null;
    }
    if (!response.ok) {
      const message = await response.text();
      throw new Error(
        `Не удалось загрузить онтологию (${response.status}): ${message || response.statusText}`,
      );
    }
    return response.json() as Promise<OntologyDocument>;
  },
};
