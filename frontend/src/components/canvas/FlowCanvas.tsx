import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

import { useProject } from '../../context/ProjectContext';
import { nodeTypes } from './CustomNodes';
import { CanvasToolbar } from './CanvasToolbar';
import { NodeDetailDrawer } from './NodeDetailDrawer';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';

// Dagre Layout Engine
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 280, height: 140 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes: Node[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - 140,
        y: nodeWithPosition.y - 70,
      },
    };
  });

  return { nodes: newNodes, edges };
};

const FlowCanvasInternal: React.FC = () => {
  const { project, setSelectedNode, createTask, createRisk } = useProject();
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [newNodeType, setNewNodeType] = useState<'task' | 'risk' | 'decision'>('task');
  const [newNodeTitle, setNewNodeTitle] = useState('');

  // Hydrate nodes and edges from project data
  useEffect(() => {
    if (!project) return;

    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    // 1. Root Idea Node
    initialNodes.push({
      id: 'root-idea',
      type: 'ideaNode',
      position: { x: 450, y: 30 },
      data: {
        title: project.title,
        goal: project.goal,
        category: project.category,
        timeframe: project.timeframe,
      },
    });

    // 2. Objective Nodes
    project.objectives.forEach((obj, idx) => {
      const objId = `obj-${obj.id}`;
      initialNodes.push({
        id: objId,
        type: 'objectiveNode',
        position: { x: 150 + idx * 300, y: 200 },
        data: { ...obj } as any,
      });

      initialEdges.push({
        id: `edge-root-${objId}`,
        source: 'root-idea',
        target: objId,
        animated: true,
        style: { stroke: '#818cf8', strokeWidth: 2 },
      });
    });

    // 3. Phase & Task Nodes
    project.phases.forEach((phase, pIdx) => {
      const phaseId = `phase-${phase.id}`;
      initialNodes.push({
        id: phaseId,
        type: 'phaseNode',
        position: { x: 100 + pIdx * 320, y: 360 },
        data: {
          ...phase,
          taskCount: phase.tasks.length,
        } as any,
      });

      // Link first objective to first phase or root to phase
      initialEdges.push({
        id: `edge-to-${phaseId}`,
        source: project.objectives.length > 0 ? `obj-${project.objectives[0].id}` : 'root-idea',
        target: phaseId,
        style: { stroke: phase.color || '#6366f1', strokeWidth: 2 },
      });

      // Phase Tasks
      phase.tasks.forEach((task, tIdx) => {
        initialNodes.push({
          id: task.id,
          type: 'taskNode',
          position: {
            x: task.position_x || (100 + pIdx * 320),
            y: task.position_y || (500 + tIdx * 160),
          },
          data: { ...task } as any,
        });

        // Link phase to first task
        if (tIdx === 0) {
          initialEdges.push({
            id: `edge-${phaseId}-${task.id}`,
            source: phaseId,
            target: task.id,
            style: { stroke: phase.color || '#6366f1', strokeWidth: 2 },
          });
        }
      });
    });

    // 4. Inter-Task Dependencies
    project.dependencies.forEach((dep) => {
      initialEdges.push({
        id: `dep-${dep.id}`,
        source: dep.source_task_id,
        target: dep.target_task_id,
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 2.5 },
      });
    });

    // 5. Risk Nodes (placed to the right)
    project.risks.forEach((risk, rIdx) => {
      const riskId = `risk-${risk.id}`;
      initialNodes.push({
        id: riskId,
        type: 'riskNode',
        position: { x: 1200, y: 250 + rIdx * 150 },
        data: { ...risk } as any,
      });
    });

    // 6. Decision Nodes
    project.decisions.forEach((dec, dIdx) => {
      const decId = `dec-${dec.id}`;
      initialNodes.push({
        id: decId,
        type: 'decisionNode',
        position: { x: 1200, y: 700 + dIdx * 140 },
        data: { ...dec } as any,
      });
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [project, setNodes, setEdges]);

  // Connect new edge
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  // Click node to open drawer
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
    },
    [setSelectedNode]
  );

  // Auto Layout
  const handleAutoLayout = useCallback(() => {
    const layouted = getLayoutedElements(nodes, edges);
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);
    setTimeout(() => fitView({ padding: 0.2, duration: 600 }), 50);
  }, [nodes, edges, setNodes, setEdges, fitView]);

  const handleAddNode = async () => {
    if (!newNodeTitle.trim()) return;
    if (newNodeType === 'task') {
      await createTask({
        title: newNodeTitle,
        priority: 'medium',
        status: 'todo',
        estimated_hours: 4,
        position_x: 400,
        position_y: 400,
      });
    } else if (newNodeType === 'risk') {
      await createRisk({
        risk: newNodeTitle,
        severity: 'high',
        probability: 3,
        impact: 4,
        mitigation: 'Define contingency protocols.',
      });
    }
    setIsAddNodeOpen(false);
    setNewNodeTitle('');
  };

  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden">
      <CanvasToolbar
        onAutoLayout={handleAutoLayout}
        onOpenAddNodeModal={() => setIsAddNodeOpen(true)}
        onFitView={() => fitView({ padding: 0.2, duration: 500 })}
        onZoomIn={() => zoomIn({ duration: 300 })}
        onZoomOut={() => zoomOut({ duration: 300 })}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{ animated: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="rgba(255, 255, 255, 0.08)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          nodeColor={(n) => {
            if (n.type === 'taskNode') return '#6366f1';
            if (n.type === 'riskNode') return '#f43f5e';
            if (n.type === 'phaseNode') return '#06b6d4';
            return '#a855f7';
          }}
        />
      </ReactFlow>

      {/* Side Drawer for Node editing & In-Context AI */}
      <NodeDetailDrawer />

      {/* Add Custom Node Modal */}
      <Dialog
        isOpen={isAddNodeOpen}
        onClose={() => setIsAddNodeOpen(false)}
        title="Add Node to Thinking Board"
        description="Insert a manual task, risk, or architectural decision onto the canvas."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Node Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['task', 'risk', 'decision'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewNodeType(t)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    newNodeType === t
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {newNodeType === 'risk' ? 'Risk Description' : 'Title'}
            </label>
            <input
              type="text"
              value={newNodeTitle}
              onChange={(e) => setNewNodeTitle(e.target.value)}
              placeholder={`Enter ${newNodeType} name...`}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsAddNodeOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddNode}>
              Add to Canvas
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export const FlowCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowCanvasInternal />
    </ReactFlowProvider>
  );
};
