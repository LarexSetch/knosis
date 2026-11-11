import type { OntologyDocument } from '../../../../backend/src/ontology/ontology.types';

export function importOntology(file: File): Promise<OntologyDocument> {
  return file.text().then((content) => JSON.parse(content) as OntologyDocument);
}

export function exportOntology(ontology: OntologyDocument): void {
  const blob = new Blob([JSON.stringify(ontology, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = ontology.metadata.name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-');
  link.download = `${fileName || 'ontology'}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
