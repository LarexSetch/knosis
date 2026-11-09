import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  codeBlockPlugin,
  codeMirrorPlugin,
  CodeToggle,
  CreateLink,
  headingsPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  thematicBreakPlugin,
  MDXEditor,
  quotePlugin,
  Separator,
  imagePlugin,
  tablePlugin,
  toolbarPlugin,
  UndoRedo,
} from '@mdxeditor/editor';
import {
  BookOpenText,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Route, Routes, useOutletContext } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import type { AppLayoutContext } from '../../components/AppLayout';
import {
  loadDocumentationDocuments,
  prepareMarkdownForEditor,
  parseDocumentationHeadings,
  saveDocumentationDocuments,
  type DocumentationDocument,
  type DocumentationHeading,
} from './documentation-service';
import '@mdxeditor/editor/style.css';
import './DocumentationImporter.css';

const editorPlugins = [
  headingsPlugin(),
  listsPlugin(),
  quotePlugin(),
  linkPlugin(),
  tablePlugin(),
  codeBlockPlugin(),
  thematicBreakPlugin(),
  codeMirrorPlugin({
    codeBlockLanguages: {
      bash: 'Bash',
      css: 'CSS',
      html: 'HTML',
      javascript: 'JavaScript',
      json: 'JSON',
      python: 'Python',
      text: 'Text',
      typescript: 'TypeScript',
    },
  }),
  imagePlugin(),
  markdownShortcutPlugin(),
  toolbarPlugin({
    toolbarContents: () => (
      <>
        <UndoRedo />
        <Separator />
        <BlockTypeSelect />
        <BoldItalicUnderlineToggles />
        <Separator />
        <ListsToggle />
        <CodeToggle />
        <CreateLink />
        <Separator />
      </>
    ),
  }),
];

function readInitialDocuments() {
  try {
    return { documents: loadDocumentationDocuments(), error: '' };
  } catch (error) {
    return {
      documents: [],
      error: error instanceof Error
        ? `Не удалось загрузить сохранённые документы: ${error.message}`
        : 'Не удалось загрузить сохранённые документы.',
    };
  }
}

