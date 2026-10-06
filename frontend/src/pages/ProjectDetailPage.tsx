import React, { useEffect, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { FlowCanvas } from '../components/canvas/FlowCanvas';
import { GanttTimeline } from '../components/timeline/GanttTimeline';
import { RiskMatrixCenter } from '../components/risks/RiskMatrixCenter';
import { TaskKanbanBoard } from '../components/tasks/TaskKanbanBoard';
import { DecisionLogView } from '../components/decisions/DecisionLogView';
import { ResourceCenter } from '../components/resources/ResourceCenter';

import { AIChallengeModal } from '../components/ai/AIChallengeModal';
import { AIAlternativesModal } from '../components/ai/AIAlternativesModal';
import { DocumentUploaderModal } from '../components/documents/DocumentUploaderModal';
import { VersionHistoryModal } from '../components/versions/VersionHistoryModal';
import { ExportReportModal } from '../components/export/ExportReportModal';
import { CommandPalette } from '../components/layout/CommandPalette';
import { GenerationProgressModal } from '../components/ai/GenerationProgressModal';
import { FloatingAIAssistant } from '../components/ai/FloatingAIAssistant';
import { Dialog } from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';

export const ProjectDetailPage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { project, loadProject, activeView, isLoading, generateAIPlan, isAiGenerating } = useProject();

  // Modals state
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDocOpen, setIsDocOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [isApproachesOpen, setIsApproachesOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateInstructions, setGenerateInstructions] = useState('');

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId, loadProject]);

  const handleTriggerGenerate = async () => {
    setIsGenerateOpen(false);
    await generateAIPlan(generateInstructions);
    setGenerateInstructions('');
  };

  if (isLoading && !project) {
    return (
      <div className="min-h-screen bg-[#05080D] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-[#27E6B5] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-[#27E6B5]">Loading Thinking Board...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#05080D] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Project Not Found</h2>
        <p className="text-xs text-slate-400">The requested board could not be found or you do not have permission to view it.</p>
        <a href="/dashboard">
          <Button variant="primary" size="sm">Return to Dashboard</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05080D] text-[#F1F5F9] flex flex-col overflow-hidden">
      {/* Navbar */}
      <Navbar
        onOpenCommandPalette={() => setIsCommandOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenDocModal={() => setIsDocOpen(true)}
        onOpenVersionsModal={() => setIsVersionsOpen(true)}
        onOpenChallengeModal={() => setIsChallengeOpen(true)}
        onOpenApproachesModal={() => setIsApproachesOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          onOpenDocModal={() => setIsDocOpen(true)}
          onOpenVersionsModal={() => setIsVersionsOpen(true)}
          onOpenChallengeModal={() => setIsChallengeOpen(true)}
          onOpenApproachesModal={() => setIsApproachesOpen(true)}
          onGeneratePlanModal={() => setIsGenerateOpen(true)}
        />

        {/* View Surface */}
        <main className="flex-1 overflow-y-auto relative bg-[#070B12]">
          {activeView === 'canvas' && <FlowCanvas />}
          {activeView === 'timeline' && <GanttTimeline />}
          {activeView === 'risks' && <RiskMatrixCenter />}
          {activeView === 'tasks' && <TaskKanbanBoard />}
          {activeView === 'decisions' && <DecisionLogView />}
          {activeView === 'resources' && <ResourceCenter />}
        </main>
      </div>

      {/* Floating AI Assistant Chat */}
      <FloatingAIAssistant />

      {/* Modals */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onOpenChallengeModal={() => setIsChallengeOpen(true)}
        onOpenApproachesModal={() => setIsApproachesOpen(true)}
        onOpenDocModal={() => setIsDocOpen(true)}
      />

      <AIChallengeModal
        isOpen={isChallengeOpen}
        onClose={() => setIsChallengeOpen(false)}
      />

      <AIAlternativesModal
        isOpen={isApproachesOpen}
        onClose={() => setIsApproachesOpen(false)}
      />

      <DocumentUploaderModal
        isOpen={isDocOpen}
        onClose={() => setIsDocOpen(false)}
      />

      <VersionHistoryModal
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
      />

      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <GenerationProgressModal />

      {/* Regenerate / Customize AI Plan Modal */}
      <Dialog
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="Generate / Refine AI Plan"
        description="Provide optional custom parameters or focus areas to tailor the synthesized execution board."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Custom Focus / Specific Architecture Guidelines (Optional)
            </label>
            <textarea
              rows={4}
              value={generateInstructions}
              onChange={(e) => setGenerateInstructions(e.target.value)}
              placeholder="e.g. Focus heavily on security audits, zero-trust auth, and multi-tenant billing isolation."
              className="w-full bg-[#0C1220] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsGenerateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleTriggerGenerate}
              disabled={isAiGenerating}
            >
              Start AI Generation
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
