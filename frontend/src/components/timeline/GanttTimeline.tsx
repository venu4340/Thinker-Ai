import React from 'react';
import { Calendar, Clock, CheckCircle2, Flag, Sparkles } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const GanttTimeline: React.FC = () => {
  const { project, refinePlan, isAiGenerating } = useProject();

  if (!project) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#27E6B5]" />
            Project Execution Timeline & Roadmap
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sequential phase scheduling, milestone checkpoints, and critical path progression.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => refinePlan('optimize_timeline')}
          disabled={isAiGenerating}
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#27E6B5]" />
          Optimize Schedule
        </Button>
      </div>

      {/* Milestones Horizontal Bar */}
      {project.milestones.length > 0 && (
        <div className="bg-[#0C1220]/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8B5CF6] flex items-center gap-1.5 mb-3">
            <Flag className="w-4 h-4 text-[#8B5CF6]" /> Major Milestone Checkpoints
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {project.milestones.map((m, idx) => (
              <div key={idx} className="p-3.5 bg-[#05080D]/70 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-200">{m.title}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px]">
                      Week {m.estimated_week || idx + 2}
                    </span>
                  </div>
                  {m.description && (
                    <p className="text-[11px] text-slate-400 mt-1">{m.description}</p>
                  )}
                </div>
                {m.criteria && m.criteria.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#27E6B5]" />
                    <span>{m.criteria.length} verification criteria</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phases & Tasks Timeline Stack */}
      <div className="space-y-5">
        {project.phases.map((phase) => {
          const totalHours = phase.tasks.reduce((sum, t) => sum + (t.estimated_hours || 4), 0);
          const completedCount = phase.tasks.filter((t) => t.status === 'done').length;
          const phaseProgress = phase.tasks.length ? (completedCount / phase.tasks.length) * 100 : 0;

          return (
            <div key={phase.id} className="bg-[#0C1220]/75 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              {/* Phase Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: phase.color || '#19C7D9' }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">{phase.title}</h3>
                    {phase.description && (
                      <p className="text-xs text-slate-400">{phase.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {totalHours}h estimated
                  </span>
                  <Badge variant={phaseProgress === 100 ? 'teal' : 'neutral'} size="sm">
                    {completedCount} / {phase.tasks.length} Completed
                  </Badge>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#05080D] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${phaseProgress}%`,
                    backgroundColor: phase.color || '#19C7D9',
                  }}
                />
              </div>

              {/* Task Cards in Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {phase.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl bg-[#080D16]/90 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <Badge
                          variant={task.priority === 'critical' ? 'danger' : task.priority === 'high' ? 'warning' : 'teal'}
                          size="sm"
                        >
                          {task.priority.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {task.estimated_hours}h
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-200 line-clamp-2">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>👤 {task.owner || 'Lead'}</span>
                      <span className="capitalize px-1.5 py-0.5 rounded bg-[#05080D] border border-slate-800">
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
