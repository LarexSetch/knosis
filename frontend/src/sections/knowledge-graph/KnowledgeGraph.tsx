import { Network } from 'lucide-react';
import { Route, Routes } from 'react-router-dom';

function KnowledgeGraphWorkspace() {
  return (
      <div className="welcome-card">
        <div className="welcome-kicker">KnowledgeGraph</div>
        <h2>Рабочая область графа</h2>
        <p>Здесь появятся средства визуализации и исследования графа знаний.</p>
        <div className="placeholder-panel">
          <Network size={22} />
          <span>Структура раздела готова к наполнению</span>
        </div>
      </div>
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
