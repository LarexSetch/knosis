import { BookOpenText } from 'lucide-react';
import { Route, Routes } from 'react-router-dom';

function DocumentationWorkspace() {
  return (
    <div className="section-page">
      <header className="page-header">
        <div className="page-heading">
          <div className="page-icon">
            <BookOpenText size={19} />
          </div>
          <div>
            <h1>Импорт документации</h1>
            <p>Загружайте материалы для дальнейшей обработки.</p>
          </div>
        </div>
      </header>
      <div className="page-body">
        <div className="welcome-card">
          <div className="welcome-kicker">Документация</div>
          <h2>Рабочая область импорта</h2>
          <p>Здесь появятся инструменты для загрузки и обработки документации.</p>
          <div className="placeholder-panel">
            <BookOpenText size={22} />
            <span>Структура раздела готова к наполнению</span>
          </div>
        </div>
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