function DocumentsSidebar({
  documents,
  selectedId,
  onSelect,
  editingId,
  editingName,
  onEditingNameChange,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onDelete,
}: {
  documents: DocumentationDocument[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  editingId: string | null;
  editingName: string;
  onEditingNameChange: (name: string) => void;
  onStartRename: (document: DocumentationDocument) => void;
  onSaveRename: (id: string) => void;
  onCancelRename: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="documentation-sidebar" aria-label="Документы">
      <div className="documentation-sidebar__heading">Документы</div>
      {documents.length === 0 ? (
        <p className="documentation-sidebar__empty">Добавленные файлы появятся здесь.</p>
      ) : (
        <nav className="documentation-sidebar__documents" aria-label="Список документов">
          {documents.map((document) => (
            <div className="documentation-sidebar__row" key={document.id}>
              {editingId === document.id ? (
                <>
                  <input
                    className="documentation-sidebar__rename-input"
                    aria-label={`Новое название: ${document.name}`}
                    autoFocus
                    value={editingName}
                    onChange={(event) => onEditingNameChange(event.currentTarget.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        onSaveRename(document.id);
                      } else if (event.key === 'Escape') {
                        onCancelRename();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="documentation-sidebar__icon-action"
                    aria-label={`Сохранить название: ${document.name}`}
                    title="Сохранить"
                    onClick={() => onSaveRename(document.id)}
                  >
                    <Check size={15} aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="documentation-sidebar__icon-action"
                    aria-label={`Отменить переименование: ${document.name}`}
                    title="Отменить"
                    onClick={onCancelRename}
                  >
                    <X size={15} aria-hidden="true" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className={`documentation-sidebar__document${document.id === selectedId ? ' is-selected' : ''}`}
                    aria-current={document.id === selectedId ? 'page' : undefined}
                    title={document.name}
                    onClick={() => onSelect(document.id)}
                  >
                    <FileText size={16} aria-hidden="true" />
                    <span>{document.name}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="documentation-sidebar__icon-action"
                    aria-label={`Переименовать документ: ${document.name}`}
                    title="Переименовать"
                    onClick={() => onStartRename(document)}
                  >
                    <Pencil size={14} aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="documentation-sidebar__icon-action documentation-sidebar__icon-action--delete"
                    aria-label={`Удалить документ: ${document.name}`}
                    title="Удалить"
                    onClick={() => onDelete(document.id)}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </nav>
      )}
    </section>
  );
}

function HeadingTree({
  headings,
  documentId,
  collapsedIndexes,
  onSelect,
  onToggle,
}: {
  headings: DocumentationHeading[];
  documentId: string;
  collapsedIndexes: Set<number>;
  onSelect: (index: number) => void;
  onToggle: (documentId: string, index: number) => void;
}) {
  return (
    <ul className="documentation-outline__list">
      {headings.map((heading) => (
        <li key={heading.index}>
          <div className="documentation-outline__row">
            {heading.children.length > 0 ? (
              <button
                type="button"
                className="documentation-outline__toggle"
                aria-label={`${collapsedIndexes.has(heading.index) ? 'Развернуть' : 'Свернуть'} раздел: ${heading.title}`}
                aria-expanded={!collapsedIndexes.has(heading.index)}
                title={collapsedIndexes.has(heading.index) ? 'Развернуть' : 'Свернуть'}
                onClick={() => onToggle(documentId, heading.index)}
              >
                {collapsedIndexes.has(heading.index)
                  ? <ChevronRight size={13} aria-hidden="true" />
                  : <ChevronDown size={13} aria-hidden="true" />}
              </button>
            ) : (
              <span className="documentation-outline__toggle-spacer" aria-hidden="true" />
            )}
            <button
              type="button"
              className="documentation-outline__item"
              title={heading.title}
              onClick={() => onSelect(heading.index)}
            >
              <span className="documentation-outline__level">H{heading.level}</span>
              <span>{heading.title}</span>
            </button>
          </div>
          {heading.children.length > 0 && !collapsedIndexes.has(heading.index) && (
            <HeadingTree
              headings={heading.children}
              documentId={documentId}
              collapsedIndexes={collapsedIndexes}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

function DocumentationWorkspace() {
  const { setSidebarContent } = useOutletContext<AppLayoutContext>();
  const [initialState] = useState(readInitialDocuments);
  const [documents, setDocuments] = useState(initialState.documents);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialState.documents[0]?.id ?? null,
  );
  const [status, setStatus] = useState(initialState.error);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingDocumentName, setEditingDocumentName] = useState('');
  const [collapsedHeadingIndexes, setCollapsedHeadingIndexes] = useState<
    Record<string, Set<number>>
  >({});
  const selectedDocument = documents.find(({ id }) => id === selectedId) ?? null;
  const headings = useMemo(
    () => parseDocumentationHeadings(selectedDocument?.markdown ?? ''),
    [selectedDocument?.markdown],
  );
  const editorMarkdown = useMemo(
    () => prepareMarkdownForEditor(selectedDocument?.markdown ?? ''),
    [selectedDocument?.markdown],
  );

  const toggleHeading = useCallback((documentId: string, index: number) => {
    setCollapsedHeadingIndexes((current) => {
      const collapsed = new Set(current[documentId] ?? []);
      if (collapsed.has(index)) {
        collapsed.delete(index);
      } else {
        collapsed.add(index);
      }
      return { ...current, [documentId]: collapsed };
    });
  }, []);

  const startRename = useCallback((document: DocumentationDocument) => {
    setEditingDocumentId(document.id);
    setEditingDocumentName(document.name);
    setStatus('');
  }, []);

  const cancelRename = useCallback(() => {
    setEditingDocumentId(null);
    setEditingDocumentName('');
  }, []);

  const saveRename = useCallback((id: string) => {
    const name = editingDocumentName.trim();
    if (!name) {
      setStatus('Название документа не может быть пустым.');
      return;
    }

    const updatedDocuments = documents.map((document) =>
      document.id === id ? { ...document, name } : document,
    );
    try {
      saveDocumentationDocuments(updatedDocuments);
      setDocuments(updatedDocuments);
      setStatus('');
      cancelRename();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `Не удалось сохранить название документа: ${error.message}`
          : 'Не удалось сохранить название документа.',
      );
    }
  }, [cancelRename, documents, editingDocumentName]);

  const deleteDocument = useCallback((id: string) => {
    const deletedIndex = documents.findIndex((document) => document.id === id);
    const updatedDocuments = documents.filter((document) => document.id !== id);
    try {
      saveDocumentationDocuments(updatedDocuments);
      setDocuments(updatedDocuments);
      if (selectedId === id) {
        setSelectedId(
          updatedDocuments[Math.min(deletedIndex, updatedDocuments.length - 1)]?.id ?? null,
        );
      }
      if (editingDocumentId === id) {
        cancelRename();
      }
      setStatus('');
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `Не удалось удалить документ: ${error.message}`
          : 'Не удалось удалить документ.',
      );
    }
  }, [cancelRename, documents, editingDocumentId, selectedId]);

  const updateSidebar = useMemo(
    () => (
      <DocumentsSidebar
        documents={documents}
        selectedId={selectedId}
        onSelect={setSelectedId}
        editingId={editingDocumentId}
        editingName={editingDocumentName}
        onEditingNameChange={setEditingDocumentName}
        onStartRename={startRename}
        onSaveRename={saveRename}
        onCancelRename={cancelRename}
        onDelete={deleteDocument}
      />
    ),
    [
      cancelRename,
      deleteDocument,
      documents,
      editingDocumentId,
      editingDocumentName,
      saveRename,
      selectedId,
      startRename,
    ],
  );

  useEffect(() => {
    setSidebarContent(updateSidebar);
  }, [setSidebarContent, updateSidebar]);

  useEffect(
    () => () => setSidebarContent(null),
    [setSidebarContent],
  );

  const importDocument = async (file: File) => {
    if (!/\.(md|markdown)$/i.test(file.name)) {
      setStatus('Выберите файл с расширением .md или .markdown.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      const document: DocumentationDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        markdown: await file.text(),
      };
      const updatedDocuments = [...documents, document];
      setDocuments(updatedDocuments);
      setSelectedId(document.id);
      setStatus('');
      try {
        saveDocumentationDocuments(updatedDocuments);
      } catch (error) {
        setStatus(
          error instanceof Error
            ? `Документ открыт, но не удалось сохранить его в браузере: ${error.message}`
            : 'Документ открыт, но не удалось сохранить его в браузере.',
        );
      }
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `Не удалось прочитать файл: ${error.message}`
          : 'Не удалось прочитать файл.',
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const updateMarkdown = (
    markdown: string,
    initialMarkdownNormalize: boolean,
  ) => {
    if (!selectedDocument || initialMarkdownNormalize) {
      return;
    }

    const updatedDocuments = documents.map((document) =>
      document.id === selectedDocument.id ? { ...document, markdown } : document,
    );
    setDocuments(updatedDocuments);
    try {
      saveDocumentationDocuments(updatedDocuments);
      setStatus('');
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `Изменения не сохранены в браузере: ${error.message}`
          : 'Изменения не сохранены в браузере.',
      );
    }
  };

  const scrollToHeading = (index: number) => {
    const headingElement = editorContainerRef.current?.querySelectorAll(
      'h1, h2, h3, h4, h5, h6',
    )[index];
    headingElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="section-page documentation-page">
      <input
        ref={fileInputRef}
        className="documentation-page__file-input"
        type="file"
        accept=".md,.markdown,text/markdown"
        aria-label="Выбрать файл Markdown"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) {
            void importDocument(file);
          }
        }}
      />
      <header className="page-header documentation-page__header">
        <div className="page-heading">
          <div className="page-icon">
            <BookOpenText size={19} />
          </div>
          <div>
            <h1>Импорт документации</h1>
            <p>Загружайте и редактируйте Markdown-документы.</p>
          </div>
        </div>
        <Button
          type="button"
          className="documentation-page__add-button"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus size={17} aria-hidden="true" />
          Добавить документ
        </Button>
      </header>

      {status && (
        <p className="documentation-page__status" role="status">{status}</p>
      )}

      {selectedDocument ? (
        <div className="documentation-page__body">
          <section className="documentation-editor" aria-label={`Редактор: ${selectedDocument.name}`}>
            <div className="documentation-editor__heading">
              <div>
                <span className="documentation-editor__eyebrow">Редактирование документа</span>
                <h2 title={selectedDocument.name}>{selectedDocument.name}</h2>
              </div>
              <Upload size={17} aria-hidden="true" />
            </div>
            <div ref={editorContainerRef} className="documentation-editor__canvas">
              <MDXEditor
                key={selectedDocument.id}
                className="documentation-editor__mdx dark"
                contentEditableClassName="documentation-editor__content"
                markdown={editorMarkdown}
                plugins={editorPlugins}
                placeholder="Начните писать Markdown-документ..."
                suppressHtmlProcessing
                onChange={updateMarkdown}
                onError={({ error }) => setStatus(`Не удалось разобрать Markdown: ${error}`)}
              />
            </div>
          </section>

          <aside className="documentation-outline" aria-label="Содержание документа">
            <div className="documentation-outline__heading">
              <BookOpenText size={16} aria-hidden="true" />
              <h2>Содержание</h2>
            </div>
            {headings.length > 0 ? (
              <HeadingTree
                headings={headings}
                documentId={selectedDocument.id}
                collapsedIndexes={collapsedHeadingIndexes[selectedDocument.id] ?? new Set()}
                onSelect={scrollToHeading}
                onToggle={toggleHeading}
              />
            ) : (
              <p className="documentation-outline__empty">
                Добавьте заголовки Markdown, чтобы создать содержание.
              </p>
            )}
          </aside>
        </div>
      ) : (
        <div className="documentation-page__empty">
          <div className="documentation-page__empty-icon">
            <BookOpenText size={23} />
          </div>
          <h2>Добавьте Markdown-документ</h2>
          <p>Выберите файл .md или .markdown, чтобы открыть его в редакторе и увидеть содержание.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus size={16} aria-hidden="true" />
            Выбрать файл
          </Button>
        </div>
      )}
    </div>
  );
}

export function DocumentationImporterRoutes() {
  return (
    <Routes>
      <Route index element={<DocumentationWorkspace />} />
      <Route path="*" element={<DocumentationWorkspace />} />
    </Routes>
  );
}
