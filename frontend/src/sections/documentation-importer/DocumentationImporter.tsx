import { BookOpenText } from 'lucide-react';
import { Route, Routes } from 'react-router-dom';

function DocumentationWorkspace() {
  return (
      <div className="welcome-card">
        <div className="welcome-kicker">DocumentationImporter</div>
        <h2>Рабочая область импорта</h2>
        <p>Здесь появятся инструменты для загрузки и обработки документации.</p>
        <div className="placeholder-panel">
          <BookOpenText size={22} />
          <span>Структура раздела готова к наполнению</span>
        </div>
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
