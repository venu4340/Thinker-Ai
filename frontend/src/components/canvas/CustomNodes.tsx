import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  Sparkles, Clock, AlertTriangle, Scale, 
  Flag, Layers, User as UserIcon, Target, CheckCircle, Cpu
} from 'lucide-react';
import { Badge } from '../ui/Badge';

// 1. Core Idea Node
export const IdeaNode = memo(({ data }: NodeProps) => {
  const d = data as any;
  return (
    <div className="min-w-[280px] max-w-[340px] rounded-2xl p-4 bg-[#0C1220]/95 border-2 border-[#27E6B5]/60 shadow-xl shadow-teal-500/15 backdrop-blur-2xl text-white transition-transform hover:scale-[1.02]">
      <Handle type="source" position={Position.Bottom} className="!bg-[#27E6B5] !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-[#27E6B5]/15 border border-[#27E6B5]/30 text-[#27E6B5]">
          <Sparkles className="w-4 h-4 text-[#27E6B5]" />
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#27E6B5]">
          Core Project Vision
        </span>
      </div>
      <h3 className="font-bold text-sm text-white mb-1.5 line-clamp-2">
        {String(d.title || 'Project Idea')}
      </h3>
      {d.goal && (
        <p className="text-xs text-slate-300 line-clamp-2 mb-3 bg-[#05080D]/60 p-2 rounded-xl border border-slate-800/80">
          🎯 {String(d.goal)}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {d.category && (
          <span className="px-2 py-0.5 rounded-full bg-[#27E6B5]/15 text-[#27E6B5] border border-[#27E6B5]/30">
            {String(d.category)}
          </span>
        )}
        {d.timeframe && (
          <span className="px-2 py-0.5 rounded-full bg-[#101827] text-slate-300 border border-slate-700/60">
            ⏳ {String(d.timeframe)}
          </span>
        )}
      </div>
    </div>
  );
});

// 2. Objective Node (Teal Accent)
export const ObjectiveNode = memo(({ data }: NodeProps) => {
  const d = data as any;
  return (
    <div className="min-w-[240px] max-w-[280px] rounded-xl p-3 bg-[#0C1220]/95 border border-[#27E6B5]/40 shadow-lg shadow-teal-500/10 backdrop-blur-xl text-white hover:border-[#27E6B5] transition-all">
      <Handle type="target" position={Position.Top} className="!bg-[#27E6B5]" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#27E6B5]" />
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 text-[#27E6B5] text-[10px] font-bold uppercase tracking-wider">
          <Target className="w-3.5 h-3.5" />
          <span>Objective</span>
        </div>
        <Badge variant="teal" size="sm">
          {String(d.priority || 'High')}
        </Badge>
      </div>
      <h4 className="text-xs font-semibold text-white mb-1 line-clamp-2">
        {String(d.title || '')}
      </h4>
      {d.target_metric && (
        <div className="text-[11px] text-[#27E6B5] bg-[#27E6B5]/10 px-2 py-1 rounded-md border border-[#27E6B5]/20 font-mono mt-1">
          📊 {String(d.target_metric)}
        </div>
      )}
    </div>
  );
});

// 3. Phase Node (Cyan Accent)
export const PhaseNode = memo(({ data }: NodeProps) => {
  const d = data as any;
  const color = String(d.color || '#19C7D9');
  return (
    <div 
      className="min-w-[260px] max-w-[300px] rounded-xl p-3.5 bg-[#0C1220]/95 border-2 shadow-lg backdrop-blur-xl text-white transition-all hover:scale-[1.01]"
      style={{ borderColor: color }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#19C7D9]" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#19C7D9]" />
      <div className="flex items-center justify-between mb-1.5">
        <span 
          className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {String(d.title || '')}
        </span>
        <span className="text-[10px] text-slate-400">
          {Number(d.taskCount || 0)} tasks
        </span>
      </div>
      {d.description && (
        <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">
          {String(d.description)}
        </p>
      )}
    </div>
  );
});

// 4. Task Node (Blue Accent)
export const TaskNode = memo(({ data }: NodeProps) => {
  const d = data as any;
  const statusColors = {
    todo: 'border-slate-800 bg-[#0C1220]/95 text-slate-300',
    in_progress: 'border-[#38BDF8]/50 bg-[#0C182A]/90 text-sky-200 shadow-sky-500/10',
    review: 'border-amber-500/50 bg-[#1F170D]/90 text-amber-200',
    done: 'border-emerald-500/50 bg-[#0A1D16]/90 text-emerald-200',
    blocked: 'border-rose-500/50 bg-[#220D12]/90 text-rose-200',
  };

  const priorityBadges = {
    critical: 'danger',
    high: 'warning',
    medium: 'teal',
    low: 'neutral',
  } as const;

  const currentStatus = String(d.status || 'todo');
  const priority = String(d.priority || 'medium') as keyof typeof priorityBadges;

  return (
    <div
      className={`min-w-[260px] max-w-[300px] rounded-xl p-3 border shadow-md backdrop-blur-md transition-all hover:shadow-lg hover:border-[#38BDF8] group cursor-pointer ${
        statusColors[currentStatus as keyof typeof statusColors] || statusColors.todo
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#38BDF8]" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#38BDF8]" />

      <div className="flex items-center justify-between gap-1 mb-1.5">
        <Badge variant={priorityBadges[priority] || 'teal'} size="sm">
          {priority.toUpperCase()}
        </Badge>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{Number(d.estimated_hours || 4)}h</span>
        </div>
      </div>

      <h4 className="text-xs font-semibold text-white mb-1.5 line-clamp-2 group-hover:text-[#38BDF8] transition-colors">
        {String(d.title || '')}
      </h4>

      {d.description && (
        <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
          {String(d.description)}
        </p>
      )}

      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1">
          <UserIcon className="w-3 h-3 text-slate-400" />
          <span className="truncate max-w-[90px]">{String(d.owner || 'Unassigned')}</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="capitalize px-1.5 py-0.5 rounded bg-[#05080D] border border-slate-800 text-[10px]">
            {currentStatus.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
});

// 5. Risk Node (Red/Orange Accent)
export const RiskNode = memo(({ data }: NodeProps) => {
  const d = data as any;
  return (
    <div className="min-w-[250px] max-w-[290px] rounded-xl p-3 bg-[#0C1220]/95 border border-rose-500/40 shadow-lg shadow-rose-500/10 backdrop-blur-md text-white hover:border-rose-400 transition-all">
      <Handle type="target" position={Position.Top} className="!bg-rose-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-rose-400" />
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Risk</span>
        </div>
        <Badge variant="danger" size="sm">
          {String(d.severity || 'High')}
        </Badge>
      </div>
      <h4 className="text-xs font-semibold text-white mb-1 line-clamp-2">
        {String(d.risk || '')}
      </h4>
      {d.mitigation && (
        <p className="text-[10px] text-slate-300 bg-[#05080D]/60 p-1.5 rounded-lg border border-slate-800 line-clamp-2 mt-1">
          🛡️ {String(d.mitigation)}
        </p>
      )}
    </div>
  );
});

// 6. Milestone Node (Purple Accent)
export const MilestoneNode = memo(({ data }: NodeProps) => {
  const d = data as any;
  return (
    <div className="min-w-[240px] max-w-[280px] rounded-xl p-3 bg-[#0C1220]/95 border border-[#8B5CF6]/50 shadow-lg shadow-purple-500/10 backdrop-blur-md text-white hover:border-[#8B5CF6] transition-all">
      <Handle type="target" position={Position.Top} className="!bg-[#8B5CF6]" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#8B5CF6]" />
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 text-[#8B5CF6] text-[10px] font-bold uppercase tracking-wider">
          <Flag className="w-3.5 h-3.5" />
          <span>Milestone</span>
        </div>
        <span className="text-[10px] text-slate-400">
          Week {Number(d.estimated_week || 1)}
        </span>
      </div>
      <h4 className="text-xs font-semibold text-white mb-1 line-clamp-2">
        {String(d.title || '')}
      </h4>
      {d.description && (
        <p className="text-[11px] text-slate-400 line-clamp-2">
          {String(d.description)}
        </p>
      )}
    </div>
  );
});

// 7. Decision Node (Amber Accent)
export const DecisionNode = memo(({ data }: NodeProps) => {
  const d = data as any;
  return (
    <div className="min-w-[240px] max-w-[280px] rounded-xl p-3 bg-[#0C1220]/95 border border-amber-500/40 shadow-lg shadow-amber-500/10 backdrop-blur-md text-white hover:border-amber-400 transition-all">
      <Handle type="target" position={Position.Top} className="!bg-amber-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-amber-400" />
      <div className="flex items-center gap-1 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-1">
        <Scale className="w-3.5 h-3.5" />
        <span>Decision</span>
      </div>
      <h4 className="text-xs font-semibold text-white mb-1 line-clamp-2">
        {String(d.decision || '')}
      </h4>
      {d.reason && (
        <p className="text-[11px] text-slate-400 line-clamp-2">
          {String(d.reason)}
        </p>
      )}
    </div>
  );
});

// 8. Resource Node (Green Accent)
export const ResourceNode = memo(({ data }: NodeProps) => {
  const d = data as any;
  return (
    <div className="min-w-[240px] max-w-[280px] rounded-xl p-3 bg-[#0C1220]/95 border border-emerald-500/40 shadow-lg shadow-emerald-500/10 backdrop-blur-md text-white hover:border-emerald-400 transition-all">
      <Handle type="target" position={Position.Top} className="!bg-emerald-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-400" />
      <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1">
        <Cpu className="w-3.5 h-3.5" />
        <span>Resource</span>
      </div>
      <h4 className="text-xs font-semibold text-white mb-1 line-clamp-2">
        {String(d.title || d.resource || '')}
      </h4>
      {d.type && (
        <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
          {String(d.type)}
        </span>
      )}
    </div>
  );
});

export const nodeTypes = {
  ideaNode: IdeaNode,
  objectiveNode: ObjectiveNode,
  phaseNode: PhaseNode,
  taskNode: TaskNode,
  riskNode: RiskNode,
  decisionNode: DecisionNode,
  milestoneNode: MilestoneNode,
  resourceNode: ResourceNode,
};
