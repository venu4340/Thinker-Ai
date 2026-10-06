import React from 'react';
import { Target, TrendingUp, ArrowRightCircle, Calendar, AlertTriangle, Sparkles } from 'lucide-react';
import { ProjectDetail, ProjectSummary } from '../../types';

interface GoalExecutionSummaryProps {
  project?: ProjectDetail | ProjectSummary | null;
  phases?: Array<{ id?: string; title: string; order?: number }>;
  tasks?: Array<{ id?: string; title: string; status: string; priority?: string }>;
  risks?: Array<{ id?: string; risk: string; severity?: string }>;
  className?: string;
}

export const GoalExecutionSummary: React.FC<GoalExecutionSummaryProps> = ({
  project,
  phases = [],
  tasks = [],
  risks = [],
  className = '',
}) => {
  if (!project) return null;

  // 1. Current Progress
  const progressVal = typeof project.progress === 'number' ? Math.round(project.progress) : 0;

  // 2. Current Goal
  const rawGoal = (project as any).goal || project.description || project.title || 'Execute structured milestones';
  // Keep short display
  const displayGoal = rawGoal.replace(/^(I want to |My goal is to |Goal: )/i, '');

  // Extract phases & tasks if full ProjectDetail is passed
  const allPhases = (project as any).phases?.length ? (project as any).phases : phases;
  const allTasks = (project as any).tasks?.length ? (project as any).tasks : tasks;
  const allRisks = (project as any).risks?.length ? (project as any).risks : risks;

  // 3. Next Step: highest priority uncompleted task or first todo/in_progress task
  const nextTask = 
    allTasks.find((t: any) => t.status === 'in_progress') ||
    allTasks.find((t: any) => t.status === 'todo' && (t.priority === 'critical' || t.priority === 'high')) ||
    allTasks.find((t: any) => t.status === 'todo') ||
    allTasks[0];
  const nextStepTitle = nextTask ? nextTask.title : 'Review completed milestones & verify outcomes';

  // 4. Short Timeline: based on real phases
  const timelineItems: string[] = [];
  if (allPhases.length > 0) {
    allPhases.slice(0, 6).forEach((ph: any, idx: number) => {
      const pTitle = ph.title || ph.name || `Phase ${idx + 1}`;
      if (/^(month|phase|week|sprint|stage|step)/i.test(pTitle)) {
        timelineItems.push(pTitle);
      } else {
        timelineItems.push(`Phase ${ph.order || idx + 1} — ${pTitle}`);
      }
    });
  } else {
    timelineItems.push('Phase 1 — Foundations & Setup', 'Phase 2 — Core Execution', 'Phase 3 — Verification & Launch');
  }

  // 5. Challenges: 2-3 challenges relevant to actual goal
  const challengesList: string[] = [];
  if (allRisks.length > 0) {
    allRisks.slice(0, 3).forEach((r: any) => {
      const riskText = r.risk || r.title || r.cause || r.description || '';
      if (riskText) challengesList.push(riskText);
    });
  }
  if (challengesList.length === 0) {
    // Context-sensitive fallback based on goal keywords
    const lower = rawGoal.toLowerCase();
    if (lower.includes('learn') || lower.includes('study') || lower.includes('engineer') || lower.includes('python')) {
      challengesList.push('Staying consistent with daily practice', 'Information overload from multiple resources', 'Applying theory to hands-on projects');
    } else if (lower.includes('saas') || lower.includes('launch') || lower.includes('startup') || lower.includes('build')) {
      challengesList.push('Balancing speed with code quality', 'Early user feedback & validation', 'Managing scope creep in MVP');
    } else {
      challengesList.push('Maintaining consistent execution tempo', 'Managing unexpected scope dependencies', 'Validating milestone acceptance criteria');
    }
  }

  // 6. AI Guide: dynamic guidance box
  let aiGuideText = 'Focus on your current phase first. Complete the highest-priority task before moving ahead.';
  if (progressVal === 0) {
    aiGuideText = `Start by executing the initial tasks in ${timelineItems[0] || 'Phase 1'}. Building momentum early creates steady progress.`;
  } else if (progressVal >= 100) {
    aiGuideText = 'All milestones completed! Validate outcomes against your core goal and finalize documentation.';
  } else if (nextTask) {
    aiGuideText = `Focus on "${nextStepTitle}" first. Complete this active step before tackling downstream milestones.`;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 6-Card Useful Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. CURRENT PROGRESS */}
        <div className="p-4 rounded-2xl bg-[#0C1220]/90 border border-slate-800/80 shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#27E6B5]" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Current Progress
              </span>
            </div>
            <span className="text-xs font-bold text-[#27E6B5] bg-[#27E6B5]/10 px-2 py-0.5 rounded-full border border-[#27E6B5]/20">
              {progressVal}% Complete
            </span>
          </div>
          <div>
            <div className="w-full bg-[#05080D] rounded-full h-2 overflow-hidden border border-slate-800/60 mb-2">
              <div
                className="bg-gradient-to-r from-[#20D9B0] to-[#19C7D9] h-2 rounded-full transition-all duration-500 shadow-sm shadow-teal-500/30"
                style={{ width: `${Math.max(progressVal, 5)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {allTasks.length > 0
                ? `${allTasks.filter((t: any) => t.status === 'done').length} of ${allTasks.length} tasks completed`
                : `${progressVal}% overall completion`}
            </p>
          </div>
        </div>

        {/* 2. CURRENT GOAL */}
        <div className="p-4 rounded-2xl bg-[#0C1220]/90 border border-slate-800/80 shadow-md flex flex-col justify-between space-y-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#20D9B0]" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Current Goal
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-white line-clamp-2 leading-relaxed">
              {displayGoal}
            </p>
            {project.category && (
              <span className="inline-block text-[10px] text-slate-400 mt-1">
                Category: <span className="text-slate-300 font-medium">{project.category}</span>
              </span>
            )}
          </div>
        </div>

        {/* 3. NEXT STEP */}
        <div className="p-4 rounded-2xl bg-[#0C1220]/90 border border-slate-800/80 shadow-md flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRightCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Next Step
              </span>
            </div>
            {nextTask?.priority && (
              <span className="text-[10px] uppercase font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                {nextTask.priority}
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-emerald-300 line-clamp-2 leading-relaxed">
            {nextStepTitle}
          </p>
        </div>

        {/* 4. SHORT TIMELINE */}
        <div className="p-4 rounded-2xl bg-[#0C1220]/90 border border-slate-800/80 shadow-md space-y-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Short Timeline
            </span>
          </div>
          <div className="space-y-1 text-xs">
            {timelineItems.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. CHALLENGES */}
        <div className="p-4 rounded-2xl bg-[#0C1220]/90 border border-slate-800/80 shadow-md space-y-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Challenges
            </span>
          </div>
          <ul className="space-y-1 text-xs text-slate-300">
            {challengesList.slice(0, 3).map((ch, idx) => (
              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                <span className="text-amber-400 font-bold shrink-0">•</span>
                <span className="line-clamp-1">{ch}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 6. AI GUIDE */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0C1220]/95 to-[#161338]/80 border border-[#20D9B0]/25 shadow-md flex flex-col justify-between space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#20D9B0]" />
            <span className="text-[11px] font-bold text-[#20D9B0] uppercase tracking-wider">
              AI Guide
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            {aiGuideText}
          </p>
        </div>
      </div>
    </div>
  );
};
