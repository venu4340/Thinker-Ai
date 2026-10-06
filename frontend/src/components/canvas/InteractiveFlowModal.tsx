import React, { useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, Sparkles } from 'lucide-react';

interface InteractiveFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  isLight: boolean;
}

export const InteractiveFlowModal: React.FC<InteractiveFlowModalProps> = ({
  isOpen,
  onClose,
  data,
  isLight,
}) => {
  if (!isOpen || !data) return null;

  const { nodes, edges } = useMemo(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    const intent = data.intent || '';
    const title = data.title || data.goal || 'Thinking Flow';
    const payload = data.data || {};

    // 1. Root Node
    generatedNodes.push({
      id: 'root',
      type: 'default',
      position: { x: 300, y: 30 },
      data: {
        label: (
          <div className="p-3 text-center">
            <div className="text-[10px] uppercase font-bold text-[#20D9B0] tracking-wider mb-1">
              {intent ? intent.replace('_', ' ') : 'GOAL'}
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
              {title}
            </div>
            {data.duration && (
              <div className="text-[10px] text-slate-500 mt-1 font-medium">
                {data.duration}
              </div>
            )}
          </div>
        ),
      },
      style: {
        background: isLight ? '#FFFFFF' : '#0E1726',
        color: isLight ? '#0F172A' : '#FFFFFF',
        border: '2px solid #20D9B0',
        borderRadius: '16px',
        width: 240,
        boxShadow: '0 10px 25px rgba(32, 217, 176, 0.2)',
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });

    // 2. Build intent-specific node trees
    if (intent.includes('LEARNING') || data.workspace === 'roadmap') {
      const phases = payload.phases || [];
      phases.forEach((phase: any, idx: number) => {
        const phaseId = `phase-${idx}`;
        const yPos = 160 + idx * 130;
        const xPos = 160 + (idx % 2 === 0 ? 0 : 280);

        generatedNodes.push({
          id: phaseId,
          position: { x: xPos, y: yPos },
          data: {
            label: (
              <div className="p-2.5 text-left">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-5 h-5 rounded-md bg-[#20D9B0]/20 text-[#20D9B0] font-bold text-[10px] flex items-center justify-center font-mono">
                    {phase.phase_number || idx + 1}
                  </span>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                    {phase.title}
                  </span>
                </div>
                {phase.duration && (
                  <div className="text-[10px] text-[#20D9B0] font-medium mb-1">
                    {phase.duration}
                  </div>
                )}
                {phase.topics && phase.topics.length > 0 && (
                  <div className="text-[10px] text-slate-500 line-clamp-2">
                    {phase.topics.slice(0, 2).join(' • ')}
                  </div>
                )}
              </div>
            ),
          },
          style: {
            background: isLight ? '#FFFFFF' : '#0B111E',
            border: '1px solid rgba(32, 217, 176, 0.3)',
            borderRadius: '12px',
            width: 250,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });

        if (idx === 0) {
          generatedEdges.push({
            id: `e-root-${phaseId}`,
            source: 'root',
            target: phaseId,
            animated: true,
            style: { stroke: '#20D9B0', strokeWidth: 2 },
          });
        } else {
          generatedEdges.push({
            id: `e-phase-${idx - 1}-${phaseId}`,
            source: `phase-${idx - 1}`,
            target: phaseId,
            animated: true,
            style: { stroke: '#19C7D9', strokeWidth: 2 },
          });
        }
      });
    } else if (intent.includes('DAILY') || data.workspace === 'learning') {
      const today = payload.today || {};
      const pillars = [
        { key: 'learn', label: '1. Learn', color: '#20D9B0', text: today.learn },
        { key: 'practice', label: '2. Practice', color: '#19C7D9', text: Array.isArray(today.practice) ? today.practice.join(', ') : today.practice },
        { key: 'build', label: '3. Build', color: '#8B5CF6', text: today.build },
        { key: 'review', label: '4. Review', color: '#F59E0B', text: today.review },
      ];

      pillars.forEach((p, idx) => {
        const pillarId = `pillar-${p.key}`;
        const xPos = 60 + idx * 180;
        const yPos = 170;

        generatedNodes.push({
          id: pillarId,
          position: { x: xPos, y: yPos },
          data: {
            label: (
              <div className="p-2.5 text-left">
                <div className="text-[10px] font-bold uppercase mb-1" style={{ color: p.color }}>
                  {p.label}
                </div>
                <div className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-3">
                  {p.text || 'Daily curriculum pillar'}
                </div>
              </div>
            ),
          },
          style: {
            background: isLight ? '#FFFFFF' : '#0B111E',
            border: `1px solid ${p.color}40`,
            borderRadius: '12px',
            width: 165,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });

        generatedEdges.push({
          id: `e-root-${pillarId}`,
          source: 'root',
          target: pillarId,
          animated: true,
          style: { stroke: p.color, strokeWidth: 2 },
        });
      });
    } else if (intent.includes('PROJECT') || data.workspace === 'project') {
      const devSteps = payload.development_steps || [
        { step: 1, title: 'Architecture & MVP Scope' },
        { step: 2, title: 'Core Features Integration' },
        { step: 3, title: 'Testing & Launch' },
      ];

      devSteps.forEach((st: any, idx: number) => {
        const stepId = `step-${idx}`;
        const yPos = 160 + idx * 120;
        const xPos = 300;

        generatedNodes.push({
          id: stepId,
          position: { x: xPos, y: yPos },
          data: {
            label: (
              <div className="p-2.5 text-left">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-5 h-5 rounded-md bg-[#8B5CF6]/20 text-[#8B5CF6] font-bold text-[10px] flex items-center justify-center font-mono">
                    {st.step || idx + 1}
                  </span>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                    {st.title}
                  </span>
                </div>
                {st.tasks && (
                  <div className="text-[10px] text-slate-500 line-clamp-2">
                    {Array.isArray(st.tasks) ? st.tasks.slice(0, 2).join(' • ') : st.tasks}
                  </div>
                )}
              </div>
            ),
          },
          style: {
            background: isLight ? '#FFFFFF' : '#0B111E',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            borderRadius: '12px',
            width: 240,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });

        if (idx === 0) {
          generatedEdges.push({
            id: `e-root-${stepId}`,
            source: 'root',
            target: stepId,
            animated: true,
            style: { stroke: '#8B5CF6', strokeWidth: 2 },
          });
        } else {
          generatedEdges.push({
            id: `e-step-${idx - 1}-${stepId}`,
            source: `step-${idx - 1}`,
            target: stepId,
            animated: true,
            style: { stroke: '#20D9B0', strokeWidth: 2 },
          });
        }
      });
    } else {
      // General structure fallback (e.g. Risks, Timeline, Decision)
      const subItems = payload.risks || payload.milestones || payload.options || [];
      subItems.forEach((item: any, idx: number) => {
        const itemId = `item-${idx}`;
        const xPos = 120 + (idx % 3) * 200;
        const yPos = 160 + Math.floor(idx / 3) * 120;

        generatedNodes.push({
          id: itemId,
          position: { x: xPos, y: yPos },
          data: {
            label: (
              <div className="p-2.5 text-left">
                <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                  {item.title || item.risk || item.milestone || item.name || `Node ${idx + 1}`}
                </div>
                {(item.mitigation || item.duration || item.verdict) && (
                  <div className="text-[10px] text-[#20D9B0] line-clamp-2 mt-1">
                    {item.mitigation || item.duration || item.verdict}
                  </div>
                )}
              </div>
            ),
          },
          style: {
            background: isLight ? '#FFFFFF' : '#0B111E',
            border: '1px solid rgba(32, 217, 176, 0.3)',
            borderRadius: '12px',
            width: 180,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });

        generatedEdges.push({
          id: `e-root-${itemId}`,
          source: 'root',
          target: itemId,
          animated: true,
          style: { stroke: '#20D9B0', strokeWidth: 2 },
        });
      });
    }

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [data, isLight]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl h-[80vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden relative ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#070C16] border-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between flex-shrink-0 ${
            isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-[#05080E] border-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#20D9B0] to-[#8B5CF6] flex items-center justify-center text-[#03110F] shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {data.title || 'Visual Thinking Graph'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#20D9B0]/15 text-[#20D9B0] border border-[#20D9B0]/30 uppercase">
                  React Flow
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/10 text-slate-300'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 w-full h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            attributionPosition="bottom-left"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1}
              color={isLight ? '#94A3B8' : '#334155'}
            />
            <Controls />
            <MiniMap
              nodeColor={isLight ? '#CBD5E1' : '#1E293B'}
              maskColor={isLight ? 'rgba(240, 244, 248, 0.7)' : 'rgba(5, 8, 13, 0.7)'}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};
