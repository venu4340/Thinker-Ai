import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass, Target, Search, ChevronDown, Sparkles, ArrowRight,
  Zap, Lightbulb, Wrench, Rocket
} from 'lucide-react';

export type FlowMode = 'explore' | 'plan' | 'search' | 'auto';

interface Props {
  onSubmit: (query: string, mode: FlowMode, model: string) => void;
  isLoading?: boolean;
}

const PLACEHOLDERS = [
  'Describe an idea you want to explore...',
  'What are you trying to achieve?',
  'Turn your goal into a roadmap...',
  'Describe a problem you want to solve...',
  'Explore your next big idea...',
  'What would you build if you had 6 months?',
  'What challenge is worth solving today?',
];

const SUGGESTIONS = [
  { icon: Rocket, label: 'Turn an idea into a startup', query: 'I have an idea for a startup and need to turn it into a real plan' },
  { icon: Target, label: 'Build a learning roadmap', query: 'I want to become a full-stack developer in 6 months' },
  { icon: Lightbulb, label: 'Explore a new business idea', query: 'I have an idea for a new business and want to explore its potential' },
  { icon: Wrench, label: 'Solve a complex problem', query: 'I need help breaking down a complex technical problem into steps' },
];

const MODELS = [
  { id: 'gemini', label: 'Gemini', icon: 'star' },
];

const MODES = [
  { id: 'explore' as FlowMode, label: 'Explore', desc: 'Map an idea' },
  { id: 'plan' as FlowMode, label: 'Plan', desc: 'Build a roadmap' },
  { id: 'search' as FlowMode, label: 'Search', desc: 'Find insights' },
];

function detectMode(query: string): FlowMode {
  const q = query.toLowerCase();
  const planKeywords = ['want to', 'become', 'learn', 'build', 'start', 'launch', 'create', 'develop', 'goal', 'achieve', 'plan'];
  const searchKeywords = ['what is', 'how does', 'explain', 'definition', 'latest', 'best', 'top', 'compare', 'vs', '?'];
  const exploreKeywords = ['idea', 'could', 'might', 'explore', 'concept', 'what if', 'imagine', 'thinking about', 'potential'];
  if (planKeywords.some(k => q.includes(k))) return 'plan';
  if (searchKeywords.some(k => q.includes(k))) return 'search';
  if (exploreKeywords.some(k => q.includes(k))) return 'explore';
  return 'auto';
}

export const ThinkFlowSearch: React.FC<Props> = ({ onSubmit, isLoading = false }) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<FlowMode>('auto');
  const [detectedMode, setDetectedMode] = useState<FlowMode>('auto');
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [modelDropOpen, setModelDropOpen] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query || isFocused) return;
    const timer = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [query, isFocused]);

  useEffect(() => {
    if (query.length > 8) setDetectedMode(detectMode(query));
    else setDetectedMode('auto');
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelDropRef.current && !modelDropRef.current.contains(e.target as Node)) {
        setModelDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;
    const finalMode = mode !== 'auto' ? mode : (detectedMode !== 'auto' ? detectedMode : 'explore');
    onSubmit(trimmed, finalMode, selectedModel);
  }, [query, mode, detectedMode, selectedModel, onSubmit, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleSuggestion = (s: typeof SUGGESTIONS[0]) => {
    setQuery(s.query);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  };

  const activeMode = mode !== 'auto' ? mode : detectedMode;
  const currentModel = MODELS.find(m => m.id === selectedModel)!;

  const modeIcon = (id: string) => {
    if (id === 'explore') return <Compass className="w-3.5 h-3.5" />;
    if (id === 'plan') return <Target className="w-3.5 h-3.5" />;
    return <Search className="w-3.5 h-3.5" />;
  };

  const modelIcon = (icon: string) => {
    if (icon === 'lightning') return '⚡';
    if (icon === 'star') return '✦';
    return '◇';
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-5">
      <div
        className="relative rounded-2xl transition-all duration-300"
        style={{
          background: 'rgba(12,18,32,0.88)',
          border: isFocused ? '1px solid rgba(39,230,181,0.35)' : '1px solid rgba(148,163,184,0.12)',
          backdropFilter: 'blur(20px)',
          boxShadow: isFocused
            ? '0 0 0 1px rgba(39,230,181,0.15), 0 20px 60px rgba(0,0,0,0.4), 0 0 60px rgba(39,230,181,0.06)'
            : '0 20px 60px rgba(0,0,0,0.35)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          rows={2}
          disabled={isLoading}
          className="w-full bg-transparent text-[#F1F5F9] placeholder-[#475569] text-[15px] leading-relaxed resize-none outline-none px-5 pt-5 pb-3 font-medium rounded-t-2xl"
          style={{ minHeight: '72px', maxHeight: '180px' }}
        />

        <div className="flex items-center justify-between px-4 pb-3 pt-1 gap-3 flex-wrap border-t border-slate-800/60">
          <div className="flex items-center gap-1">
            {MODES.map(m => {
              const isManual = mode === m.id;
              const isAutoHinted = mode === 'auto' && detectedMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(prev => prev === m.id ? 'auto' : m.id)}
                  title={m.desc}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isManual
                      ? 'bg-[#27E6B5]/15 text-[#27E6B5] border border-[#27E6B5]/30'
                      : isAutoHinted
                      ? 'bg-[#27E6B5]/08 text-[#27E6B5]/60 border border-[#27E6B5]/12'
                      : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {modeIcon(m.id)}
                  <span>{m.label}</span>
                  {isAutoHinted && !isManual && (
                    <span className="text-[9px] opacity-60">auto</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleSubmit}
              disabled={!query.trim() || isLoading}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                query.trim() && !isLoading
                  ? 'bg-gradient-to-r from-[#20D9B0] to-[#159FB5] text-[#03110F] shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.03] active:scale-95'
                  : 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <><div className="w-3.5 h-3.5 rounded-full border-2 border-[#03110F]/30 border-t-[#03110F] animate-spin" /><span className="text-xs">Thinking…</span></>
              ) : (
                <><Zap className="w-3.5 h-3.5" /><span className="text-xs">Flow</span><ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </div>

        {detectedMode !== 'auto' && mode === 'auto' && query.length > 8 && (
          <div className="px-5 pb-2.5 -mt-0.5">
            <span className="text-[10px] text-[#27E6B5]/40 tracking-wide">
              ✦ Detected intent: <span className="text-[#27E6B5]/60 font-medium capitalize">{detectedMode}</span> — press Enter or set mode above
            </span>
          </div>
        )}
      </div>

      {!query && (
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => handleSuggestion(s)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-[#64748B] hover:text-[#94A3B8] transition-all duration-200 hover:bg-white/5 cursor-pointer group"
              style={{ border: '1px solid rgba(148,163,184,0.08)' }}
            >
              <s.icon className="w-3.5 h-3.5 text-[#27E6B5]/40 group-hover:text-[#27E6B5]/70 transition-colors" />
              {s.label}
            </button>
          ))}
        </div>
      )}

      {!query && (
        <p className="text-center text-[11px] text-[#334155]">
          Press{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/60 text-slate-400 text-[10px] font-mono">Enter</kbd>
          {' '}to flow  ·  <kbd className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/60 text-slate-400 text-[10px] font-mono">Shift+Enter</kbd> for new line
        </p>
      )}
    </div>
  );
};
