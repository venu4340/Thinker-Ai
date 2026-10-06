import React, { useState } from 'react';
import { ShieldAlert, Plus, Sparkles, Search, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';

export const RiskMatrixCenter: React.FC = () => {
  const { project, updateRisk, createRisk, deleteRisk, refinePlan, isAiGenerating } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New risk form
  const [newRisk, setNewRisk] = useState('');
  const [newProb, setNewProb] = useState(3);
  const [newImpact, setNewImpact] = useState(3);
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [newCause, setNewCause] = useState('');
  const [newMitigation, setNewMitigation] = useState('');
  const [newOwner, setNewOwner] = useState('');

  if (!project) return null;

  const handleAddRisk = async () => {
    if (!newRisk.trim()) return;
    await createRisk({
      risk: newRisk,
      probability: Number(newProb),
      impact: Number(newImpact),
      severity: newSeverity,
      cause: newCause,
      mitigation: newMitigation,
      owner: newOwner || 'Risk Manager',
    });
    setIsAddOpen(false);
    setNewRisk('');
    setNewCause('');
    setNewMitigation('');
  };

  const filteredRisks = project.risks.filter(
    (r) =>
      r.risk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.mitigation && r.mitigation.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Risk Intelligence & Matrix Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            5x5 Heatmap matrix, vulnerability register, and automated AI defensive mitigation protocols.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refinePlan('find_risks')}
            disabled={isAiGenerating}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#27E6B5]" />
            Find More Risks
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Risk
          </Button>
        </div>
      </div>

      {/* 5x5 Matrix & Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5x5 Heatmap */}
        <div className="lg:col-span-2 bg-[#0C1220]/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center justify-between">
            <span>5x5 Probability vs Impact Heatmap</span>
            <span className="text-[10px] text-slate-400">Higher top-right = Critical</span>
          </h3>

          <div className="relative">
            {/* Y axis label */}
            <div className="absolute -left-6 top-1/2 -rotate-90 text-[10px] font-bold text-slate-400 tracking-wider">
              IMPACT →
            </div>

            {/* Matrix Grid 5x5 (rows: impact 5 down to 1) */}
            <div className="space-y-1.5 pl-4">
              {[5, 4, 3, 2, 1].map((impactScore) => (
                <div key={impactScore} className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((probScore) => {
                    const cellRisks = project.risks.filter(
                      (r) => r.probability === probScore && r.impact === impactScore
                    );
                    const score = probScore * impactScore;
                    let bgColor = 'bg-[#05080D]/70 border-slate-800/80';
                    if (score >= 16) bgColor = 'bg-rose-950/40 border-rose-500/40 text-rose-300';
                    else if (score >= 10) bgColor = 'bg-amber-950/30 border-amber-500/30 text-amber-300';
                    else if (score >= 5) bgColor = 'bg-teal-950/25 border-teal-500/30 text-[#27E6B5]';

                    return (
                      <div
                        key={probScore}
                        className={`min-h-[52px] rounded-xl border p-1.5 flex flex-col justify-between transition-all ${bgColor}`}
                      >
                        <div className="flex items-center justify-between text-[10px] opacity-60 font-mono">
                          <span>P{probScore}</span>
                          <span>I{impactScore}</span>
                        </div>
                        {cellRisks.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {cellRisks.map((r, i) => (
                              <span
                                key={i}
                                title={r.risk}
                                className="w-2 h-2 rounded-full bg-current shadow-sm animate-pulse"
                              />
                            ))}
                            <span className="text-[10px] font-bold">
                              {cellRisks.length} {cellRisks.length === 1 ? 'risk' : 'risks'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* X axis label */}
            <div className="text-center text-[10px] font-bold text-slate-400 tracking-wider mt-2 pl-4">
              PROBABILITY (1 → 5)
            </div>
          </div>
        </div>

        {/* Risk Register Summary Cards */}
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30">
            <span className="text-xs font-bold text-rose-300 block mb-1">Critical & High Severity</span>
            <span className="text-2xl font-extrabold text-rose-400">
              {project.risks.filter((r) => r.severity === 'critical' || r.severity === 'high').length}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Require immediate architectural mitigation protocols.</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30">
            <span className="text-xs font-bold text-amber-300 block mb-1">Medium Severity</span>
            <span className="text-2xl font-extrabold text-amber-400">
              {project.risks.filter((r) => r.severity === 'medium').length}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Monitor during sprint execution cycles.</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0C1220]/80 border border-slate-800">
            <span className="text-xs font-bold text-[#27E6B5] block mb-1">Low Severity / Accepted</span>
            <span className="text-2xl font-extrabold text-[#27E6B5]">
              {project.risks.filter((r) => r.severity === 'low').length}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Standard operational considerations.</p>
          </div>
        </div>
      </div>

      {/* Risk Register Table */}
      <div className="bg-[#0C1220]/75 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-white">Full Risk Register & Mitigations</h3>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter risks or mitigations..."
              className="w-full bg-[#05080D] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#05080D]/80 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="p-3.5">Risk & Root Cause</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Score</th>
                <th className="p-3.5">Mitigation Strategy</th>
                <th className="p-3.5">Owner</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRisks.map((risk) => (
                <tr key={risk.id} className="hover:bg-[#101827] transition-colors">
                  <td className="p-3.5 max-w-xs">
                    <div className="font-semibold text-slate-200">{risk.risk}</div>
                    {risk.cause && (
                      <div className="text-[11px] text-slate-400 mt-0.5">Cause: {risk.cause}</div>
                    )}
                  </td>
                  <td className="p-3.5">
                    <Badge
                      variant={
                        risk.severity === 'critical' ? 'danger' : risk.severity === 'high' ? 'warning' : 'teal'
                      }
                      size="sm"
                    >
                      {risk.severity.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">
                    P{risk.probability} × I{risk.impact} = {risk.probability * risk.impact}
                  </td>
                  <td className="p-3.5 max-w-sm text-slate-300">
                    {risk.mitigation ? (
                      <div className="bg-[#05080D]/80 p-2 rounded-lg border border-slate-800 text-[11px]">
                        🛡️ {risk.mitigation}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">No mitigation defined</span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-300">{risk.owner || 'Unassigned'}</td>
                  <td className="p-3.5">
                    <select
                      value={risk.status}
                      onChange={(e) => updateRisk(risk.id, { status: e.target.value as any })}
                      className="bg-[#05080D] border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
                    >
                      <option value="identified">Identified</option>
                      <option value="mitigating">Mitigating</option>
                      <option value="resolved">Resolved</option>
                      <option value="accepted">Accepted</option>
                    </select>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => deleteRisk(risk.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Risk Modal */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Identified Project Risk"
        description="Catalog a potential bottleneck, market vulnerability, or technical risk."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Risk Description</label>
            <input
              type="text"
              value={newRisk}
              onChange={(e) => setNewRisk(e.target.value)}
              placeholder="e.g. Courier supply deficit during lunch rush"
              className="w-full bg-[#0C1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Probability (1-5)</label>
              <select
                value={newProb}
                onChange={(e) => setNewProb(Number(e.target.value))}
                className="w-full bg-[#0C1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} - {n === 5 ? 'Almost Certain' : n === 1 ? 'Rare' : 'Moderate'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Impact (1-5)</label>
              <select
                value={newImpact}
                onChange={(e) => setNewImpact(Number(e.target.value))}
                className="w-full bg-[#0C1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} - {n === 5 ? 'Catastrophic' : n === 1 ? 'Negligible' : 'Significant'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Severity</label>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as any)}
                className="w-full bg-[#0C1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Mitigation Protocol</label>
            <textarea
              rows={3}
              value={newMitigation}
              onChange={(e) => setNewMitigation(e.target.value)}
              placeholder="Actionable prevention or fallback plan..."
              className="w-full bg-[#0C1220] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddRisk}>
              Add Risk
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
