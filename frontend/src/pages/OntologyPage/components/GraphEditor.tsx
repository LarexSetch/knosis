import { useEffect, useMemo } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react';
import type { GraphSelection, OntologyDocument } from '../types';
import '@xyflow/react/dist/style.css';

type GraphEditorProps = {
  document: OntologyDocument;
  onSelect: (selection: GraphSelection) => void;
  onMoveVertex: (id: string, position: { x: number; y: number }) => void;
};

export default function GraphEditor({ document, onSelect, onMoveVertex }: GraphEditorProps) {
  const initialNodes = useMemo<Node[]>(
    () => document.elements.map((element) => ({
      id: element.id,
      position: element.meta.position,
      data: { label: element.name },
      style: {
        background: element.meta.color,
        color: '#f5f5f5',
        border: '1px solid #737373',
        borderRadius: '4px',
        padding: '8px 12px',
        fontSize: '12px',
      },
    })),
    [document.elements],
  );
  const initialEdges = useMemo<Edge[]>(
    () => document.relations.map((relation) => ({
      id: relation.id,
      source: relation.sourceElementId,
      target: relation.targetElementId,
      label: relation.name,
      labelStyle: { fill: '#a3a3a3', fontSize: 11 },
      labelBgStyle: { fill: '#111111' },
      style: { stroke: '#737373' },
    })),
    [document.relations],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => setNodes(initialNodes), [initialNodes, setNodes]);
  useEffect(() => setEdges(initialEdges), [initialEdges, setEdges]);

  return (
    <div className="h-full min-h-0 min-w-0 flex-1">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onSelect({ kind: 'vertex', id: node.id })}
        onEdgeClick={(_, edge) => onSelect({ kind: 'edge', id: edge.id })}
        onPaneClick={() => onSelect(null)}
        onNodeDragStop={(_, node) => onMoveVertex(node.id, node.position)}
        minZoom={0.1}
        maxZoom={2}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
      >
        <Background color="#404040" gap={24} size={1} />
        <Controls position="top-right" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
