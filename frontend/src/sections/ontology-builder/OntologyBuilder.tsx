import {
  Background,
  Controls,
  ReactFlow,
  useNodesState,
} from '@xyflow/react';
import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import './OntologyBuilder.css';
import { OntologyNode } from './OntologyNode';
import { OntologyNodeEditor } from './OntologyNodeEditor';
import {
  OntologyNodeIcon,
  type OntologyFlowNode,
} from './ontology-types';

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
      associations: [
        {
          relation: 'DEFINES',
          description: 'Документация определяет структуру онтологии.',
          targets: ['ontology'],
          targetsAll: false,
        },
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
      associations: [],
    },
  },
];

function OntologyWorkspace() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  return (
    <div className="welcome-card">
      <div className="welcome-kicker">OntologyBuilder</div>
      <h2>Рабочая область онтологии</h2>
      <p>Здесь появятся инструменты для построения и редактирования онтологии.</p>
      <div className="ontology-workspace">
        <div className="ontology-flow" aria-label="Граф онтологии">
          <ReactFlow
            nodes={nodes}
            onNodesChange={onNodesChange}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            nodeTypes={nodeTypes}
            nodesDraggable
            fitView
          >
            <Background color="#dce4dc" gap={20} />
            <Controls />
          </ReactFlow>
        </div>
        {selectedNode && (
          <OntologyNodeEditor
            node={selectedNode}
            availableNodes={nodes}
            onChange={(data) =>
              setNodes((currentNodes) =>
                currentNodes.map((node) =>
                  node.id === selectedNode.id ? { ...node, data } : node,
                ),
              )
            }
          />
        )}
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
