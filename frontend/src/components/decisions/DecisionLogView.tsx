import React, { useState } from 'react';
import { Scale, Plus, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';

export const DecisionLogView: React.FC = () => {
  const { project, createDecision, deleteDecision } = useProject();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [alternatives, setAlternatives] = useState('');
  const [impact, setImpact] = useState('');

  if (!project) return null;

  const handleAdd = async () => {
    if (!decision.trim() || !reason.trim()) return;
    await createDecision({
      decision,
      reason,
      alternatives_considered: alternatives.split(',').map((s) => s.trim()).filter(Boolean),
      impact,
      status: 'approved',
    });
    setIsAddOpen(false);
    setDecision('');
    setReason('');
    setAlternatives('');
    setImpact('');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#27E6B5]" />
            Architectural & Product Decision Log (ADR)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track key technical trade-offs, rationale, alternatives evaluated, and long-term implications.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Record Decision
        </Button>
      </div>

      <div className="space-y-4">
        {project.decisions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-[#0C1220]/40">
            <Scale className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No decisions recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">Document your technology and design choices to maintain engineering clarity.</p>
          </div>
        ) : (
          project.decisions.map((d) => (
            <div
              key={d.id}
              className="bg-[#0C1220]/80 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-[#27E6B5]/30 transition-colors shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="teal" size="sm">
                      {d.status.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(d.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{d.decision}</h3>
                </div>

                <button
                  onClick={() => deleteDecision(d.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-[#05080D]/70 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                <span className="font-semibold text-slate-200 block mb-1">💡 Rationale:</span>
                {d.reason}
              </div>

              {d.alternatives_considered && d.alternatives_considered.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Alternatives Evaluated:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {d.alternatives_considered.map((alt, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-[#05080D] text-slate-400 border border-slate-800 text-[11px]">
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {d.impact && (
                <div className="text-[11px] text-[#27E6B5]/90 pt-1">
                  ⚡ Impact: {d.impact}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Record Decision Modal */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Record Architectural Decision"
        description="Capture rationale and trade-offs for future team members and stakeholders."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Decision</label>
            <input
              type="text"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              placeholder="e.g. Use PostgreSQL + pgvector instead of MongoDB"
              className="w-full bg-[#0C1220] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Rationale & Why</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this approach is superior..."
              className="w-full bg-[#0C1220] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Alternatives Evaluated (comma-separated)</label>
            <input
              type="text"
              value={alternatives}
              onChange={(e) => setAlternatives(e.target.value)}
              placeholder="MongoDB, Pinecone, DynamoDB"
              className="w-full bg-[#0C1220] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Expected Impact</label>
            <input
              type="text"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              placeholder="e.g. Transactional consistency and zero cloud vector DB lock-in"
              className="w-full bg-[#0C1220] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAdd}>
              Save Decision
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
