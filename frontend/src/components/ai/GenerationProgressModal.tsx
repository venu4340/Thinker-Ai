import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Loader2, ShieldCheck, Layers, GitBranch, AlertTriangle, Calendar } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export const GenerationProgressModal: React.FC = () => {
  const { isAiGenerating, aiGenerationStep } = useProject();
  const [stepIndex, setStepIndex] = useState(0);

  const stages = [
    { title: 'Analyzing idea & constraints', detail: 'Understanding objective & scope', icon: ShieldCheck },
    { title: 'Generating project architecture', detail: 'Deconstructing phases & milestones', icon: Layers },
    { title: 'Building execution tasks', detail: 'Mapping dependencies & skills required', icon: GitBranch },
    { title: 'Conducting risk analysis', detail: 'Calculating probability & impact matrix', icon: AlertTriangle },
    { title: 'Building Gantt timeline', detail: 'Estimating task hours & scheduling dates', icon: Calendar },
    { title: 'Finalizing execution board', detail: 'Validating Pydantic schema & DAG integrity', icon: Sparkles },
  ];

  useEffect(() => {
    if (!isAiGenerating) {
      setStepIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(timer);
  }, [isAiGenerating]);

  if (!isAiGenerating) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0C1220]/95 border border-[#27E6B5]/30 rounded-3xl p-7 shadow-2xl space-y-6">
        {/* Glow Orb Header */}
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#20D9B0] to-[#19C7D9] blur-md opacity-70 animate-pulse" />
            <div className="relative w-full h-full rounded-2xl bg-[#05080D] border border-[#27E6B5]/50 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#27E6B5] animate-spin" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              ThinkFlow AI Engine Synthesizing
            </h3>
            <p className="text-xs text-[#27E6B5] font-mono">
              {aiGenerationStep || 'Deconstructing problem into structured execution plan...'}
            </p>
          </div>
        </div>

        {/* Step Checkpoints */}
        <div className="space-y-2.5 bg-[#05080D]/80 p-4 rounded-2xl border border-slate-800/80">
          {stages.map((st, idx) => {
            const isCompleted = idx < stepIndex;
            const isCurrent = idx === stepIndex;
            const Icon = st.icon;

            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-2 rounded-xl transition-all duration-300 ${
                  isCurrent
                    ? 'bg-[#27E6B5]/10 border border-[#27E6B5]/25 text-white'
                    : isCompleted
                    ? 'text-slate-300 opacity-80'
                    : 'text-slate-600 opacity-40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-[#27E6B5]'
                        : isCurrent
                        ? 'bg-[#27E6B5] text-[#03110F] font-bold'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 text-[#27E6B5]" /> : idx + 1}
                  </div>
                  <div>
                    <span className="text-xs font-semibold block">{st.title}</span>
                    <span className="text-[10px] text-slate-400 block">{st.detail}</span>
                  </div>
                </div>

                {isCurrent && (
                  <Loader2 className="w-4 h-4 text-[#27E6B5] animate-spin" />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#05080D] rounded-full h-1.5 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-[#20D9B0] to-[#19C7D9] h-full transition-all duration-500"
            style={{ width: `${Math.min(100, ((stepIndex + 1) / stages.length) * 100)}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          Enforcing strict Pydantic schemas, dependency DAG integrity, and risk verification.
        </p>
      </div>
    </div>
  );
};
