import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Compass, Target, Search,
  CheckCircle, ChevronDown, ChevronUp, Lightbulb, Map, AlertTriangle,
  Users, TrendingUp, Zap, BookOpen, ExternalLink } from 'lucide-react';
import { FlowMode } from './ThinkFlowSearch';

interface Props {
  query: string;
  mode: FlowMode;
  model: string;
  onBack: () => void;
  onCreateProject: (idea: string) => void;
}

// ─── Step-by-step flow structures ────────────────────────────────────────────
const EXPLORE_STEPS = [
  { key: 'understanding', icon: Lightbulb, label: 'Understanding', color: '#27E6B5', desc: 'What the idea is actually about' },
  { key: 'opportunities', icon: TrendingUp, label: 'Possibilities', color: '#19C7D9', desc: 'What this could become' },
  { key: 'howItWorks', icon: Map, label: 'How It Could Work', color: '#8B5CF6', desc: 'A possible approach' },
  { key: 'challenges', icon: AlertTriangle, label: 'Challenges', color: '#F59E0B', desc: 'Things to watch out for' },
  { key: 'users', icon: Users, label: 'Potential Users', color: '#06B6D4', desc: 'Who benefits most' },
  { key: 'nextSteps', icon: ArrowRight, label: 'Next Steps', color: '#27E6B5', desc: 'Where to start' },
];

const PLAN_STEPS = [
  { key: 'goal', icon: Target, label: 'Goal', color: '#27E6B5', desc: 'What you want to achieve' },
  { key: 'strategy', icon: Lightbulb, label: 'Strategy', color: '#19C7D9', desc: 'The overall approach' },
  { key: 'milestones', icon: CheckCircle, label: 'Milestones', color: '#8B5CF6', desc: 'Key checkpoints' },
  { key: 'steps', icon: Map, label: 'Roadmap', color: '#06B6D4', desc: 'Step-by-step path' },
  { key: 'risks', icon: AlertTriangle, label: 'Risks', color: '#F59E0B', desc: 'What could go wrong' },
  { key: 'nextAction', icon: Zap, label: 'Next Action', color: '#27E6B5', desc: 'Start here today' },
];

const SEARCH_STEPS = [
  { key: 'answer', icon: BookOpen, label: 'Insight', color: '#27E6B5', desc: 'Direct answer' },
  { key: 'keyFindings', icon: Lightbulb, label: 'Key Findings', color: '#19C7D9', desc: 'What matters most' },
  { key: 'context', icon: Map, label: 'Context', color: '#8B5CF6', desc: 'Broader picture' },
];

