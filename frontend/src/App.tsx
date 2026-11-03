import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { DocumentationImporterRoutes } from './sections/documentation-importer/DocumentationImporter';
import { KnowledgeGraphRoutes } from './sections/knowledge-graph/KnowledgeGraph';
import { OntologyBuilderRoutes } from './sections/ontology-builder/OntologyBuilder';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/ontology-builder" replace />} />
          <Route path="ontology-builder/*" element={<OntologyBuilderRoutes />} />
          <Route path="documentation-importer/*" element={<DocumentationImporterRoutes />} />
          <Route path="knowledge-graph/*" element={<KnowledgeGraphRoutes />} />
          <Route path="*" element={<Navigate to="/ontology-builder" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
