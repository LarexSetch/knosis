import { BookOpenText } from 'lucide-react';
import { Route, Routes } from 'react-router-dom';
import { SectionPage } from '../SectionPage';

function DocumentationWorkspace() {
  return (
    <SectionPage
      eyebrow="Импорт документации"
      title="Импортер документации"
      description="Подготовьте документы для извлечения знаний."
      icon={<BookOpenText size={20} />}
    >
      <div className="welcome-card">
        <div className="welcome-kicker">DocumentationImporter</div>
        <h2>Рабочая область импорта</h2>
        <p>Здесь появятся инструменты для загрузки и обработки документации.</p>
        <div className="placeholder-panel">
          <BookOpenText size={22} />
          <span>Структура раздела готова к наполнению</span>
        </div>
      </div>
    </SectionPage>
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
