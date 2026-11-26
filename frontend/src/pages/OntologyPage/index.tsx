import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import GraphEditor from './components/GraphEditor';
import ElementEditor from './components/ElementEditor';
import OntologyConfigurator from './components/OntologyConfigurator';
import {
  applyElementUpdate,
  buildNewOntologyElement,
  buildNewOntologyRelation,
  ontologyPageApi,
  reconnectRelation,
  removeElement,
} from './ontologyApi';
import type {
  GraphSelection,
  OntologyContext,
  OntologyDocument,
  OntologyElement,
  OntologyListItem,
  OntologyRelation,
} from './types';

function formatErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function OntologyPage() {
  const [ontologies, setOntologies] = useState<OntologyListItem[]>([]);
  const [documents, setDocuments] = useState<Record<string, OntologyDocument>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selection, setSelection] = useState<GraphSelection>(null);
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const documentsRef = useRef(documents);
  documentsRef.current = documents;
  const pendingLoadsRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);

  const document = selectedId ? documents[selectedId] : undefined;
  const configuringOntology = ontologies.find((ontology) => ontology.id === configuringId);
  const configuringDocument = configuringId ? documents[configuringId] : undefined;

  const loadDocumentIfNeeded = useCallback(async (id: string) => {
    if (documentsRef.current[id] || pendingLoadsRef.current.has(id)) {
      return;
    }

    pendingLoadsRef.current.add(id);
    setIsLoadingDocument(true);

    try {
      const loaded = await ontologyPageApi.loadById(id);
      if (!isMountedRef.current) {
        return;
      }

      setDocuments((current) => ({ ...current, [id]: loaded.document }));
      setOntologies((current) => current.map((item) => (item.id === id ? loaded.ontology : item)));
      setErrorMessage(null);
    } catch (error) {
      if (isMountedRef.current) {
        setErrorMessage(formatErrorMessage(error, 'Не удалось загрузить содержимое онтологии'));
      }
    } finally {
      pendingLoadsRef.current.delete(id);
      if (isMountedRef.current) {
        setIsLoadingDocument(pendingLoadsRef.current.size > 0);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    async function loadInitialList() {
      setIsLoadingList(true);
      try {
        const list = await ontologyPageApi.loadList();
        if (!isMountedRef.current) {
          return;
        }

        setOntologies(list);
        setSelectedId((current) => (current && list.some((item) => item.id === current) ? current : list[0]?.id ?? null));
        setErrorMessage(null);
      } catch (error) {
        if (isMountedRef.current) {
          setErrorMessage(formatErrorMessage(error, 'Не удалось загрузить список онтологий'));
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoadingList(false);
        }
      }
    }

    void loadInitialList();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (selectedId) {
      void loadDocumentIfNeeded(selectedId);
    }
  }, [selectedId, loadDocumentIfNeeded]);

  useEffect(() => {
    if (configuringId) {
      void loadDocumentIfNeeded(configuringId);
    }
  }, [configuringId, loadDocumentIfNeeded]);

  async function addOntology() {
    try {
      const created = await ontologyPageApi.create();
      if (!isMountedRef.current) {
        return;
      }

      setOntologies((current) => [created.ontology, ...current]);
      setDocuments((current) => ({ ...current, [created.ontology.id]: created.document }));
      setSelectedId(created.ontology.id);
      setSelection(null);
      setErrorMessage(null);
    } catch (error) {
      if (isMountedRef.current) {
        setErrorMessage(formatErrorMessage(error, 'Не удалось создать онтологию'));
      }
    }
  }

  async function saveOntologyConfiguration(id: string, name: string, contexts: OntologyContext[]) {
    const currentDocument = documents[id];
    if (!currentDocument) {
      return;
    }

    try {
      const updated = await ontologyPageApi.updateConfiguration(id, name, currentDocument, contexts);
      if (!isMountedRef.current) {
        return;
      }

      setOntologies((current) => current.map((item) => (item.id === id ? updated.ontology : item)));
      setDocuments((current) => ({ ...current, [id]: updated.document }));
      setConfiguringId(null);
      setErrorMessage(null);
    } catch (error) {
      if (isMountedRef.current) {
        setErrorMessage(formatErrorMessage(error, 'Не удалось обновить настройки онтологии'));
      }
    }
  }

  async function deleteOntology(id: string) {
    try {
      await ontologyPageApi.remove(id);
      if (!isMountedRef.current) {
        return;
      }

      const remaining = ontologies.filter((item) => item.id !== id);
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
      setConfiguringId(null);
      setErrorMessage(null);
    } catch (error) {
      if (isMountedRef.current) {
        setErrorMessage(formatErrorMessage(error, 'Не удалось удалить онтологию'));
      }
    }
  }

  async function saveDocumentUpdate(update: (current: OntologyDocument) => OntologyDocument) {
    if (!selectedId) {
      return;
    }

    const currentDocument = documentsRef.current[selectedId];
    if (!currentDocument) {
      return;
    }

    const nextDocument = update(currentDocument);
    documentsRef.current = { ...documentsRef.current, [selectedId]: nextDocument };
    setDocuments((current) => ({ ...current, [selectedId]: nextDocument }));

    try {
      await ontologyPageApi.updateDocument(selectedId, nextDocument);
      if (isMountedRef.current) {
        setErrorMessage(null);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setErrorMessage(formatErrorMessage(error, 'Не удалось сохранить изменения онтологии'));
      }
    }
  }

  function handleElementChange(item: OntologyElement | OntologyRelation, previousId: string) {
    void saveDocumentUpdate((current) => applyElementUpdate(current, item, previousId));
    const kind = 'meta' in item ? 'vertex' : 'edge';
    if (item.id !== previousId) {
      setSelection((current) => (current?.kind === kind && current.id === previousId
        ? { kind, id: item.id }
        : current));
    }
  }

  function moveVertex(id: string, position: { x: number; y: number }) {
    void saveDocumentUpdate((current) => ({
      ...current,
      elements: current.elements.map((vertex) => (vertex.id === id
        ? { ...vertex, meta: { ...vertex.meta, position } }
        : vertex)),
    }));
  }

  function addVertex() {
    const currentDocument = selectedId ? documentsRef.current[selectedId] : undefined;
    if (!currentDocument) {
      return;
    }

    const newElement = buildNewOntologyElement(currentDocument.elements);
    void saveDocumentUpdate((current) => ({
      ...current,
      elements: [...current.elements, newElement],
    }));
    setSelection({ kind: 'vertex', id: newElement.id });
  }

  function deleteVertex(id: string) {
    void saveDocumentUpdate((current) => removeElement(current, id));
    setSelection(null);
  }

  function connectVertices(sourceElementId: string, targetElementId: string) {
    const newRelation = buildNewOntologyRelation(sourceElementId, targetElementId);
    void saveDocumentUpdate((current) => ({
      ...current,
      relations: [...current.relations, newRelation],
    }));
    setSelection({ kind: 'edge', id: newRelation.id });
  }

  function reconnectEdge(relationId: string, sourceElementId: string, targetElementId: string) {
    void saveDocumentUpdate((current) =>
      reconnectRelation(current, relationId, sourceElementId, targetElementId),
    );
  }

  return (
    <div className="flex h-[calc(100vh-40px)] min-h-[360px] min-w-0 flex-col">
      {errorMessage && (
        <div
          className="flex items-center justify-between border-b border-red-900 bg-red-950/60 px-3 py-1.5 text-xs text-red-200"
          role="alert"
        >
          <span>{errorMessage}</span>
          <button
            className="rounded px-2 py-0.5 text-red-200 hover:bg-red-900/60"
            onClick={() => setErrorMessage(null)}
            type="button"
          >
            Скрыть
          </button>
        </div>
      )}
      <div className="flex min-h-0 min-w-0 flex-1">
        <Sidebar
          items={ontologies}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setSelection(null);
          }}
          onAdd={addOntology}
          onConfigure={(ontology) => setConfiguringId(ontology.id)}
        />
        {document ? (
          <>
            <GraphEditor
              document={document}
              onAddVertex={addVertex}
              onConnect={connectVertices}
              onMoveVertex={moveVertex}
              onReconnect={reconnectEdge}
              onSelect={setSelection}
            />
            <ElementEditor
              document={document}
              onChange={handleElementChange}
              onClose={() => setSelection(null)}
              onDelete={deleteVertex}
              selection={selection}
            />
          </>
        ) : (
          <div className="grid min-w-0 flex-1 place-items-center text-sm text-neutral-400">
            {isLoadingList || (selectedId && isLoadingDocument)
              ? 'Загрузка онтологии...'
              : 'Добавьте онтологию, чтобы начать работу.'}
          </div>
        )}
        {configuringOntology && configuringDocument && (
          <OntologyConfigurator
            ontology={configuringOntology}
            contexts={configuringDocument.contexts}
            onOpenChange={(open) => {
              if (!open) {
                setConfiguringId(null);
              }
            }}
            onSave={saveOntologyConfiguration}
            onDelete={deleteOntology}
          />
        )}
      </div>
    </div>
  );
}