// Simulation content generator
function generateContent(query: string, mode: FlowMode): Record<string, any> {
  const q = query.toLowerCase();

  if (mode === 'explore' || mode === 'auto') {
    return {
      understanding: `Your idea explores "${query.substring(0, 80)}". This touches on innovation in a space where technology and human need intersect. The core value proposition is solving a real friction point that existing solutions haven't fully addressed.`,
      opportunities: [
        'Build a focused MVP that solves one problem really well',
        'Partner with existing platforms to accelerate adoption',
        'Target a niche underserved market first, then expand',
        'Create a network-effect model where more users = more value',
      ],
      howItWorks: `Start by validating the core hypothesis with 10 real users. Build a simple prototype using existing tools. Iterate based on real feedback before investing heavily. Focus on the value delivery loop, not the technology.`,
      challenges: [
        'Market adoption and user habit change takes time',
        'Finding early adopters who will give honest feedback',
        'Differentiating from existing partial solutions',
        'Scaling the solution once it gains traction',
      ],
      users: ['Early adopters who feel the problem acutely', 'Professionals in the adjacent domain', 'Innovators looking for better tools', 'Communities already discussing this problem online'],
      nextSteps: [
        '1. Write a one-page concept document',
        '2. Talk to 5 potential users this week',
        '3. Define what success looks like in 90 days',
        '4. Identify the one riskiest assumption to test first',
      ],
    };
  }

  if (mode === 'plan') {
    return {
      goal: `Transform "${query.substring(0, 80)}" into a clear, actionable outcome with defined milestones and measurable success criteria.`,
      strategy: 'Use a phased approach: Validate → Build → Launch → Scale. Each phase has a clear gate before moving forward. Prioritize learning over building in the early stages.',
      milestones: [
        { label: 'Week 1–2', desc: 'Research and validate the core assumption' },
        { label: 'Month 1', desc: 'Complete first working prototype or proof of concept' },
        { label: 'Month 2–3', desc: 'Launch to first 10 real users and gather feedback' },
        { label: 'Month 4–6', desc: 'Refine and prepare for broader launch' },
      ],
      steps: [
        'Define the exact outcome you want to achieve',
        'Break it into 3–5 major phases',
        'Identify the top 3 dependencies or blockers',
        'Assign weekly actions to each phase',
        'Set a review checkpoint every 2 weeks',
      ],
      risks: [
        { level: 'High', risk: 'Spending too long planning without validating' },
        { level: 'Medium', risk: 'Scope creep pulling you off the critical path' },
        { level: 'Low', risk: 'External dependencies slowing your timeline' },
      ],
      nextAction: 'Open ThinkFlow AI → Create New Project → paste your goal → let AI generate the full roadmap with tasks, timeline, and risk analysis.',
    };
  }

  // Search mode
  return {
    answer: `Based on available knowledge, here is a direct insight on "${query.substring(0, 60)}": This is an actively evolving topic where the most reliable signal comes from practitioners who are implementing it today rather than theoretical frameworks.`,
    keyFindings: [
      'The fundamentals are more stable than they appear from headlines',
      'The real edge comes from combining this with adjacent knowledge',
      'Most people overcomplicate the entry point — start simple',
      'The best resources are often community-driven, not formal courses',
    ],
    context: 'This topic sits at the intersection of practical implementation and strategic thinking. Understanding the "why" before the "how" dramatically reduces wasted effort. Start with first principles, then layer in current best practices.',
  };
}

