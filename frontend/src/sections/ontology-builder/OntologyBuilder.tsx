import {
  addEdge,
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
} from '@xyflow/react';
import { Download, FolderOpen, Plus, Save, Upload } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import './OntologyBuilder.css';
import { OntologyNode } from './OntologyNode';
import { OntologyNodeEditor } from './OntologyNodeEditor';
import { OntologyRelationshipEditor } from './OntologyRelationshipEditor';
import {
  mapGraphToOntology,
  mapOntologyToGraph,
} from './ontology-mapper';
import {
  exportOntology,
  importOntology,
  loadOntology,
  saveOntology,
} from './ontology-service';
import type { OntologyMetadata } from './ontology-document.types';
import {
  OntologyNodeIcon,
  type OntologyFlowNode,
  type OntologyRelationship,
} from './ontology-types';

const nodeTypes = { ontology: OntologyNode };

const initialNodes: OntologyFlowNode[] = [
  {
    id: 'documentation',
    type: 'ontology',
    draggable: true,
    deletable: false,
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
    deletable: false,
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
  const [edges, setEdges, onEdgesChange] = useEdgesState<OntologyRelationship>([]);
  const [metadata, setMetadata] = useState<OntologyMetadata>(() => ({
    name: 'Онтология',
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
  }));
  const [fileStatus, setFileStatus] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);

  const createOntologyDocument = () => {
    const updatedMetadata = {
      ...metadata,
      generatedAt: new Date().toISOString(),
    };
    const ontology = mapGraphToOntology(nodes, edges, updatedMetadata);
    setMetadata(updatedMetadata);
    return ontology;
  };

  const handleSave = () => {
    try {
      saveOntology(createOntologyDocument());
      setFileStatus('Онтология сохранена в браузере.');
    } catch (error) {
      setFileStatus(
        error instanceof Error ? error.message : 'Не удалось сохранить онтологию.',
      );
    }
  };

  const handleLoad = () => {
    try {
      const ontology = loadOntology();
      if (!ontology) {
        setFileStatus('Сохранённая онтология не найдена.');
        return;
      }
      const graph = mapOntologyToGraph(ontology);
      setNodes(graph.nodes);
      setEdges(graph.edges);
      setMetadata(ontology.metadata);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setFileStatus('Онтология загружена.');
    } catch (error) {
      setFileStatus(
        error instanceof Error ? error.message : 'Не удалось загрузить онтологию.',
      );
    }
  };

  const handleExport = () => {
    try {
      exportOntology(createOntologyDocument());
      setFileStatus('Файл онтологии экспортирован.');
    } catch (error) {
      setFileStatus(
        error instanceof Error ? error.message : 'Не удалось экспортировать онтологию.',
      );
    }
  };

  const handleImport = async (file: File) => {
    try {
      const ontology = await importOntology(file);
      const graph = mapOntologyToGraph(ontology);
      setNodes(graph.nodes);
      setEdges(graph.edges);
      setMetadata(ontology.metadata);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setFileStatus('Онтология импортирована.');
    } catch (error) {
      setFileStatus(
        error instanceof Error ? error.message : 'Не удалось импортировать онтологию.',
      );
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            id: crypto.randomUUID(),
            label: '',
            data: { relation: '', description: '', properties: [] },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#548064',
            },
          },
          currentEdges,
        ),
      );
    },
    [setEdges],
  );

  const addNode = () => {
    const id = crypto.randomUUID();
    const newNode: OntologyFlowNode = {
      id,
      type: 'ontology',
      deletable: false,
      position: { x: 100 + nodes.length * 40, y: 240 + nodes.length * 40 },
      data: {
        color: '#789a83',
        name: '',
        description: '',
        icons: [OntologyNodeIcon.DETACHED],
        properties: [],
        associations: [],
      },
    };
    setNodes((currentNodes) => [...currentNodes, newNode]);
    setSelectedNodeId(id);
  };

  const deleteNode = (nodeId: string) => {
    setNodes((currentNodes) =>
      currentNodes
        .filter((node) => node.id !== nodeId)
        .map((node) => ({
          ...node,
          data: {
            ...node.data,
            associations: node.data.associations.map((association) => ({
              ...association,
              targets: association.targets.filter((target) => target !== nodeId),
            })),
          },
        })),
    );
    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
    );
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  return (
    <div className="welcome-card">
      <div className="ontology-workspace__heading">
        <div className="ontology-workspace__file-actions">
          <button className="ontology-editor__add" type="button" onClick={handleSave}>
            <Save size={14} />
            Сохранить
          </button>
          <button className="ontology-editor__add" type="button" onClick={handleLoad}>
            <FolderOpen size={14} />
            Загрузить
          </button>
          <button className="ontology-editor__add" type="button" onClick={handleExport}>
            <Download size={14} />
            Экспорт
          </button>
          <button
            className="ontology-editor__add"
            type="button"
            onClick={() => importInputRef.current?.click()}
          >
            <Upload size={14} />
            Импорт
          </button>
          <input
            ref={importInputRef}
            className="ontology-workspace__file-input"
            type="file"
            accept="application/json,.json"
            aria-label="Импортировать файл онтологии"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleImport(file);
              }
            }}
          />
        </div>
        <button
          className="ontology-editor__add ontology-workspace__add"
          type="button"
          onClick={addNode}
        >
          <Plus size={15} />
          Добавить ноду
        </button>
      </div>
      {fileStatus && (
        <p className="ontology-workspace__status" role="status">
          {fileStatus}
        </p>
      )}
      <div className="ontology-workspace">
        <div className="ontology-flow" aria-label="Граф онтологии">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id);
              setSelectedEdgeId(null);
            }}
            onEdgeClick={(_, edge) => {
              setSelectedEdgeId(edge.id);
              setSelectedNodeId(null);
            }}
            onPaneClick={() => {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }}
            nodeTypes={nodeTypes}
            nodesDraggable
            nodesConnectable
            deleteKeyCode={null}
            fitView
          >
            <Background color="#dce4dc" gap={20} />
            <Controls />
          </ReactFlow>
        </div>
        {selectedEdge ? (
          <OntologyRelationshipEditor
            edge={selectedEdge}
            nodes={nodes}
            onChange={(data) =>
              setEdges((currentEdges) =>
                currentEdges.map((edge) =>
                  edge.id === selectedEdge.id
                    ? { ...edge, data, label: data.relation }
                    : edge,
                ),
              )
            }
            onSwap={() =>
              setEdges((currentEdges) =>
                currentEdges.map((edge) =>
                  edge.id === selectedEdge.id
                    ? {
                        ...edge,
                        source: edge.target,
                        target: edge.source,
                        sourceHandle: edge.targetHandle,
                        targetHandle: edge.sourceHandle,
                      }
                    : edge,
                ),
              )
            }
          />
        ) : selectedNode ? (
          <OntologyNodeEditor
            node={selectedNode}
            availableNodes={nodes}
            onDelete={() => deleteNode(selectedNode.id)}
            onChange={(data) =>
              setNodes((currentNodes) =>
                currentNodes.map((node) =>
                  node.id === selectedNode.id ? { ...node, data } : node,
                ),
              )
            }
          />
        ) : null}
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
