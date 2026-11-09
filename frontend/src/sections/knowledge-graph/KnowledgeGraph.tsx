import { Network } from 'lucide-react';
import { Route, Routes } from 'react-router-dom';

function KnowledgeGraphWorkspace() {
  return (
    <div className="section-page">
      <header className="page-header">
        <div className="page-heading">
          <div className="page-icon">
            <Network size={19} />
          </div>
          <div>
            <h1>Граф знаний</h1>
            <p>Исследуйте сущности и связи в базе знаний.</p>
          </div>
        </div>
      </header>
      <div className="page-body">
        <div className="welcome-card">
          <div className="welcome-kicker">Граф знаний</div>
          <h2>Рабочая область графа</h2>
          <p>Здесь появятся средства визуализации и исследования графа знаний.</p>
          <div className="placeholder-panel">
            <Network size={22} />
            <span>Структура раздела готова к наполнению</span>
          </div>
        </div>
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
