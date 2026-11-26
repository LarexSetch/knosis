import { useEffect, useMemo } from 'react';
import {
  Background,
  ConnectionMode,
  Controls,
  Handle,
  MarkerType,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { Plus } from 'lucide-react';
import type { GraphSelection, OntologyDocument } from '../types';
import '@xyflow/react/dist/style.css';

type OntologyNodeData = {
  label: string;
  color: string;
};

type OntologyFlowNode = Node<OntologyNodeData, 'ontology'>;

type HandleSide = 'top' | 'right' | 'bottom' | 'left';

const DEFAULT_NODE_WIDTH = 120;
const DEFAULT_NODE_HEIGHT = 36;

function OntologyNode({ data, selected }: NodeProps<OntologyFlowNode>) {
  return (
    <div
      className="relative rounded px-3 py-2 text-xs text-neutral-100"
      style={{
        background: data.color,
        border: selected ? '1px solid #d4d4d4' : '1px solid #737373',
      }}
    >
      <Handle id="top" position={Position.Top} type="source" />
      <Handle id="right" position={Position.Right} type="source" />
      <Handle id="bottom" position={Position.Bottom} type="source" />
      <Handle id="left" position={Position.Left} type="source" />
      <span>{data.label}</span>
    </div>
  );
}

const nodeTypes = {
  ontology: OntologyNode,
};

function getNodeCenter(node: OntologyFlowNode): { x: number; y: number } {
  const width = node.measured?.width ?? DEFAULT_NODE_WIDTH;
  const height = node.measured?.height ?? DEFAULT_NODE_HEIGHT;
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  };
}

function getAdaptiveHandles(
  sourceNode: OntologyFlowNode | undefined,
  targetNode: OntologyFlowNode | undefined,
): { sourceHandle: HandleSide; targetHandle: HandleSide } {
  if (!sourceNode || !targetNode) {
    return { sourceHandle: 'bottom', targetHandle: 'top' };
  }

  const sourceCenter = getNodeCenter(sourceNode);
  const targetCenter = getNodeCenter(targetNode);
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceHandle: 'right', targetHandle: 'left' }
      : { sourceHandle: 'left', targetHandle: 'right' };
  }

  return dy >= 0
    ? { sourceHandle: 'bottom', targetHandle: 'top' }
    : { sourceHandle: 'top', targetHandle: 'bottom' };
}

type GraphEditorProps = {
  document: OntologyDocument;
  onSelect: (selection: GraphSelection) => void;
  onMoveVertex: (id: string, position: { x: number; y: number }) => void;
  onAddVertex: () => void;
  onConnect: (sourceElementId: string, targetElementId: string) => void;
  onReconnect: (relationId: string, sourceElementId: string, targetElementId: string) => void;
};

export default function GraphEditor({
  document,
  onSelect,
  onMoveVertex,
  onAddVertex,
  onConnect,
  onReconnect,
}: GraphEditorProps) {
  const initialNodes = useMemo<OntologyFlowNode[]>(
    () => document.elements.map((element) => ({
      id: element.id,
      type: 'ontology',
      position: element.meta.position,
      data: { label: element.name, color: element.meta.color },
    })),
    [document.elements],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<OntologyFlowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => setNodes(initialNodes), [initialNodes, setNodes]);

  useEffect(() => {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));

    setEdges((currentEdges) => {
      const selectedById = new Map(currentEdges.map((edge) => [edge.id, edge.selected]));

      return document.relations.map((relation) => {
        const { sourceHandle, targetHandle } = getAdaptiveHandles(
          nodeMap.get(relation.sourceElementId),
          nodeMap.get(relation.targetElementId),
        );

        return {
          id: relation.id,
          source: relation.sourceElementId,
          target: relation.targetElementId,
          sourceHandle,
          targetHandle,
          label: relation.name,
          selected: selectedById.get(relation.id) ?? false,
          interactionWidth: 28,
          labelStyle: { fill: '#a3a3a3', fontSize: 11 },
          labelBgStyle: { fill: '#111111' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#737373' },
          style: { stroke: '#737373' },
        };
      });
    });
  }, [nodes, document.relations, setEdges]);

  function handleConnect(connection: Connection) {
    if (!connection.source || !connection.target || connection.source === connection.target) {
      return;
    }

    onConnect(connection.source, connection.target);
  }

  function handleReconnect(oldEdge: Edge, newConnection: Connection) {
    if (
      !newConnection.source
      || !newConnection.target
      || newConnection.source === newConnection.target
    ) {
      return;
    }

    onReconnect(oldEdge.id, newConnection.source, newConnection.target);
  }

  return (
    <div className="h-full min-h-0 min-w-0 flex-1">
      <ReactFlow
        colorMode="dark"
        connectionMode={ConnectionMode.Loose}
        connectionRadius={44}
        reconnectRadius={24}
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onReconnect={handleReconnect}
        onNodeClick={(_, node) => onSelect({ kind: 'vertex', id: node.id })}
        onEdgeClick={(_, edge) => onSelect({ kind: 'edge', id: edge.id })}
        onPaneClick={() => onSelect(null)}
        onNodeDragStop={(_, node) => onMoveVertex(node.id, node.position)}
        minZoom={0.1}
        maxZoom={2}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable
        nodesConnectable
        edgesReconnectable
        elementsSelectable
      >
        <Background color="#404040" gap={24} size={1} />
        <Panel position="top-left">
          <button
            className="flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-100 shadow hover:bg-neutral-800"
            onClick={onAddVertex}
            type="button"
          >
            <Plus aria-hidden="true" size={14} />
            Добавить элемент
          </button>
        </Panel>
        <Controls position="top-right" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
