import React from 'react';
import { 
  LayoutGrid, Calendar, ShieldAlert, CheckSquare, Scale, Users, 
  FileText, History, Sparkles, Wand2, Compass
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Button } from '../ui/Button';

interface SidebarProps {
  onOpenDocModal: () => void;
  onOpenVersionsModal: () => void;
  onOpenChallengeModal: () => void;
  onOpenApproachesModal: () => void;
  onGeneratePlanModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenDocModal,
  onOpenVersionsModal,
  onOpenChallengeModal,
  onOpenApproachesModal,
  onGeneratePlanModal,
}) => {
  const { project, activeView, setActiveView, refinePlan, isAiGenerating } = useProject();

  if (!project) return null;

  const views = [
    { id: 'canvas', label: 'Visual Board', icon: LayoutGrid, count: project.phases.length + ' phases' },
    { id: 'timeline', label: 'Timeline & Gantt', icon: Calendar },
    { id: 'risks', label: 'Risk Matrix', icon: ShieldAlert, count: project.risks.length },
    { id: 'tasks', label: 'Smart Task Board', icon: CheckSquare, count: project.tasks.length },
    { id: 'decisions', label: 'Decision Log', icon: Scale, count: project.decisions.length },
    { id: 'resources', label: 'Resource Center', icon: Users, count: project.resources.length },
  ];

  return (
    <aside className="w-[260px] border-r border-slate-800/60 bg-[#080D16]/90 backdrop-blur-2xl flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] p-3.5 overflow-y-auto z-20">
      <div className="space-y-6">
        {/* Project Health / Progress Widget */}
        <div className="p-3.5 rounded-2xl bg-[#0C1220]/90 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-medium">Project Progress</span>
            <span className="font-bold text-[#27E6B5]">{project.progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-[#05080D] rounded-full h-2 overflow-hidden border border-slate-800/50">
            <div
              className="bg-gradient-to-r from-[#20D9B0] to-[#19C7D9] h-2 rounded-full transition-all duration-500 shadow-sm shadow-teal-500/30"
              style={{ width: `${Math.max(project.progress, 5)}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="bg-[#05080D]/80 p-2 rounded-xl border border-slate-800/60 text-center">
              <span className="block font-bold text-slate-200">{project.tasks.length}</span> Tasks
            </div>
            <div className="bg-[#05080D]/80 p-2 rounded-xl border border-slate-800/60 text-center">
              <span className="block font-bold text-amber-400">{project.risks.length}</span> Risks
            </div>
          </div>
        </div>

        {/* Views Navigation */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-2">
            Workspace Views
          </span>
          <nav className="space-y-1">
            {views.map((v) => {
              const Icon = v.icon;
              const isActive = activeView === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#27E6B5]/10 text-[#27E6B5] border border-[#27E6B5]/25 shadow-sm shadow-teal-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#101827] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#27E6B5]' : 'text-slate-400'}`} />
                    <span>{v.label}</span>
                  </div>
                  {v.count !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#05080D] text-slate-400 border border-slate-800">
                      {v.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI Copilot & Refinement Operations */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              AI Intelligence
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#27E6B5] animate-pulse" />
          </div>

          <div className="space-y-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onGeneratePlanModal}
              className="w-full justify-start text-xs font-semibold py-2.5 shadow-md shadow-teal-500/20"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {project.phases.length > 0 ? 'Regenerate Plan' : 'Generate AI Plan'}
            </Button>

            <button
              onClick={onOpenChallengeModal}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 transition-colors cursor-pointer text-left"
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Challenge This Plan</span>
            </button>

            <button
              onClick={onOpenApproachesModal}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-purple-300 bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/25 transition-colors cursor-pointer text-left"
            >
              <Compass className="w-3.5 h-3.5 shrink-0 text-purple-400" />
              <span>Generate 3 Approaches</span>
            </button>

            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-1.5">
              <button
                onClick={() => refinePlan('make_detailed')}
                disabled={isAiGenerating}
                className="p-1.5 rounded-lg bg-[#0C1220] hover:bg-[#101827] border border-slate-800 text-[11px] text-slate-300 hover:text-[#27E6B5] transition-colors cursor-pointer text-center"
              >
                + More Detail
              </button>
              <button
                onClick={() => refinePlan('simplify')}
                disabled={isAiGenerating}
                className="p-1.5 rounded-lg bg-[#0C1220] hover:bg-[#101827] border border-slate-800 text-[11px] text-slate-300 hover:text-[#27E6B5] transition-colors cursor-pointer text-center"
              >
                Simplify
              </button>
              <button
                onClick={() => refinePlan('find_missing')}
                disabled={isAiGenerating}
                className="p-1.5 rounded-lg bg-[#0C1220] hover:bg-[#101827] border border-slate-800 text-[11px] text-slate-300 hover:text-[#27E6B5] transition-colors cursor-pointer text-center"
              >
                Find Gaps
              </button>
              <button
                onClick={() => refinePlan('optimize_timeline')}
                disabled={isAiGenerating}
                className="p-1.5 rounded-lg bg-[#0C1220] hover:bg-[#101827] border border-slate-800 text-[11px] text-slate-300 hover:text-[#27E6B5] transition-colors cursor-pointer text-center"
              >
                Optimize Dates
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Tools: Documents & Version History */}
      <div className="pt-3 border-t border-slate-800/80 space-y-1">
        <button
          onClick={onOpenDocModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-[#101827] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Documents & RAG</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#05080D] border border-slate-800">
            {project.documents.length}
          </span>
        </button>

        <button
          onClick={onOpenVersionsModal}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-[#101827] transition-colors cursor-pointer"
        >
          <History className="w-4 h-4 text-slate-400" />
          <span>Version History</span>
        </button>
      </div>
    </aside>
  );
};
