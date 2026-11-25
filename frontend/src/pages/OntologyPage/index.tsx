import { useState } from 'react';
import Sidebar from './components/Sidebar';
import GraphEditor from './components/GraphEditor';
import ElementEditor from './components/ElementEditor';
import { createEmptyDocument, createMockDocument } from './mockData';
import type {
  GraphSelection,
  OntologyDocument,
  OntologyElement,
  OntologyListItem,
  OntologyRelation,
} from './types';

const initialOntologies: OntologyListItem[] = [
  { id: 'core', name: 'Основная онтология' },
  { id: 'product', name: 'Продукт' },
  { id: 'team', name: 'Команда' },
];

export default function OntologyPage() {
  const [ontologies, setOntologies] = useState(initialOntologies);
  const [documents, setDocuments] = useState<Record<string, OntologyDocument>>(() => ({
    core: createMockDocument(),
    product: createMockDocument(),
    team: createMockDocument(),
  }));
  const [selectedId, setSelectedId] = useState<string | null>(initialOntologies[0].id);
  const [selection, setSelection] = useState<GraphSelection>(null);
  const document = selectedId ? documents[selectedId] : undefined;

  function addOntology() {
    const ontology = { id: crypto.randomUUID(), name: 'Новая онтология' };
    setOntologies((current) => [...current, ontology]);
    setDocuments((current) => ({ ...current, [ontology.id]: createEmptyDocument() }));
    setSelectedId(ontology.id);
    setSelection(null);
    return ontology;
  }

  function renameOntology(id: string, name: string) {
    setOntologies((current) => current.map((ontology) =>
      ontology.id === id ? { ...ontology, name } : ontology,
    ));
  }

  function deleteOntology(id: string) {
    const remaining = ontologies.filter((ontology) => ontology.id !== id);
    setOntologies(remaining);
    setDocuments((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    if (selectedId === id) {
      setSelectedId(remaining[0]?.id ?? null);
      setSelection(null);
    }
  }

  function updateDocument(update: (current: OntologyDocument) => OntologyDocument) {
    if (!selectedId) {
      return;
    }
    setDocuments((current) => {
      const selectedDocument = current[selectedId];
      return selectedDocument
        ? { ...current, [selectedId]: update(selectedDocument) }
        : current;
    });
  }

  function updateVertex(vertex: OntologyElement) {
    updateDocument((current) => ({
      ...current,
      elements: current.elements.map((item) => item.id === vertex.id ? vertex : item),
    }));
  }

  function updateEdge(edge: OntologyRelation) {
    updateDocument((current) => ({
      ...current,
      relations: current.relations.map((item) => item.id === edge.id ? edge : item),
    }));
  }

  function moveVertex(id: string, position: { x: number; y: number }) {
    updateDocument((current) => ({
      ...current,
      elements: current.elements.map((vertex) => vertex.id === id
        ? { ...vertex, meta: { ...vertex.meta, position } }
        : vertex,
      ),
    }));
  }

  return (
    <div className="flex h-[calc(100vh-40px)] min-h-[360px] min-w-0">
      <Sidebar
        items={ontologies}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          setSelection(null);
        }}
        onAdd={addOntology}
        onRename={renameOntology}
        onDelete={deleteOntology}
      />
      {document ? (
        <>
          <GraphEditor document={document} onMoveVertex={moveVertex} onSelect={setSelection} />
          <ElementEditor
            document={document}
            onClose={() => setSelection(null)}
            onEdgeChange={updateEdge}
            onVertexChange={updateVertex}
            selection={selection}
          />
        </>
      ) : (
        <div className="grid min-w-0 flex-1 place-items-center text-sm text-neutral-400">
          Добавьте онтологию, чтобы начать работу.
        </div>
      )}
    </div>
  );
}
