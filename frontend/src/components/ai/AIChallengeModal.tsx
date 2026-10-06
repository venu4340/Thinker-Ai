import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { AIChallengeResponse } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AIChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChallengeModal: React.FC<AIChallengeModalProps> = ({ isOpen, onClose }) => {
  const { challengePlan } = useProject();
  const [data, setData] = useState<AIChallengeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunChallenge = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await challengePlan();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze plan');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !data && !isLoading) {
      handleRunChallenge();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-[#0C1220]/95 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#080D16]/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Critical Plan Review & Red-Team Audit
              </h3>
              <p className="text-xs text-slate-400">
                Adversarial AI analysis exposing hidden bottlenecks, unrealistic assumptions, and blind spots.
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
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto text-[#27E6B5] animate-spin" />
              <p className="text-sm font-semibold text-white">Auditing plan assumptions & dependencies...</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Running stress-testing simulation across technical architecture, timeline margins, and resource constraints.
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
              {/* Overall Assessment Banner */}
              <div className="bg-[#05080D]/80 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Executive Audit Verdict
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed max-w-xl">
                    {data.overall_critique}
                  </p>
                </div>

                <div className="text-center bg-[#0C1220] p-4 rounded-xl border border-slate-800 min-w-[140px]">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">
                    Feasibility Score
                  </span>
                  <span className={`text-3xl font-extrabold ${data.confidence_score > 75 ? 'text-[#27E6B5]' : 'text-amber-400'}`}>
                    {data.confidence_score}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Confidence</span>
                </div>
              </div>

              {/* Challenges List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Critical Challenges Identified ({data.challenges.length})
                </h4>

                <div className="space-y-3">
                  {data.challenges.map((c, idx) => (
                    <div
                      key={idx}
                      className="bg-[#080D16]/80 border border-slate-800/80 rounded-2xl p-4.5 space-y-2.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#101827] text-slate-300 text-[11px] font-semibold border border-slate-700">
                            {c.category}
                          </span>
                          <Badge
                            variant={
                              c.severity === 'critical' ? 'danger' : c.severity === 'high' ? 'warning' : 'teal'
                            }
                            size="sm"
                          >
                            {c.severity.toUpperCase()} SEVERITY
                          </Badge>
                        </div>
                      </div>

                      <h5 className="text-sm font-bold text-white">{c.issue}</h5>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-slate-200">Why it matters:</strong> {c.why_it_matters}
                      </p>

                      {c.evidence_or_reasoning && (
                        <div className="text-[11px] text-slate-400 bg-[#0C1220]/80 p-2.5 rounded-xl border border-slate-800">
                          <strong>Evidence from plan:</strong> {c.evidence_or_reasoning}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-xs text-[#27E6B5] bg-[#27E6B5]/10 p-2.5 rounded-xl border border-[#27E6B5]/25">
                        <ShieldCheck className="w-4 h-4 text-[#27E6B5] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-emerald-200">Suggested Action / Mitigation:</strong>
                          <p className="mt-0.5 text-emerald-300/90">{c.suggested_mitigation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-[#080D16]">
          <Button variant="secondary" size="sm" onClick={handleRunChallenge} disabled={isLoading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Re-run Audit
          </Button>

          <Button variant="primary" size="sm" onClick={onClose}>
            Done Reviewing
          </Button>
        </div>
      </div>
    </div>
  );
};
