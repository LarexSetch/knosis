import { useEffect, useMemo, useRef } from 'react';
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
  useUpdateNodeInternals,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { Plus } from 'lucide-react';
import type { GraphSelection, OntologyDocument, OntologyRelation } from '../types';
import '@xyflow/react/dist/style.css';

type HandleSide = 'top' | 'right' | 'bottom' | 'left';
type SideCounts = Record<HandleSide, number>;

type OntologyNodeData = {
  label: string;
  color: string;
  sideCounts: SideCounts;
};

type OntologyFlowNode = Node<OntologyNodeData, 'ontology'>;

const DEFAULT_NODE_WIDTH = 120;
const DEFAULT_NODE_HEIGHT = 36;
const HANDLE_SIDES: readonly HandleSide[] = ['top', 'right', 'bottom', 'left'];
const SIDE_TO_POSITION: Record<HandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

function createDefaultSideCounts(): SideCounts {
  return { top: 1, right: 1, bottom: 1, left: 1 };
}

function areSideCountsEqual(a: SideCounts, b: SideCounts): boolean {
  return a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;
}

function getHandleStyle(side: HandleSide, index: number, count: number) {
  const offset = `${((index + 1) / (count + 1)) * 100}%`;
  return side === 'top' || side === 'bottom' ? { left: offset } : { top: offset };
}

function OntologyNode({ id, data, selected }: NodeProps<OntologyFlowNode>) {
  const updateNodeInternals = useUpdateNodeInternals();
  const { top, right, bottom, left } = data.sideCounts;

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, top, right, bottom, left, updateNodeInternals]);

  return (
    <div
      className="relative rounded px-3 py-2 text-xs text-neutral-100"
      style={{
        background: data.color,
        border: selected ? '1px solid #d4d4d4' : '1px solid #737373',
      }}
    >
      {HANDLE_SIDES.map((side) => {
        const count = Math.max(1, data.sideCounts[side]);
        return Array.from({ length: count }, (_, index) => (
          <Handle
            id={`${side}-${index}`}
            key={`${side}-${index}`}
            position={SIDE_TO_POSITION[side]}
            style={getHandleStyle(side, index, count)}
            type="source"
          />
        ));
      })}
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

function getAdaptiveSides(
  sourceNode: OntologyFlowNode | undefined,
  targetNode: OntologyFlowNode | undefined,
): { sourceSide: HandleSide; targetSide: HandleSide } {
  if (!sourceNode || !targetNode) {
    return { sourceSide: 'bottom', targetSide: 'top' };
  }

  const sourceCenter = getNodeCenter(sourceNode);
  const targetCenter = getNodeCenter(targetNode);
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceSide: 'right', targetSide: 'left' }
      : { sourceSide: 'left', targetSide: 'right' };
  }

  return dy >= 0
    ? { sourceSide: 'bottom', targetSide: 'top' }
    : { sourceSide: 'top', targetSide: 'bottom' };
}

type EndpointAttachment = {
  relationId: string;
  otherCenterAxis: number;
  orderIndex: number;
};

type AdaptiveLayout = {
  sideCountsByNode: Map<string, SideCounts>;
  handlesByRelationId: Map<string, { sourceHandle: string; targetHandle: string }>;
};

function computeAdaptiveLayout(
  nodes: OntologyFlowNode[],
  relations: OntologyRelation[],
): AdaptiveLayout {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const endpointsByKey = new Map<string, EndpointAttachment[]>();
  const sidesByRelationId = new Map<string, { sourceSide: HandleSide; targetSide: HandleSide }>();

  relations.forEach((relation, orderIndex) => {
    const sourceNode = nodeMap.get(relation.sourceElementId);
    const targetNode = nodeMap.get(relation.targetElementId);
    const { sourceSide, targetSide } = getAdaptiveSides(sourceNode, targetNode);
    sidesByRelationId.set(relation.id, { sourceSide, targetSide });

    const sourceCenter = sourceNode ? getNodeCenter(sourceNode) : { x: 0, y: 0 };
    const targetCenter = targetNode ? getNodeCenter(targetNode) : { x: 0, y: 0 };

    const addEndpoint = (nodeId: string, side: HandleSide, otherCenter: { x: number; y: number }) => {
      const key = `${nodeId}:${side}`;
      const list = endpointsByKey.get(key) ?? [];
      list.push({
        relationId: relation.id,
        otherCenterAxis: side === 'top' || side === 'bottom' ? otherCenter.x : otherCenter.y,
        orderIndex,
      });
      endpointsByKey.set(key, list);
    };

    addEndpoint(relation.sourceElementId, sourceSide, targetCenter);
    addEndpoint(relation.targetElementId, targetSide, sourceCenter);
  });

  const sideCountsByNode = new Map<string, SideCounts>();
  nodes.forEach((node) => sideCountsByNode.set(node.id, createDefaultSideCounts()));

  const slotIndexByKey = new Map<string, number>();

  endpointsByKey.forEach((attachments, key) => {
    attachments.sort(
      (a, b) => a.otherCenterAxis - b.otherCenterAxis || a.orderIndex - b.orderIndex,
    );

    const separatorIndex = key.lastIndexOf(':');
    const nodeId = key.slice(0, separatorIndex);
    const side = key.slice(separatorIndex + 1) as HandleSide;

    const counts = sideCountsByNode.get(nodeId) ?? createDefaultSideCounts();
    counts[side] = Math.max(1, attachments.length);
    sideCountsByNode.set(nodeId, counts);

    attachments.forEach((attachment, index) => {
      slotIndexByKey.set(`${attachment.relationId}:${key}`, index);
    });
  });

  const handlesByRelationId = new Map<string, { sourceHandle: string; targetHandle: string }>();
  relations.forEach((relation) => {
    const sides = sidesByRelationId.get(relation.id) ?? { sourceSide: 'bottom', targetSide: 'top' };
    const sourceSlot = slotIndexByKey.get(`${relation.id}:${relation.sourceElementId}:${sides.sourceSide}`) ?? 0;
    const targetSlot = slotIndexByKey.get(`${relation.id}:${relation.targetElementId}:${sides.targetSide}`) ?? 0;

    handlesByRelationId.set(relation.id, {
      sourceHandle: `${sides.sourceSide}-${sourceSlot}`,
      targetHandle: `${sides.targetSide}-${targetSlot}`,
    });
  });

  return { sideCountsByNode, handlesByRelationId };
}

