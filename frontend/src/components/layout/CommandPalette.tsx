import React, { useState, useEffect, useRef } from 'react';
import { Search, LayoutGrid, Calendar, ShieldAlert, CheckSquare, Scale, Sparkles } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChallengeModal: () => void;
  onOpenApproachesModal: () => void;
  onOpenDocModal: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenChallengeModal,
  onOpenApproachesModal,
  onOpenDocModal,
}) => {
  const { project, setActiveView, setSelectedNode } = useProject();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : {};
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  // Build searchable items
  const items: Array<{
    id: string;
    title: string;
    subtitle: string;
    category: 'Task' | 'Phase' | 'Risk' | 'Decision' | 'Action';
    icon: any;
    action: () => void;
  }> = [];

  // Actions
  items.push(
    {
      id: 'act-challenge',
      title: 'Challenge This Plan (Red-Team Critique)',
      subtitle: 'Identify blind spots, unrealistic assumptions and failure points',
      category: 'Action',
      icon: ShieldAlert,
      action: () => { onOpenChallengeModal(); onClose(); },
    },
    {
      id: 'act-approaches',
      title: 'Generate 3 Strategic Approaches',
      subtitle: 'Evaluate Speed MVP vs Low-Cost Bootstrapped vs Enterprise Scalable',
      category: 'Action',
      icon: Sparkles,
      action: () => { onOpenApproachesModal(); onClose(); },
    },
    {
      id: 'act-docs',
      title: 'Upload Requirements Document / PDF for RAG',
      subtitle: 'Extract structured plan directly from documentation',
      category: 'Action',
      icon: Search,
      action: () => { onOpenDocModal(); onClose(); },
    },
    {
      id: 'act-view-canvas',
      title: 'Switch to Visual Thinking Board Canvas',
      subtitle: 'Interactive React Flow node graph',
      category: 'Action',
      icon: LayoutGrid,
      action: () => { setActiveView('canvas'); onClose(); },
    },
    {
      id: 'act-view-timeline',
      title: 'Switch to Timeline & Gantt View',
      subtitle: 'Phase schedules and task durations',
      category: 'Action',
      icon: Calendar,
      action: () => { setActiveView('timeline'); onClose(); },
    },
    {
      id: 'act-view-risks',
      title: 'Switch to 5x5 Risk Matrix Center',
      subtitle: 'Probability vs Impact heat register',
      category: 'Action',
      icon: ShieldAlert,
      action: () => { setActiveView('risks'); onClose(); },
    }
  );

  // Phases
  project.phases.forEach((p) => {
    items.push({
      id: `phase-${p.id}`,
      title: p.title,
      subtitle: `${p.tasks.length} tasks | Status: ${p.status}`,
      category: 'Phase',
      icon: LayoutGrid,
      action: () => {
        setActiveView('canvas');
        setSelectedNode({ id: p.id, type: 'phaseNode', data: p });
        onClose();
      },
    });
  });

  // Tasks
  project.tasks.forEach((t) => {
    items.push({
      id: `task-${t.id}`,
      title: t.title,
      subtitle: `Priority: ${t.priority.toUpperCase()} | ${t.estimated_hours}h | Status: ${t.status}`,
      category: 'Task',
      icon: CheckSquare,
      action: () => {
        setActiveView('canvas');
        setSelectedNode({ id: t.id, type: 'taskNode', data: t });
        onClose();
      },
    });
  });

  // Risks
  project.risks.forEach((r) => {
    items.push({
      id: `risk-${r.id}`,
      title: r.risk,
      subtitle: `Severity: ${r.severity.toUpperCase()} | Prob: ${r.probability}/5 | Imp: ${r.impact}/5`,
      category: 'Risk',
      icon: ShieldAlert,
      action: () => {
        setActiveView('risks');
        onClose();
      },
    });
  });

  // Decisions
  project.decisions.forEach((d) => {
    items.push({
      id: `dec-${d.id}`,
      title: d.decision,
      subtitle: d.reason,
      category: 'Decision',
      icon: Scale,
      action: () => {
        setActiveView('decisions');
        onClose();
      },
    });
  });

  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#0C1220]/95 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-10">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-[#27E6B5] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKey}
            placeholder="Type a command, task, phase, risk, or action..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-sm focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] bg-[#05080D] text-slate-400 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching results found for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#27E6B5]/15 border border-[#27E6B5]/30 text-white' : 'text-slate-300 hover:bg-[#101827]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#27E6B5] text-[#03110F]' : 'bg-[#05080D] text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#05080D] text-[#27E6B5] uppercase font-mono tracking-wider ml-2 shrink-0 border border-slate-800">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[#080D16] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-[#27E6B5] font-medium">{filtered.length} results</span>
        </div>
      </div>
    </div>
  );
};
