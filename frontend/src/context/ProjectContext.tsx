import React, { createContext, useContext, useState, useCallback } from 'react';
import { ProjectDetail, Task, Risk, Decision, AIChallengeResponse, AIApproachResponse, AINodeAdviceResponse } from '../types';
import { api } from '../services/api';

type ActiveView = 'canvas' | 'timeline' | 'risks' | 'tasks' | 'decisions' | 'resources' | 'analytics';

interface ProjectContextType {
  project: ProjectDetail | null;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedNode: any | null;
  setSelectedNode: (node: any | null) => void;
  isLoading: boolean;
  isAiGenerating: boolean;
  aiGenerationStep: string;
  error: string | null;
  loadProject: (projectId: string) => Promise<void>;
  updateProjectMeta: (data: Partial<ProjectDetail>) => Promise<void>;
  generateAIPlan: (customInstructions?: string, provider?: string) => Promise<void>;
  refinePlan: (refinementType: string, instructions?: string) => Promise<void>;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateRisk: (riskId: string, data: Partial<Risk>) => Promise<void>;
  createRisk: (risk: Partial<Risk>) => Promise<void>;
  deleteRisk: (riskId: string) => Promise<void>;
  createDecision: (decision: Partial<Decision>) => Promise<void>;
  deleteDecision: (decisionId: string) => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  challengePlan: () => Promise<AIChallengeResponse>;
  generate3Approaches: () => Promise<AIApproachResponse>;
  askNodeAdvice: (nodeId: string, nodeType: string, nodeData: any, question: string) => Promise<AINodeAdviceResponse>;
  restoreVersion: (versionId: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('canvas');
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiGenerationStep, setAiGenerationStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getProject(projectId);
      setProject(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProjectMeta = async (data: Partial<ProjectDetail>) => {
    if (!project) return;
    try {
      const updated = await api.updateProject(project.id, data);
      setProject(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const generateAIPlan = async (customInstructions?: string, provider?: string) => {
    if (!project) return;
    setIsAiGenerating(true);
    setAiGenerationStep('Analyzing problem space & constraints...');
    
    // Smooth progress status feedback
    const steps = [
      'Understanding objectives & scope...',
      'Deconstructing problem into phases...',
      'Generating actionable tasks & deliverables...',
      'Mapping critical dependencies...',
      'Analyzing potential risks & mitigations...',
      'Optimizing timeline & scheduling...',
      'Validating structured schemas...',
      'Rendering visual thinking board...'
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setAiGenerationStep(steps[stepIdx]);
        stepIdx++;
      }
    }, 450);

    try {
      const updated = await api.generateAIPlan(project.id, customInstructions, provider);
      setProject(updated);
    } catch (err: any) {
      setError(err.message || 'AI Plan generation failed');
    } finally {
      clearInterval(interval);
      setIsAiGenerating(false);
      setAiGenerationStep('');
    }
  };

  const refinePlan = async (refinementType: string, instructions?: string) => {
    if (!project) return;
    setIsAiGenerating(true);
    setAiGenerationStep(`Refining plan (${refinementType.replace('_', ' ')})...`);
    try {
      const updated = await api.refinePlan(project.id, refinementType, instructions);
      setProject(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const updateTask = async (taskId: string, data: Partial<Task>) => {
    if (!project) return;
    try {
      await api.updateTask(project.id, taskId, data);
      // Optimistic/fresh reload
      const updated = await api.getProject(project.id);
      setProject(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const createTask = async (task: Partial<Task>) => {
    if (!project) return;
    try {
      await api.createTask(project.id, task);
      const updated = await api.getProject(project.id);
      setProject(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!project) return;
    try {
      await api.deleteTask(project.id, taskId);
      const updated = await api.getProject(project.id);
      setProject(updated);
      if (selectedNode?.id === taskId) {
        setSelectedNode(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateRisk = async (riskId: string, data: Partial<Risk>) => {
    if (!project) return;
    try {
      await api.updateRisk(project.id, riskId, data);
      const updated = await api.getProject(project.id);
      setProject(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const createRisk = async (risk: Partial<Risk>) => {
    if (!project) return;
    try {
      await api.createRisk(project.id, risk);
      const updated = await api.getProject(project.id);
      setProject(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteRisk = async (riskId: string) => {
    if (!project) return;
    try {
      await api.deleteRisk(project.id, riskId);
      const updated = await api.getProject(project.id);
      setProject(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const createDecision = async (decision: Partial<Decision>) => {
    if (!project) return;
    try {
      await api.createDecision(project.id, decision);
      const updated = await api.getProject(project.id);
      setProject(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteDecision = async (decisionId: string) => {
    if (!project) return;
    try {
      await api.deleteDecision(project.id, decisionId);
      const updated = await api.getProject(project.id);
      setProject(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const uploadDocument = async (file: File) => {
    if (!project) return;
    try {
      await api.uploadDocument(project.id, file);
      const updated = await api.getProject(project.id);
      setProject(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteDocument = async (docId: string) => {
    if (!project) return;
    try {
      await api.deleteDocument(project.id, docId);
      const updated = await api.getProject(project.id);
      setProject(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const challengePlan = async (): Promise<AIChallengeResponse> => {
    if (!project) throw new Error('No active project');
    return api.challengePlan(project.id);
  };

  const generate3Approaches = async (): Promise<AIApproachResponse> => {
    if (!project) throw new Error('No active project');
    return api.generate3Approaches(project.id);
  };

  const askNodeAdvice = async (nodeId: string, nodeType: string, nodeData: any, question: string): Promise<AINodeAdviceResponse> => {
    if (!project) throw new Error('No active project');
    return api.askNodeAdvice(project.id, nodeId, nodeType, nodeData, question);
  };

  const restoreVersion = async (versionId: string) => {
    if (!project) return;
    try {
      const updated = await api.restoreVersion(project.id, versionId);
      setProject(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        project,
        activeView,
        setActiveView,
        selectedNode,
        setSelectedNode,
        isLoading,
        isAiGenerating,
        aiGenerationStep,
        error,
        loadProject,
        updateProjectMeta,
        generateAIPlan,
        refinePlan,
        updateTask,
        createTask,
        deleteTask,
        updateRisk,
        createRisk,
        deleteRisk,
        createDecision,
        deleteDecision,
        uploadDocument,
        deleteDocument,
        challengePlan,
        generate3Approaches,
        askNodeAdvice,
        restoreVersion,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