type GraphEditorProps = {
  document: OntologyDocument;
  onSelect: (selection: GraphSelection) => void;
  onMoveVertex: (id: string, position: { x: number; y: number }) => void;
  onAddVertex: () => void;
  onConnect: (sourceElementId: string, targetElementId: string) => void;
  onReconnect: (relationId: string, sourceElementId: string, targetElementId: string) => void;
  onDeleteEdge: (relationId: string) => void;
};

export default function GraphEditor({
  document,
  onSelect,
  onMoveVertex,
  onAddVertex,
  onConnect,
  onReconnect,
  onDeleteEdge,
}: GraphEditorProps) {
  const initialNodes = useMemo<OntologyFlowNode[]>(
    () => document.elements.map((element) => ({
      id: element.id,
      type: 'ontology',
      position: element.meta.position,
      data: {
        label: element.name,
        color: element.meta.color,
        sideCounts: createDefaultSideCounts(),
      },
    })),
    [document.elements],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<OntologyFlowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const reconnectSuccessfulRef = useRef(true);

  useEffect(() => {
    setNodes((currentNodes) => {
      const currentById = new Map(currentNodes.map((node) => [node.id, node]));

      return initialNodes.map((node) => {
        const existing = currentById.get(node.id);
        return existing
          ? {
              ...existing,
              position: node.position,
              data: { ...node.data, sideCounts: existing.data.sideCounts },
            }
          : node;
      });
    });
  }, [initialNodes, setNodes]);

  useEffect(() => {
    const { sideCountsByNode, handlesByRelationId } = computeAdaptiveLayout(nodes, document.relations);

    setNodes((currentNodes) => {
      let hasChanges = false;
      const nextNodes = currentNodes.map((node) => {
        const nextCounts = sideCountsByNode.get(node.id) ?? createDefaultSideCounts();
        if (areSideCountsEqual(node.data.sideCounts, nextCounts)) {
          return node;
        }
        hasChanges = true;
        return {
          ...node,
          data: { ...node.data, sideCounts: nextCounts },
        };
      });

      return hasChanges ? nextNodes : currentNodes;
    });

    setEdges((currentEdges) => {
      const selectedById = new Map(currentEdges.map((edge) => [edge.id, edge.selected]));

      return document.relations.map((relation) => {
        const handles = handlesByRelationId.get(relation.id) ?? {
          sourceHandle: 'bottom-0',
          targetHandle: 'top-0',
        };

        return {
          id: relation.id,
          source: relation.sourceElementId,
          target: relation.targetElementId,
          sourceHandle: handles.sourceHandle,
          targetHandle: handles.targetHandle,
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
  }, [nodes, document.relations, setNodes, setEdges]);

  function handleConnect(connection: Connection) {
    if (!connection.source || !connection.target || connection.source === connection.target) {
      return;
    }

    onConnect(connection.source, connection.target);
  }

  function handleReconnectStart() {
    reconnectSuccessfulRef.current = false;
  }

  function handleReconnect(oldEdge: Edge, newConnection: Connection) {
    reconnectSuccessfulRef.current = true;
    if (
      !newConnection.source
      || !newConnection.target
      || newConnection.source === newConnection.target
    ) {
      return;
    }

    onReconnect(oldEdge.id, newConnection.source, newConnection.target);
  }

  function handleReconnectEnd(_: MouseEvent | TouchEvent, edge: Edge) {
    if (!reconnectSuccessfulRef.current) {
      onDeleteEdge(edge.id);
    }
    reconnectSuccessfulRef.current = true;
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
        onReconnectStart={handleReconnectStart}
        onReconnect={handleReconnect}
        onReconnectEnd={handleReconnectEnd}
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
        elevateEdgesOnSelect
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
