import { Network } from 'lucide-react';
import { Route, Routes } from 'react-router-dom';
import { SectionPage } from '../SectionPage';

function KnowledgeGraphWorkspace() {
  return (
    <SectionPage
      eyebrow="Граф знаний"
      title="Визуализация графа знаний"
      description="Исследуйте сущности и связи в базе знаний."
      icon={<Network size={20} />}
    >
      <div className="welcome-card">
        <div className="welcome-kicker">KnowledgeGraph</div>
        <h2>Рабочая область графа</h2>
        <p>Здесь появятся средства визуализации и исследования графа знаний.</p>
        <div className="placeholder-panel">
          <Network size={22} />
          <span>Структура раздела готова к наполнению</span>
        </div>
      </div>
    </SectionPage>
  );
}

export function KnowledgeGraphRoutes() {
  return (
    <Routes>
      <Route index element={<KnowledgeGraphWorkspace />} />
      <Route path="*" element={<KnowledgeGraphWorkspace />} />
    </Routes>
  );
}
