import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { KnowledgeGraphRoutes } from './sections/knowledge-graph/KnowledgeGraph';
import { OntologyBuilderRoutes } from './sections/ontology-builder/OntologyBuilder';

const DocumentationImporterRoutes = lazy(() =>
  import('./sections/documentation-importer/DocumentationImporter').then(
    ({ DocumentationImporterRoutes: routes }) => ({ default: routes }),
  ),
);

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/ontology-builder" replace />} />
          <Route path="ontology-builder/*" element={<OntologyBuilderRoutes />} />
          <Route
            path="documentation-importer/*"
            element={(
              <Suspense fallback={<div className="section-page">Загрузка редактора документации...</div>}>
                <DocumentationImporterRoutes />
              </Suspense>
            )}
          />
          <Route path="knowledge-graph/*" element={<KnowledgeGraphRoutes />} />
          <Route path="*" element={<Navigate to="/ontology-builder" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
