import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
} from '@xyflow/react';
import { Route, Routes } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import './OntologyBuilder.css';
import {
  OntologyNode,
  type OntologyFlowNode,
  OntologyNodeIcon,
} from './OntologyNode';

const nodeTypes = { ontology: OntologyNode };

const initialNodes: OntologyFlowNode[] = [
  {
    id: 'documentation',
    type: 'ontology',
    draggable: true,
    position: { x: 80, y: 120 },
    data: {
      color: '#548064',
      name: 'Документация',
      description: 'Документ, содержащий исходную информацию для построения онтологии.',
      icons: [OntologyNodeIcon.ASSOCIATIONS],
      properties: [
        { name: 'Название', type: 'string', description: 'Название документа.' },
        { name: 'Страниц', type: 'number', description: 'Количество страниц.' },
      ],
    },
  },
  {
    id: 'ontology',
    type: 'ontology',
    draggable: true,
    position: { x: 380, y: 120 },
    data: {
      color: '#789a83',
      name: 'Онтология',
      description: 'Формальная модель понятий предметной области и связей между ними.',
      icons: [OntologyNodeIcon.DETACHED],
      properties: [
        { name: 'Название', type: 'string', description: 'Название онтологии.' },
        { name: 'Синонимы', type: 'string', description: 'Альтернативные названия.' },
        { name: 'Активна', type: 'boolean', description: 'Признак активности.' },
      ],
    },
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
        <ReactFlow
          defaultNodes={initialNodes}
          defaultEdges={initialEdges}
          nodeTypes={nodeTypes}
          nodesDraggable
          fitView
        >
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