export const FlowResultPage: React.FC<Props> = ({ query, mode, model, onBack, onCreateProject }) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(['understanding', 'goal', 'answer']));
  const [revealedCount, setRevealedCount] = useState(0);

  const steps = mode === 'plan' ? PLAN_STEPS : mode === 'search' ? SEARCH_STEPS : EXPLORE_STEPS;
  const content = generateContent(query, mode);

  const modeLabel = mode === 'plan' ? 'Action Path' : mode === 'search' ? 'Insight' : 'Exploration';
  const modeIcon = mode === 'plan' ? Target : mode === 'search' ? Search : Compass;
  const ModeIcon = modeIcon;

  // Stagger step reveal
  useEffect(() => {
    const interval = setInterval(() => {
      setRevealedCount(c => {
        if (c >= steps.length) { clearInterval(interval); return c; }
        return c + 1;
      });
    }, 280);
    return () => clearInterval(interval);
  }, [steps.length]);

  const toggleStep = (key: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderContent = (step: typeof steps[0]) => {
    const value = content[step.key];
    if (!value) return null;

    if (Array.isArray(value) && typeof value[0] === 'string') {
      return (
        <ul className="space-y-2 pt-1">
          {value.map((item: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[#94A3B8] leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: step.color }} />
              {item}
            </li>
          ))}
        </ul>
      );
    }

    if (Array.isArray(value) && typeof value[0] === 'object') {
      return (
        <div className="space-y-2 pt-1">
          {value.map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              {item.label && <span className="font-semibold text-[#F1F5F9] w-20 flex-shrink-0 pt-0.5">{item.label}</span>}
              {item.level && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${
                  item.level === 'High' ? 'bg-rose-500/20 text-rose-400' :
                  item.level === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-teal-500/20 text-teal-400'
                }`}>{item.level}</span>
              )}
              <span className="text-[#94A3B8] leading-relaxed">{item.desc || item.risk}</span>
            </div>
          ))}
        </div>
      );
    }

    return <p className="text-xs text-[#94A3B8] leading-relaxed pt-1">{String(value)}</p>;
  };

  return (
    <div className="min-h-screen bg-[#05080D] text-[#F1F5F9]">
      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-[#27E6B5]/06 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[250px] bg-[#8B5CF6]/05 blur-[100px] rounded-full" />
      </div>

      {/* Top bar */}
      <header className="h-14 border-b border-slate-800/60 bg-[#080D16]/80 backdrop-blur-2xl px-6 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#94A3B8] transition-colors text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          New ThinkFlow
        </button>
        <div className="flex items-center gap-2">
          <ModeIcon className="w-3.5 h-3.5" style={{ color: '#27E6B5' }} />
          <span className="text-xs text-[#64748B]">{modeLabel}</span>
        </div>
        <button
          onClick={() => onCreateProject(query)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#20D9B0] to-[#159FB5] text-[#03110F] cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Zap className="w-3 h-3" />
          Build Full Plan
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12 relative z-10">
        {/* Query display */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#27E6B5]" />
            <span className="text-[10px] uppercase tracking-widest text-[#27E6B5] font-bold">Thinking Path</span>
          </div>
          <blockquote className="text-lg font-medium text-[#F1F5F9] leading-relaxed border-l-2 border-[#27E6B5]/40 pl-4">
            "{query}"
          </blockquote>
          <p className="text-xs text-[#64748B] mt-2 pl-4">
            Mode: <span className="capitalize text-[#94A3B8]">{modeLabel}</span>
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isRevealed = idx < revealedCount;
            const isExpanded = expandedSteps.has(step.key);
            const StepIcon = step.icon;

            return (
              <div
                key={step.key}
                className="rounded-2xl overflow-hidden transition-all duration-500"
                style={{
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed ? 'translateY(0)' : 'translateY(12px)',
                  transitionDelay: `${idx * 60}ms`,
                  background: 'rgba(12,18,32,0.78)',
                  border: '1px solid rgba(148,163,184,0.10)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Step header */}
                <button
                  onClick={() => toggleStep(step.key)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Step number + icon */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0"
                      style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                      <StepIcon className="w-4 h-4" style={{ color: step.color }} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#F1F5F9]">{step.label}</div>
                      <div className="text-[10px] text-[#64748B]">{step.desc}</div>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-[#64748B]" />
                    : <ChevronDown className="w-4 h-4 text-[#64748B]" />
                  }
                </button>

                {/* Step content */}
                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-slate-800/60">
                    {renderContent(step)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA after all steps revealed */}
        {revealedCount >= steps.length && (
          <div
            className="mt-8 rounded-2xl p-6 text-center"
            style={{
              background: 'rgba(39,230,181,0.05)',
              border: '1px solid rgba(39,230,181,0.15)',
            }}
          >
            <Sparkles className="w-6 h-6 mx-auto mb-3" style={{ color: '#27E6B5' }} />
            <h3 className="text-sm font-bold text-white mb-1">Ready to build the full plan?</h3>
            <p className="text-xs text-[#64748B] mb-4">
              Turn this thinking path into a complete project with tasks, timeline, risks, and a visual board.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => onCreateProject(query)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#20D9B0] to-[#159FB5] text-[#03110F] cursor-pointer hover:opacity-90 transition-opacity shadow-lg shadow-teal-500/25"
              >
                <Zap className="w-3.5 h-3.5" />
                Build Full Action Path
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium text-[#94A3B8] cursor-pointer hover:text-[#F1F5F9] transition-colors"
                style={{ border: '1px solid rgba(148,163,184,0.12)' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Explore Another Idea
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
