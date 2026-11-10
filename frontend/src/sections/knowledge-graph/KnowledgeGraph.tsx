import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import {
  ArrowDownRight,
  FolderOpen,
  Network,
  Save,
  Upload,
  Workflow,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Route, Routes, useOutletContext } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import type { AppLayoutContext } from '../../components/AppLayout';
import { Button } from '../../components/ui/button';
import { OntologyNode } from '../ontology-builder/OntologyNode';
import { loadOntology } from '../ontology-builder/ontology-service';
import { mapOntologyToGraph } from '../ontology-builder/ontology-mapper';
import type {
  OntologyAssociation,
  OntologyDocument,
  OntologyNode as OntologySchemaNode,
  OntologyRelationship,
} from '../../../../backend/src/ontology/ontology.types';
import type {
  OntologyFlowNode,
  OntologyFlowRelationship,
} from '../ontology-builder/ontology-flow.types';
import { KnowledgeGraphDataNode } from './KnowledgeGraphDataNode';
import {
  loadKnowledgeGraph,
  parseKnowledgeGraph,
  saveKnowledgeGraph,
  type KnowledgeGraphDocument,
  type KnowledgeGraphRecord,
} from './knowledge-graph-service';
import type { KnowledgeGraphFlowNode } from './knowledge-graph-types';
import './KnowledgeGraph.css';

const nodeTypes: NodeTypes = {
  ontology: OntologyNode,
  knowledgeGraph: KnowledgeGraphDataNode,
};

type KnowledgeGraphFlowEdge = Edge<{ relationName: string }>;
type KnowledgeGraphFlowElement = OntologyFlowNode | KnowledgeGraphFlowNode;
type KnowledgeGraphFlowConnection =
  | OntologyFlowRelationship
  | KnowledgeGraphFlowEdge;

const IMPORT_INPUT_ID = 'knowledge-graph-import';

function mapDataToGraph(
  graph: KnowledgeGraphDocument,
  ontology: OntologyDocument,
): { nodes: KnowledgeGraphFlowNode[]; edges: KnowledgeGraphFlowEdge[] } {
  const ontologyNodes = new Map(
    ontology.nodes.map((node) => [node.name, node]),
  );
  const nodes = graph.nodes.map((record, index): KnowledgeGraphFlowNode => {
    const ontologyNode = ontologyNodes.get(record.ontologyNodeName);
    if (!ontologyNode) {
      throw new Error(
        `Нода онтологии "${record.ontologyNodeName}" не найдена.`,
      );
    }

    const propertyDefinitions = new Map(
      ontologyNode.properties.map((property) => [property.name, property]),
    );
    const propertyEntries = Object.entries(record).filter(
      ([name]) =>
        name !== 'nodeId' &&
        name !== 'ontologyNodeName' &&
        name !== 'positionX' &&
        name !== 'positionY',
    );
    propertyEntries.sort(([left], [right]) => {
      const leftIndex = ontologyNode.properties.findIndex(
        (property) => property.name === left,
      );
      const rightIndex = ontologyNode.properties.findIndex(
        (property) => property.name === right,
      );
      if (leftIndex === -1) return rightIndex === -1 ? 0 : 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });

    const title = typeof record.name === 'string' && record.name
      ? record.name
      : record.ontologyNodeName;

    return {
      id: record.nodeId,
      type: 'knowledgeGraph',
      position: {
        x: record.positionX ?? 80 + (index % 3) * 340,
        y: record.positionY ?? 80 + Math.floor(index / 3) * 250,
      },
      data: {
        ontologyNodeName: record.ontologyNodeName,
        title,
        color: ontologyNode.meta.color,
        properties: propertyEntries.map(([name, value]) => ({
          name,
          value,
          type: propertyDefinitions.get(name)?.type,
        })),
      },
    };
  });
  const nodeIds = new Set(graph.nodes.map((node) => node.nodeId));
  const edges = graph.relations.map((relation): KnowledgeGraphFlowEdge => {
    if (
      !nodeIds.has(relation.sourceNodeId) ||
      !nodeIds.has(relation.targetNodeId)
    ) {
      throw new Error(
        `Связь "${relation.relationId}" ссылается на отсутствующую ноду.`,
      );
    }
    return {
      id: relation.relationId,
      source: relation.sourceNodeId,
      target: relation.targetNodeId,
      label: relation.relationName,
      data: { relationName: relation.relationName },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#548064' },
    };
  });

  return { nodes, edges };
}

function formatRecordValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null) return 'null';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function pluralizeCount(count: number, one: string, few: string, many: string) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return one;
  }
  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (lastTwoDigits < 12 || lastTwoDigits > 14)
  ) {
    return few;
  }
  return many;
}

interface KnowledgeGraphState {
  ontology: OntologyDocument | null;
  graphData: KnowledgeGraphDocument | null;
  nodes: KnowledgeGraphFlowElement[];
  edges: KnowledgeGraphFlowConnection[];
  error: string;
}

function createAssociationEdges(
  ontology: OntologyDocument,
): OntologyFlowRelationship[] {
  return ontology.nodes.flatMap((node) =>
    node.associations.flatMap((association, associationIndex) => {
      const targetIds = association.nodesAll
        ? ontology.nodes.map((targetNode) => targetNode.id)
        : association.nodeIds;
      return targetIds.map((targetNodeId) => ({
        id: `${node.id}:association:${associationIndex}:${targetNodeId}`,
        source: node.id,
        target: targetNodeId,
        label: association.relation,
        data: {
          relation: association.relation,
          description: association.description,
          properties: [],
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#a78bfa' },
        style: { stroke: '#8b5cf6', strokeDasharray: '5 4' },
      }));
    }),
  );
}

function readKnowledgeGraph(): KnowledgeGraphState {
  try {
    const ontology = loadOntology();
    if (!ontology) {
      return {
        ontology: null,
        graphData: null,
        nodes: [],
        edges: [],
        error: '',
      };
    }

    const graphData = loadKnowledgeGraph(ontology);
    if (graphData) {
      const graph = mapDataToGraph(graphData, ontology);
      return {
        ontology,
        graphData,
        nodes: graph.nodes,
        edges: graph.edges,
        error: '',
      };
    }

    const graph = mapOntologyToGraph(ontology);
    return {
      ontology,
      graphData: null,
      nodes: graph.nodes,
      edges: [
        ...graph.edges,
        ...createAssociationEdges(ontology),
      ],
      error: '',
    };
  } catch (error) {
    return {
      ontology: null,
      graphData: null,
      nodes: [],
      edges: [],
      error: error instanceof Error
        ? error.message
        : 'Не удалось загрузить сохранённую онтологию.',
    };
  }
}

function KnowledgeGraphWorkspace() {
  const { setSidebarContent } = useOutletContext<AppLayoutContext>();
  const [initialState] = useState(readKnowledgeGraph);
  const [ontology, setOntology] = useState(initialState.ontology);
  const [nodes, setNodes, onNodesChange] = useNodesState<
    KnowledgeGraphFlowElement
  >(initialState.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<
    KnowledgeGraphFlowConnection
  >(
    initialState.edges,
  );
  const [error, setError] = useState(initialState.error);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<KnowledgeGraphDocument | null>(
    initialState.graphData,
  );
  const [actionStatus, setActionStatus] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refreshOntology = () => {
      const state = readKnowledgeGraph();
      setOntology(state.ontology);
      setGraphData(state.graphData);
      setNodes(state.nodes);
      setEdges(state.edges);
      setError(state.error);
      setSelectedNodeId(null);
    };

    window.addEventListener('storage', refreshOntology);
    return () => window.removeEventListener('storage', refreshOntology);
  }, [setEdges, setNodes]);

  const selectedRecord = graphData?.nodes.find(
    (node) => node.nodeId === selectedNodeId,
  );
  const selectedSchemaNode = ontology?.nodes.find(
    (node) =>
      node.id === selectedNodeId ||
      (selectedRecord && node.name === selectedRecord.ontologyNodeName),
  );
  const selectedRelationships = ontology?.relationships.filter(
    (relationship) =>
      relationship.sourceNodeId === selectedNodeId ||
      relationship.targetNodeId === selectedNodeId,
  ) ?? [];
  const selectedAssociations = ontology?.nodes.flatMap((sourceNode) =>
    sourceNode.associations.flatMap((association, associationIndex) => {
      const targetNodeIds = association.nodesAll
        ? ontology.nodes.map((node) => node.id)
        : association.nodeIds;
      return targetNodeIds.some((nodeId) => nodeId === selectedNodeId) ||
        sourceNode.id === selectedNodeId
        ? [{
            id: `${sourceNode.id}:association:${associationIndex}`,
            sourceNodeId: sourceNode.id,
            association,
            targetNodeIds,
          }]
        : [];
    }),
  ) ?? [];
  const nodeNames = new Map(ontology?.nodes.map((node) => [node.id, node.name]));
  const graphNodeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    graphData?.nodes.forEach((node) => {
      counts.set(
        node.ontologyNodeName,
        (counts.get(node.ontologyNodeName) ?? 0) + 1,
      );
    });
    return counts;
  }, [graphData]);

  const selectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        selected: graphData
          ? node.type === 'knowledgeGraph' &&
            node.data.ontologyNodeName ===
              ontology?.nodes.find((schemaNode) => schemaNode.id === nodeId)
                ?.name
          : node.id === nodeId,
      })),
    );
  }, [graphData, ontology, setNodes]);

  const handleImport = useCallback(async (file: File) => {
    try {
      if (!ontology) {
        throw new Error('Сначала создайте или загрузите онтологию.');
      }
      const importedGraph = parseKnowledgeGraph(await file.text(), ontology);
      const mappedGraph = mapDataToGraph(importedGraph, ontology);
      setGraphData(importedGraph);
      setNodes(mappedGraph.nodes);
      setEdges(mappedGraph.edges);
      setSelectedNodeId(null);
      setError('');
      setActionStatus(`Импортировано нод: ${importedGraph.nodes.length}.`);
    } catch (importError) {
      setActionStatus(
        importError instanceof Error
          ? importError.message
          : 'Не удалось импортировать граф.',
      );
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  }, [ontology]);

  const handleSave = useCallback(() => {
    if (!graphData) {
      setActionStatus('Сначала импортируйте данные графа.');
      return;
    }
    try {
      const positionsById = new Map(
        nodes
          .filter(
            (node): node is KnowledgeGraphFlowNode =>
              node.type === 'knowledgeGraph',
          )
          .map((node) => [node.id, node.position]),
      );
      const graphWithPositions: KnowledgeGraphDocument = {
        ...graphData,
        nodes: graphData.nodes.map((node) => {
          const position = positionsById.get(node.nodeId);
          return position
            ? {
                ...node,
                positionX: position.x,
                positionY: position.y,
              }
            : node;
        }),
      };
      saveKnowledgeGraph(graphWithPositions);
      setGraphData(graphWithPositions);
      setActionStatus('Граф сохранён в браузере.');
    } catch (saveError) {
      setActionStatus(
        saveError instanceof Error
          ? saveError.message
          : 'Не удалось сохранить граф.',
      );
    }
  }, [graphData, nodes]);

  const handleLoad = useCallback(() => {
    if (!ontology) {
      setActionStatus('Сначала создайте или загрузите онтологию.');
      return;
    }
    try {
      const savedGraph = loadKnowledgeGraph(ontology);
      if (!savedGraph) {
        setActionStatus('Сохранённые данные графа не найдены.');
        return;
      }
      const mappedGraph = mapDataToGraph(savedGraph, ontology);
      setGraphData(savedGraph);
      setNodes(mappedGraph.nodes);
      setEdges(mappedGraph.edges);
      setSelectedNodeId(null);
      setActionStatus(`Загружено нод: ${savedGraph.nodes.length}.`);
    } catch (loadError) {
      setActionStatus(
        loadError instanceof Error
          ? loadError.message
          : 'Не удалось загрузить граф.',
      );
    }
  }, [ontology, setEdges, setNodes]);

  const sidebarContent = useMemo(
    () => (
      <KnowledgeGraphSidebar
        ontology={ontology}
        error={error}
        selectedNodeId={selectedNodeId}
        graphNodeCount={graphData?.nodes.length ?? 0}
        graphNodeCounts={graphNodeCounts}
        onSelectNode={selectNode}
        onImport={() => importInputRef.current?.click()}
        onSave={handleSave}
        onLoad={handleLoad}
        actionStatus={actionStatus}
      />
    ),
    [
      actionStatus,
      error,
      handleLoad,
      handleSave,
      ontology,
      selectNode,
      selectedNodeId,
    ],
  );

  useEffect(() => {
    setSidebarContent(sidebarContent);
  }, [setSidebarContent, sidebarContent]);

  useEffect(
    () => () => setSidebarContent(null),
    [setSidebarContent],
  );

  return (
    <div className="knowledge-graph-page">
      <input
        ref={importInputRef}
        className="knowledge-graph-import-input"
        id={IMPORT_INPUT_ID}
        type="file"
        accept="application/json,.json"
        aria-label="Импортировать данные графа"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImport(file);
        }}
      />
      <div className="knowledge-graph-workspace">
        <main className="knowledge-graph-canvas" aria-label="Визуализация графа знаний">
          {ontology && nodes.length > 0 ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(_, node) => {
                setSelectedNodeId(node.id);
                setNodes((currentNodes) =>
                  currentNodes.map((currentNode) => ({
                    ...currentNode,
                    selected: currentNode.id === node.id,
                  })),
                );
              }}
              onPaneClick={() => {
                setSelectedNodeId(null);
                setNodes((currentNodes) =>
                  currentNodes.map((node) => ({ ...node, selected: false })),
                );
              }}
              nodeTypes={nodeTypes}
              nodesDraggable
              nodesConnectable={false}
              elementsSelectable
              minZoom={0.05}
              deleteKeyCode={null}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <Background color="#27272a" gap={22} />
              <Controls />
            </ReactFlow>
          ) : (
            <div className="knowledge-graph-canvas__empty">
              <Network size={26} />
              <span>Импортируйте данные, чтобы отобразить граф</span>
            </div>
          )}
        </main>

          {selectedRecord && selectedSchemaNode ? (
            <DataNodeDetails
              node={selectedRecord}
              schemaNode={selectedSchemaNode}
              relations={graphData?.relations ?? []}
              nodes={graphData?.nodes ?? []}
            />
          ) : selectedSchemaNode ? (
            <NodeDetails
              node={selectedSchemaNode}
              relationships={selectedRelationships}
              associations={selectedAssociations}
              nodeNames={nodeNames}
            />
          ) : null}
      </div>
    </div>
  );
}

