import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import { Route, Routes } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import './OntologyBuilder.css';

const initialNodes: Node[] = [
  {
    id: 'documentation',
    position: { x: 80, y: 120 },
    data: { label: 'Документация' },
  },
  {
    id: 'ontology',
    position: { x: 380, y: 120 },
    data: { label: 'Онтология' },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'documentation-ontology',
    source: 'documentation',
    target: 'ontology',
    label: 'описывает',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#548064' },
  },
];

function OntologyWorkspace() {
  return (
    <div className="welcome-card">
      <div className="welcome-kicker">OntologyBuilder</div>
      <h2>Рабочая область онтологии</h2>
      <p>Здесь появятся инструменты для построения и редактирования онтологии.</p>
      <div className="ontology-flow" aria-label="Граф онтологии">
        <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
          <Background color="#dce4dc" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
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
