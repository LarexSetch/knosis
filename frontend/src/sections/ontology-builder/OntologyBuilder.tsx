import { GitFork } from 'lucide-react';
import { Route, Routes } from 'react-router-dom';
import { SectionPage } from '../SectionPage';

function OntologyWorkspace() {
  return (
    <SectionPage
      eyebrow="Редактор онтологии"
      title="Редактор онтологии"
      description="Создавайте и поддерживайте структуру понятий и связей."
      icon={<GitFork size={20} />}
    >
      <div className="welcome-card">
        <div className="welcome-kicker">OntologyBuilder</div>
        <h2>Рабочая область онтологии</h2>
        <p>Здесь появятся инструменты для построения и редактирования онтологии.</p>
        <div className="placeholder-panel">
          <GitFork size={22} />
          <span>Структура раздела готова к наполнению</span>
        </div>
      </div>
    </SectionPage>
  );
}

export function OntologyBuilderRoutes() {
  return (
    <Routes>
      <Route index element={<OntologyWorkspace />} />
      <Route path="*" element={<OntologyWorkspace />} />
    </Routes>
  );
}
