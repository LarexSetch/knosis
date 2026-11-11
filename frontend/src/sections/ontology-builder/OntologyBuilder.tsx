import {
  addEdge,
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type NodeChange,
} from '@xyflow/react';
import { Download, FolderOpen, Plus, Save, Upload } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Route, Routes, useOutletContext } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import type { AppLayoutContext, SidebarAction } from '../../components/AppLayout';
import './OntologyBuilder.css';
import { OntologyNode } from './OntologyNode';
import { OntologyNodeEditor } from './OntologyNodeEditor';
import { OntologyRelationshipEditor } from './OntologyRelationshipEditor';
import {
  mapGraphToOntology,
  mapOntologyToGraph,
} from './ontology-mapper';
import { ontologyService } from './ontology-service';
import { exportOntology, importOntology } from './ontology-file-service';
import {
  OntologyNodeStatus,
  type OntologyMetadata,
  type OntologyNode as OntologyNodeModel,
  type OntologyRelationship,
} from '../../../../backend/src/ontology/ontology.types';
import type {
  OntologyNodeWrapper,
  OntologyRelationshipWrapper,
} from './ontology-flow.types';

const nodeTypes = { ontology: OntologyNode };

const initialNodes: OntologyNodeWrapper[] = [
  {
    id: 'documentation',
    type: 'ontology',
    draggable: true,
    deletable: false,
    position: { x: 80, y: 120 },
    data: {
      ontologyNode: {
        id: 'documentation',
        name: 'Документация',
        description: 'Документ, содержащий исходную информацию для построения онтологии.',
        status: OntologyNodeStatus.ASSOCIATED,
        properties: [
          { name: 'Название', type: 'string', description: 'Название документа.' },
          { name: 'Страниц', type: 'number', description: 'Количество страниц.' },
        ],
        associations: [
          {
            relation: 'DEFINES',
            description: 'Документация определяет структуру онтологии.',
            nodeIds: ['ontology'],
            nodesAll: false,
          },
        ],
        meta: {
          color: '#a1a1aa',
          position: { x: 80, y: 120 },
        },
      },
    },
  },
  {
    id: 'ontology',
    type: 'ontology',
    draggable: true,
    deletable: false,
    position: { x: 380, y: 120 },
    data: {
      ontologyNode: {
        id: 'ontology',
        name: 'Онтология',
        description: 'Формальная модель понятий предметной области и связей между ними.',
        status: OntologyNodeStatus.DETACHED,
        properties: [
          { name: 'Название', type: 'string', description: 'Название онтологии.' },
          { name: 'Синонимы', type: 'string', description: 'Альтернативные названия.' },
          { name: 'Активна', type: 'boolean', description: 'Признак активности.' },
        ],
        associations: [],
        meta: {
          color: '#789a83',
          position: { x: 380, y: 120 },
        },
      },
    },
  },
];

function createDefaultMetadata(): OntologyMetadata {
  return {
    name: 'Онтология',
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
  };
}

function createInitialWorkspaceState() {
  return {
    nodes: initialNodes,
    edges: [] as OntologyRelationshipWrapper[],
    metadata: createDefaultMetadata(),
    fileStatus: '',
  };
}

