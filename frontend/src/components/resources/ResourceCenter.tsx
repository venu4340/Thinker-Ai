import React from 'react';
import { Users, Server, Wrench, Cpu } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Badge } from '../ui/Badge';

export const ResourceCenter: React.FC = () => {
  const { project } = useProject();

  if (!project) return null;

  // Aggregate all required skills from tasks
  const allSkills = Array.from(
    new Set(project.tasks.flatMap((t) => t.skills_required || []))
  );

  const humanResources = project.resources.filter((r) => r.type === 'human');
  const toolResources = project.resources.filter((r) => r.type === 'tool' || r.type === 'cloud');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-800/80">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-[#27E6B5]" />
          Resource Allocation & Stack Architecture
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Required team competencies, software tools, cloud services, and budget allocations.
        </p>
      </div>

      {/* Skills Matrix Cloud */}
      <div className="bg-[#0C1220]/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#27E6B5] flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          Required Skills & Competencies
        </h3>
        <p className="text-xs text-slate-400">
          The following technical skills and capabilities are required across project phases:
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {allSkills.length === 0 ? (
            <span className="text-xs text-slate-500 italic">No explicit skills generated yet</span>
          ) : (
            allSkills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-[#27E6B5]/10 border border-[#27E6B5]/25 text-xs font-medium text-[#27E6B5] shadow-sm"
              >
                ⚡ {skill}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Team & Cloud Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Human Team Members */}
        <div className="bg-[#0C1220]/75 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Human Capital & Team Roles
          </h3>
          <div className="space-y-2.5">
            {humanResources.length === 0 ? (
              <div className="text-xs text-slate-400 p-4 bg-[#05080D]/70 rounded-xl border border-slate-800">
                Team size: {project.team_size || 'Full-stack engineering squad'}
              </div>
            ) : (
              humanResources.map((res) => (
                <div
                  key={res.id}
                  className="p-3 bg-[#05080D]/80 rounded-xl border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                      {res.name[0]}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">{res.name}</span>
                      <span className="text-[10px] text-slate-400">Allocation: {res.allocation || '100%'}</span>
                    </div>
                  </div>
                  {res.cost && (
                    <Badge variant="neutral" size="sm">
                      {res.cost}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tools & Infrastructure */}
        <div className="bg-[#0C1220]/75 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Server className="w-4 h-4 text-[#19C7D9]" />
            Cloud, Hosting & Software Tooling
          </h3>
          <div className="space-y-2.5">
            {toolResources.length === 0 ? (
              <div className="text-xs text-slate-400 p-4 bg-[#05080D]/70 rounded-xl border border-slate-800">
                Stack: {project.tech_stack || 'PostgreSQL, FastAPI, React, Docker'}
              </div>
            ) : (
              toolResources.map((res) => (
                <div
                  key={res.id}
                  className="p-3 bg-[#05080D]/80 rounded-xl border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-[#19C7D9] font-bold text-xs flex items-center justify-center border border-cyan-500/30">
                      <Wrench className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">{res.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{res.type}</span>
                    </div>
                  </div>
                  {res.cost && (
                    <span className="text-xs text-slate-300 font-mono">
                      {res.cost}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