function KnowledgeGraphSidebar({
  ontology,
  error,
  selectedNodeId,
  graphNodeCount,
  graphNodeCounts,
  onSelectNode,
  onImport,
  onSave,
  onLoad,
  actionStatus,
}: {
  ontology: OntologyDocument | null;
  error: string;
  selectedNodeId: string | null;
  graphNodeCount: number;
  graphNodeCounts: Map<string, number>;
  onSelectNode: (nodeId: string) => void;
  onImport: () => void;
  onSave: () => void;
  onLoad: () => void;
  actionStatus: string;
}) {
  return (
    <section className="knowledge-graph-sidebar" aria-label="Ноды онтологии">
      <div className="knowledge-graph-sidebar__actions">
        <Button
          variant="ghost"
          className="app-sidebar__action"
          type="button"
          onClick={onImport}
        >
          <Upload size={17} aria-hidden="true" />
          <span>Импортировать</span>
        </Button>
        <Button
          variant="ghost"
          className="app-sidebar__action"
          type="button"
          onClick={onSave}
        >
          <Save size={17} aria-hidden="true" />
          <span>Сохранить</span>
        </Button>
        <Button
          variant="ghost"
          className="app-sidebar__action"
          type="button"
          onClick={onLoad}
        >
          <FolderOpen size={17} aria-hidden="true" />
          <span>Загрузить</span>
        </Button>
      </div>
      {actionStatus && (
        <p className="knowledge-graph-sidebar__status" role="status">
          {actionStatus}
        </p>
      )}
      <div className="knowledge-graph-sidebar__heading">
        <span>Ноды</span>
        <span className="knowledge-graph-sidebar__count">{graphNodeCount}</span>
      </div>
      {error ? (
        <p className="knowledge-graph-sidebar__message knowledge-graph-sidebar__message--error" role="alert">
          Не удалось прочитать онтологию: {error}
        </p>
      ) : !ontology || ontology.nodes.length === 0 ? (
        <div className="knowledge-graph-sidebar__message">
          <Workflow size={19} />
          <p>Сохранённая онтология пока не содержит нод.</p>
          <Link to="/ontology-builder">Открыть редактор онтологии</Link>
        </div>
      ) : (
        <ul className="knowledge-graph-node-list">
          {ontology.nodes.map((node) => (
            <li key={node.id}>
              <button
                className={`knowledge-graph-node-list__item${node.id === selectedNodeId ? ' is-selected' : ''}`}
                type="button"
                aria-pressed={node.id === selectedNodeId}
                onClick={() => onSelectNode(node.id)}
              >
                <span
                  className="knowledge-graph-node-list__color"
                  style={{ backgroundColor: node.meta.color }}
                />
                <span className="knowledge-graph-node-list__copy">
                  <span className="knowledge-graph-node-list__name">
                    {node.name || 'Без названия'}
                  </span>
                  <span className="knowledge-graph-node-list__meta">
                    {graphNodeCounts.get(node.name) ?? 0}{' '}
                    {pluralizeCount(
                      graphNodeCounts.get(node.name) ?? 0,
                      'нода',
                      'ноды',
                      'нод',
                    )}
                  </span>
                </span>
                <ArrowDownRight size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DataNodeDetails({
  node,
  schemaNode,
  relations,
  nodes,
}: {
  node: KnowledgeGraphRecord;
  schemaNode: OntologySchemaNode;
  relations: KnowledgeGraphDocument['relations'];
  nodes: KnowledgeGraphRecord[];
}) {
  const nodeNames = new Map(
    nodes.map((graphNode) => [
      graphNode.nodeId,
      typeof graphNode.name === 'string' && graphNode.name
        ? graphNode.name
        : graphNode.ontologyNodeName,
    ]),
  );
  const nodeProperties = Object.entries(node).filter(
    ([name]) =>
      name !== 'nodeId' &&
      name !== 'ontologyNodeName' &&
      name !== 'positionX' &&
      name !== 'positionY',
  );
  const propertyDescriptions = new Map(
    schemaNode.properties.map((property) => [property.name, property]),
  );
  const nodeRelations = relations.filter(
    (relation) =>
      relation.sourceNodeId === node.nodeId ||
      relation.targetNodeId === node.nodeId,
  );

  return (
    <aside
      className="knowledge-graph-details"
      aria-label={`Данные ноды ${String(node.name ?? schemaNode.name)}`}
    >
      <div className="knowledge-graph-details__title">
        <span
          className="knowledge-graph-node-list__color"
          style={{ backgroundColor: schemaNode.meta.color }}
        />
        <h2>
          {typeof node.name === 'string' && node.name
            ? node.name
            : schemaNode.name}
        </h2>
      </div>
      <p className="knowledge-graph-details__description">
        {schemaNode.name} · ID: {node.nodeId}
      </p>

      <section className="knowledge-graph-details__section">
        <h3>Свойства <span>{nodeProperties.length}</span></h3>
        {nodeProperties.length ? (
          <ul className="knowledge-graph-details__properties">
            {nodeProperties.map(([name, value]) => {
              const definition = propertyDescriptions.get(name);
              return (
                <li key={name}>
                  <div className="knowledge-graph-details__property-heading">
                    <span>{name}</span>
                    {definition && <code>{definition.type}</code>}
                  </div>
                  {definition?.required && (
                    <span className="knowledge-graph-details__required">
                      Обязательное
                    </span>
                  )}
                  {definition?.description && <p>{definition.description}</p>}
                  <p>{formatRecordValue(value)}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="knowledge-graph-details__empty">Свойств нет.</p>
        )}
      </section>

      <section className="knowledge-graph-details__section">
        <h3>Связи <span>{nodeRelations.length}</span></h3>
        {nodeRelations.length ? (
          <ul className="knowledge-graph-details__relationships">
            {nodeRelations.map((relation) => {
              const isOutgoing = relation.sourceNodeId === node.nodeId;
              const otherNodeId = isOutgoing
                ? relation.targetNodeId
                : relation.sourceNodeId;
              return (
                <li key={relation.relationId}>
                  <div className="knowledge-graph-details__relationship-heading">
                    <span>{isOutgoing ? 'Отправляет' : 'Получает'}</span>
                    <strong>{relation.relationName}</strong>
                  </div>
                  <p>{nodeNames.get(otherNodeId) ?? otherNodeId}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="knowledge-graph-details__empty">Связей нет.</p>
        )}
      </section>
    </aside>
  );
}

function NodeDetails({
  node,
  relationships,
  associations,
  nodeNames,
}: {
  node: OntologySchemaNode;
  relationships: OntologyRelationship[];
  associations: {
    id: string;
    sourceNodeId: string;
    association: OntologyAssociation;
    targetNodeIds: string[];
  }[];
  nodeNames: Map<string, string>;
}) {
  return (
    <aside className="knowledge-graph-details" aria-label={`Данные ноды ${node.name}`}>
      <div className="knowledge-graph-details__title">
        <span
          className="knowledge-graph-node-list__color"
          style={{ backgroundColor: node.meta.color }}
        />
        <h2>{node.name || 'Без названия'}</h2>
      </div>
      {node.description && (
        <p className="knowledge-graph-details__description">{node.description}</p>
      )}

      <section className="knowledge-graph-details__section">
        <h3>Свойства <span>{node.properties.length}</span></h3>
        {node.properties.length ? (
          <ul className="knowledge-graph-details__properties">
            {node.properties.map((property, index) => (
              <li key={`${property.name}-${index}`}>
                <div className="knowledge-graph-details__property-heading">
                  <span>{property.name}</span>
                  <code>{property.type}</code>
                </div>
                {property.required && (
                  <span className="knowledge-graph-details__required">Обязательное</span>
                )}
                {property.description && <p>{property.description}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="knowledge-graph-details__empty">Свойств нет.</p>
        )}
      </section>

      <section className="knowledge-graph-details__section">
        <h3>Связи <span>{relationships.length + associations.length}</span></h3>
        {relationships.length || associations.length ? (
          <ul className="knowledge-graph-details__relationships">
            {associations.map(({ id, sourceNodeId, association, targetNodeIds }) => {
              const isOutgoing = sourceNodeId === node.id;
              const otherNodeIds = targetNodeIds.filter((targetNodeId) =>
                isOutgoing ? true : targetNodeId === node.id,
              );
              return (
                <li key={id}>
                  <div className="knowledge-graph-details__relationship-heading">
                    <span>{isOutgoing ? 'Ассоциирует' : 'Ассоциирован с'}</span>
                    <strong>{association.relation || 'Без названия'}</strong>
                  </div>
                  <p>
                    {otherNodeIds
                      .map((nodeId) => nodeNames.get(nodeId) || 'Без названия')
                      .join(', ')}
                  </p>
                  {association.description && <p>{association.description}</p>}
                </li>
              );
            })}
            {relationships.map((relationship) => {
              const isOutgoing = relationship.sourceNodeId === node.id;
              const otherNodeId = isOutgoing
                ? relationship.targetNodeId
                : relationship.sourceNodeId;
              return (
                <li key={relationship.id}>
                  <div className="knowledge-graph-details__relationship-heading">
                    <span>{isOutgoing ? 'Отправляет' : 'Получает'}</span>
                    <strong>{relationship.relation || 'Без названия'}</strong>
                  </div>
                  <p>{nodeNames.get(otherNodeId) || 'Без названия'}</p>
                  {relationship.description && <p>{relationship.description}</p>}
                  {relationship.properties.length > 0 && (
                    <div className="knowledge-graph-details__relationship-properties">
                      {relationship.properties.map((property, index) => (
                        <div key={`${property.name}-${index}`}>
                          <span>{property.name}</span>
                          <code>{property.type}</code>
                          {property.required && <small>Обязательное</small>}
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="knowledge-graph-details__empty">Связей нет.</p>
        )}
      </section>
    </aside>
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