function OntologyWorkspace() {
  const { setSidebarActions } = useOutletContext<AppLayoutContext>();
  const [initialState] = useState(createInitialWorkspaceState);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialState.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<OntologyRelationshipWrapper>(
    initialState.edges,
  );
  const [metadata, setMetadata] = useState(initialState.metadata);
  const [fileStatus, setFileStatus] = useState(initialState.fileStatus);
  const importInputRef = useRef<HTMLInputElement>(null);
  const fileStatusTimeoutRef = useRef<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const nodesWithStatus = useMemo(() => {
    const associatedNodeIds = new Set<string>();
    for (const node of nodes) {
      for (const association of node.data.ontologyNode.associations) {
        const targetIds = association.nodesAll
          ? nodes.map((targetNode) => targetNode.id)
          : association.nodeIds;
        if (targetIds.length > 0) {
          associatedNodeIds.add(node.id);
          targetIds.forEach((targetId) => associatedNodeIds.add(targetId));
        }
      }
    }

    const relatedNodeIds = new Set(
      edges.flatMap((edge) => [edge.source, edge.target]),
    );
    return nodes.map((node) => ({
      ...node,
      data: {
        ontologyNode: {
          ...node.data.ontologyNode,
          status: associatedNodeIds.has(node.id)
            ? OntologyNodeStatus.ASSOCIATED
            : relatedNodeIds.has(node.id)
              ? OntologyNodeStatus.RELATED
              : OntologyNodeStatus.DETACHED,
        },
      },
    }));
  }, [edges, nodes]);
  const selectedNode = nodesWithStatus.find((node) => node.id === selectedNodeId);
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);

  const handleNodesChange = useCallback(
    (changes: NodeChange<OntologyNodeWrapper>[]) => {
      onNodesChange(changes);
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const { meta } = node.data.ontologyNode;
          if (
            meta.position.x === node.position.x &&
            meta.position.y === node.position.y
          ) {
            return node;
          }
          return {
            ...node,
            data: {
              ...node.data,
              ontologyNode: {
                ...node.data.ontologyNode,
                meta: { ...meta, position: { ...node.position } },
              },
            },
          };
        }),
      );
    },
    [onNodesChange, setNodes],
  );

  const showFileStatus = useCallback((status: string) => {
    if (fileStatusTimeoutRef.current !== null) {
      window.clearTimeout(fileStatusTimeoutRef.current);
    }
    setFileStatus(status);
    fileStatusTimeoutRef.current = window.setTimeout(() => {
      setFileStatus('');
      fileStatusTimeoutRef.current = null;
    }, 3000);
  }, []);

  useEffect(
    () => () => {
      if (fileStatusTimeoutRef.current !== null) {
        window.clearTimeout(fileStatusTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;
    void ontologyService.load()
      .then((ontology) => {
        if (!active || !ontology) {
          return;
        }
        const graph = mapOntologyToGraph(ontology);
        setNodes(graph.nodes);
        setEdges(graph.edges);
        setMetadata(ontology.metadata);
      })
      .catch((error: unknown) => {
        if (active) {
          showFileStatus(
            error instanceof Error
              ? `Не удалось загрузить сохранённую онтологию: ${error.message}`
              : 'Не удалось загрузить сохранённую онтологию.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, [setEdges, setNodes, showFileStatus]);

  const createOntologyDocument = () => {
    const updatedMetadata = {
      ...metadata,
      generatedAt: new Date().toISOString(),
    };
    const ontology = mapGraphToOntology(nodes, edges, updatedMetadata);
    setMetadata(updatedMetadata);
    return ontology;
  };

  const handleSave = async () => {
    try {
      await ontologyService.save(createOntologyDocument());
      showFileStatus('Онтология сохранена на сервере.');
    } catch (error) {
      showFileStatus(
        error instanceof Error ? error.message : 'Не удалось сохранить онтологию.',
      );
    }
  };

  const handleLoad = async () => {
    try {
      const ontology = await ontologyService.load();
      if (!ontology) {
        showFileStatus('Сохранённая онтология не найдена.');
        return;
      }
      const graph = mapOntologyToGraph(ontology);
      setNodes(graph.nodes);
      setEdges(graph.edges);
      setMetadata(ontology.metadata);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      showFileStatus('Онтология загружена.');
    } catch (error) {
      showFileStatus(
        error instanceof Error ? error.message : 'Не удалось загрузить онтологию.',
      );
    }
  };

  const handleExport = () => {
    try {
      exportOntology(createOntologyDocument());
      showFileStatus('Файл онтологии экспортирован.');
    } catch (error) {
      showFileStatus(
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
      showFileStatus('Онтология импортирована.');
    } catch (error) {
      showFileStatus(
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
      const id = crypto.randomUUID();
      const relationship: OntologyRelationship = {
        id,
        sourceNodeId: connection.source,
        targetNodeId: connection.target,
        relation: '',
        description: '',
        properties: [],
      };
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            id,
            label: '',
            data: { ontologyRelationship: relationship },
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
    const position = { x: 100 + nodes.length * 40, y: 240 + nodes.length * 40 };
    const ontologyNode: OntologyNodeModel = {
      id,
      name: '',
      description: '',
      status: OntologyNodeStatus.DETACHED,
      properties: [],
      associations: [],
      meta: {
        color: '#789a83',
        position,
      },
    };
    const newNode: OntologyNodeWrapper = {
      id,
      type: 'ontology',
      deletable: false,
      position,
      data: {
        ontologyNode,
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
            ontologyNode: {
              ...node.data.ontologyNode,
              associations: node.data.ontologyNode.associations.map((association) => ({
              ...association,
              nodeIds: association.nodeIds.filter((target) => target !== nodeId),
              })),
            },
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

  const sidebarHandlersRef = useRef({
    handleSave,
    handleLoad,
    handleExport,
    openImport: () => importInputRef.current?.click(),
    addNode,
  });
  sidebarHandlersRef.current = {
    handleSave,
    handleLoad,
    handleExport,
    openImport: () => importInputRef.current?.click(),
    addNode,
  };

  useEffect(() => {
    const actions: SidebarAction[] = [
      { label: 'Сохранить', icon: Save, onClick: () => sidebarHandlersRef.current.handleSave() },
      { label: 'Загрузить', icon: FolderOpen, onClick: () => sidebarHandlersRef.current.handleLoad() },
      { label: 'Экспорт', icon: Download, onClick: () => sidebarHandlersRef.current.handleExport() },
      { label: 'Импорт', icon: Upload, onClick: () => sidebarHandlersRef.current.openImport() },
      { label: 'Добавить ноду', icon: Plus, onClick: () => sidebarHandlersRef.current.addNode() },
    ];
    setSidebarActions(actions);
    return () => setSidebarActions([]);
  }, [setSidebarActions]);

  return (
      <div className="ontology-workspace-page">
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
        {fileStatus && (
          <p className="ontology-workspace__status" role="status">
            {fileStatus}
          </p>
        )}
        <div className="ontology-workspace">
          <div className="ontology-flow" aria-label="Граф онтологии">
            <ReactFlow
              nodes={nodesWithStatus}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={(instance) => void instance.fitView({ padding: 0.2 })}
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
              <Background color="#27272a" gap={20} />
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
                      ? {
                          ...edge,
                          data: { ontologyRelationship: data },
                          label: data.relation,
                        }
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
                          data: {
                            ontologyRelationship: {
                              ...edge.data.ontologyRelationship,
                              sourceNodeId: edge.target,
                              targetNodeId: edge.source,
                            },
                          },
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
              onChange={(ontologyNode) =>
                setNodes((currentNodes) =>
                  currentNodes.map((node) =>
                    node.id === selectedNode.id
                      ? { ...node, data: { ontologyNode } }
                      : node,
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
