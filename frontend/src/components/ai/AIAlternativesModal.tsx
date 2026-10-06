import React, { useState } from 'react';
import { Compass, CheckCircle2, AlertTriangle, RefreshCw, X, Zap } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { AIApproachResponse } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AIAlternativesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAlternativesModal: React.FC<AIAlternativesModalProps> = ({ isOpen, onClose }) => {
  const { generate3Approaches, generateAIPlan, isAiGenerating } = useProject();
  const [data, setData] = useState<AIApproachResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchApproaches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await generate3Approaches();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate approaches');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !data && !isLoading) {
      handleFetchApproaches();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectApproach = async (approach: any) => {
    onClose();
    await generateAIPlan(
      `Adopt Strategy: "${approach.name}". Details: ${approach.tagline}. Stack: ${approach.architecture_overview}. Key phases: ${approach.key_phases.join(', ')}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-[#0C1220]/95 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#080D16]/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Multi-Approach Strategic Generator
              </h3>
              <p className="text-xs text-slate-400">
                Evaluate 3 distinct technical & business execution strategies with explicit trade-offs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#27E6B5] rounded-lg hover:bg-[#101827] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading && (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto text-purple-400 animate-spin" />
              <p className="text-sm font-semibold text-white">Synthesizing 3 distinct execution strategies...</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Comparing Speed MVP vs Low-Cost Bootstrapped vs Enterprise Scalable architectures.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {data && !isLoading && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#05080D]/80 border border-slate-800 p-4 rounded-2xl text-xs text-slate-300 flex items-center gap-2">
                <span className="font-bold text-[#27E6B5] shrink-0">Problem Core:</span>
                <span>{data.problem_statement}</span>
              </div>

              {/* 3 Columns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {data.approaches.map((app, idx) => (
                  <div
                    key={idx}
                    className="bg-[#080D16]/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-[#27E6B5]/40 transition-all shadow-md space-y-4"
                  >
                    <div className="space-y-3">
                      <div>
                        <Badge
                          variant={idx === 0 ? 'teal' : idx === 1 ? 'cyan' : 'purple'}
                          size="sm"
                        >
                          Option {idx + 1}
                        </Badge>
                        <h4 className="text-sm font-bold text-white mt-1.5">{app.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{app.tagline}</p>
                      </div>

                      {/* Specs */}
                      <div className="bg-[#0C1220] p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-500">Cost:</span>
                          <span className="font-semibold text-[#27E6B5]">{app.estimated_cost}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-500">Timeframe:</span>
                          <span className="font-semibold text-cyan-300">{app.estimated_time}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-500">Complexity:</span>
                          <span className="font-semibold capitalize text-slate-200">{app.complexity}</span>
                        </div>
                      </div>

                      {/* Architecture */}
                      <div className="text-xs text-slate-300">
                        <span className="font-semibold text-slate-200 block mb-1">Architecture:</span>
                        <p className="text-[11px] text-slate-400 bg-[#05080D] p-2.5 rounded-lg border border-slate-800">
                          {app.architecture_overview}
                        </p>
                      </div>

                      {/* Advantages */}
                      <div>
                        <span className="text-[11px] font-semibold text-[#27E6B5] block mb-1">Advantages:</span>
                        <ul className="space-y-1 text-[11px] text-slate-300">
                          {app.advantages.map((adv, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-[#27E6B5] shrink-0" />
                              <span>{adv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Disadvantages */}
                      <div>
                        <span className="text-[11px] font-semibold text-amber-400 block mb-1">Trade-offs:</span>
                        <ul className="space-y-1 text-[11px] text-slate-400">
                          {app.disadvantages.map((dis, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{dis}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Button
                      variant={idx === 0 ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleSelectApproach(app)}
                      disabled={isAiGenerating}
                      className="w-full text-xs font-semibold"
                    >
                      <Zap className="w-3.5 h-3.5 mr-1" />
                      Apply Strategy
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-[#080D16]">
          <Button variant="secondary" size="sm" onClick={handleFetchApproaches} disabled={isLoading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate Options
          </Button>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
