import React, { useEffect, useState } from 'react';
import { History, RotateCcw, Clock, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../services/api';
import { VersionItem } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ isOpen, onClose }) => {
  const { project, restoreVersion } = useProject();
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      setIsLoading(true);
      api.listVersions(project.id)
        .then(setVersions)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const handleRestore = async (vId: string) => {
    if (confirm('Restore plan to this version snapshot? Unsaved changes in the current view will be replaced.')) {
      await restoreVersion(vId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#0C1220]/95 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#080D16]/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#27E6B5]/15 border border-[#27E6B5]/30 text-[#27E6B5]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Project Version History</h3>
              <p className="text-xs text-slate-400">
                Snapshots captured automatically during AI generations, refinements, and major edits.
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
        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading snapshots...
            </div>
          ) : versions.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-6 bg-[#05080D]/40 rounded-xl border border-slate-800 text-center">
              No version history entries found yet.
            </p>
          ) : (
            versions.map((v, idx) => (
              <div
                key={v.id}
                className="p-4 bg-[#080D16]/90 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={idx === 0 ? 'teal' : 'neutral'} size="sm">
                      v{v.version_number}
                    </Badge>
                    <span className="text-xs font-bold text-white">{v.description}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(v.created_at).toLocaleString()}
                    </span>
                    <span>By: {v.created_by || 'AI System'}</span>
                  </div>
                </div>

                <Button
                  variant={idx === 0 ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => handleRestore(v.id)}
                  disabled={idx === 0}
                  className="text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  {idx === 0 ? 'Current' : 'Restore'}
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-[#080D16]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
