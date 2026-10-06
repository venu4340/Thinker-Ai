import React, { useState } from 'react';
import { Download, FileText, Table, Code, Printer, Check, Copy, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../services/api';
import { Button } from '../ui/Button';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose }) => {
  const { project } = useProject();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !project) return null;

  const handleDownload = (format: 'markdown' | 'csv' | 'json' | 'html') => {
    const url = api.getExportUrl(project.id, format);
    window.open(url, '_blank');
  };

  const handleCopyMarkdown = async () => {
    try {
      const token = localStorage.getItem('thinkflow_token');
      const res = await fetch(`/api/v1/projects/${project.id}/export?format=markdown`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#0C1220]/95 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#080D16]/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#27E6B5]/15 border border-[#27E6B5]/30 text-[#27E6B5]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Project & Reports</h3>
              <p className="text-xs text-slate-400">
                Generate production artifacts for stakeholders, Jira, Notion, or executive briefing.
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

        {/* Options */}
        <div className="p-6 space-y-3">
          {/* Executive HTML / PDF */}
          <div
            onClick={() => handleDownload('html')}
            className="p-4 bg-[#080D16]/80 border border-slate-800 hover:border-[#27E6B5]/50 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] group shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#27E6B5]/15 text-[#27E6B5] border border-[#27E6B5]/30 group-hover:bg-[#27E6B5] group-hover:text-[#03110F] transition-colors">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Executive Report (PDF / Print)</h4>
                <p className="text-xs text-slate-400">Formatted executive summary, roadmap, and risk matrix.</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-[#27E6B5]" />
          </div>

          {/* Markdown Report */}
          <div
            onClick={() => handleDownload('markdown')}
            className="p-4 bg-[#080D16]/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] group shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Markdown Documentation (.md)</h4>
                <p className="text-xs text-slate-400">Notion, GitHub README, and Obsidian ready.</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
          </div>

          {/* CSV Tasks */}
          <div
            onClick={() => handleDownload('csv')}
            className="p-4 bg-[#080D16]/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] group shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Tasks Spreadsheet (.csv)</h4>
                <p className="text-xs text-slate-400">Compatible with Jira, Linear, Asana, and Excel.</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
          </div>

          {/* Raw JSON */}
          <div
            onClick={() => handleDownload('json')}
            className="p-4 bg-[#080D16]/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] group shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Full State Graph (.json)</h4>
                <p className="text-xs text-slate-400">Complete raw schema and node graph payload.</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-[#080D16]">
          <Button variant="secondary" size="sm" onClick={handleCopyMarkdown}>
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-[#27E6B5]" />
                Copied Markdown!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy Markdown
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
