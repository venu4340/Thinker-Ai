import React, { useState } from 'react';
import { 
  X, Sparkles, Trash2, Clock, User, 
  AlertTriangle, CheckCircle2, Send, RefreshCw
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AINodeAdviceResponse } from '../../types';

export const NodeDetailDrawer: React.FC = () => {
  const { project, selectedNode, setSelectedNode, updateTask, deleteTask, askNodeAdvice } = useProject();
  
  const [activeTab, setActiveTab] = useState<'details' | 'ask_ai'>('details');
  const [customQuestion, setCustomQuestion] = useState('');
  const [aiAdvice, setAiAdvice] = useState<AINodeAdviceResponse | null>(null);
  const [isAskingAi, setIsAskingAi] = useState(false);

  // Edit form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [hours, setHours] = useState(4);
  const [owner, setOwner] = useState('');

  React.useEffect(() => {
    if (selectedNode?.data) {
      setTitle(selectedNode.data.title || selectedNode.data.risk || selectedNode.data.decision || '');
      setDescription(selectedNode.data.description || selectedNode.data.reason || selectedNode.data.cause || '');
      setPriority(selectedNode.data.priority || selectedNode.data.severity || 'medium');
      setStatus(selectedNode.data.status || 'todo');
      setHours(selectedNode.data.estimated_hours || 4);
      setOwner(selectedNode.data.owner || '');
      setAiAdvice(null);
    }
  }, [selectedNode]);

  if (!selectedNode || !project) return null;

  const nodeType = selectedNode.type || 'taskNode';
  const isTask = nodeType === 'taskNode';

  const handleSave = async () => {
    if (isTask) {
      await updateTask(selectedNode.id, {
        title,
        description,
        priority: priority as any,
        status: status as any,
        estimated_hours: Number(hours),
        owner,
      });
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this node?')) {
      if (isTask) {
        await deleteTask(selectedNode.id);
      }
      setSelectedNode(null);
    }
  };

  const handleAskQuickPrompt = async (prompt: string) => {
    setCustomQuestion(prompt);
    setIsAskingAi(true);
    try {
      const res = await askNodeAdvice(selectedNode.id, nodeType, selectedNode.data, prompt);
      setAiAdvice(res);
      setActiveTab('ask_ai');
    } finally {
      setIsAskingAi(false);
    }
  };

  const handleAskCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    setIsAskingAi(true);
    try {
      const res = await askNodeAdvice(selectedNode.id, nodeType, selectedNode.data, customQuestion);
      setAiAdvice(res);
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <div className="fixed top-16 right-0 w-full sm:w-[460px] h-[calc(100vh-4rem)] bg-[#080D16]/98 border-l border-slate-800/80 backdrop-blur-2xl shadow-2xl z-30 flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="teal" size="sm" className="capitalize">
              {nodeType.replace('Node', '')} Specs
            </Badge>
            {isTask && (
              <Badge variant={status === 'done' ? 'success' : 'neutral'} size="sm">
                {status.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="p-1.5 text-slate-400 hover:text-[#27E6B5] rounded-lg hover:bg-[#101827] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800/80 bg-[#05080D]/60 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'details' ? 'bg-[#101827] text-white border border-slate-700/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Attributes & Specs
          </button>
          <button
            onClick={() => setActiveTab('ask_ai')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'ask_ai' ? 'bg-[#27E6B5]/15 text-[#27E6B5] border border-[#27E6B5]/30' : 'text-slate-400 hover:text-[#27E6B5]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#27E6B5]" />
            Ask Node AI
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeTab === 'details' ? (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                className="w-full bg-[#0C1220] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#27E6B5]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Description & Scope</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSave}
                className="w-full bg-[#0C1220] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-[#27E6B5]"
              />
            </div>

            {isTask && (
              <>
                {/* Status & Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                    <select
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        updateTask(selectedNode.id, { status: e.target.value as any });
                      }}
                      className="w-full bg-[#0C1220] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">In Review</option>
                      <option value="done">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => {
                        setPriority(e.target.value);
                        updateTask(selectedNode.id, { priority: e.target.value as any });
                      }}
                      className="w-full bg-[#0C1220] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Hours & Owner */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Estimated Hours</label>
                    <input
                      type="number"
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                      onBlur={handleSave}
                      className="w-full bg-[#0C1220] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Owner / Assignee</label>
                    <input
                      type="text"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      onBlur={handleSave}
                      placeholder="e.g. Lead Engineer"
                      className="w-full bg-[#0C1220] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
                    />
                  </div>
                </div>

                {/* Required Skills */}
                {selectedNode.data.skills_required && selectedNode.data.skills_required.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Skills Required</label>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.data.skills_required.map((skill: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-[#0C1220] border border-slate-700 text-[11px] text-slate-300">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acceptance Criteria */}
                {selectedNode.data.acceptance_criteria && selectedNode.data.acceptance_criteria.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Acceptance Criteria</label>
                    <ul className="space-y-1.5">
                      {selectedNode.data.acceptance_criteria.map((crit: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-[#0C1220]/70 p-2.5 rounded-xl border border-slate-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#27E6B5] shrink-0 mt-0.5" />
                          <span>{crit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Quick AI Prompt Pills */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-xs font-semibold text-[#27E6B5] block mb-2">
                Contextual AI Prompts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleAskQuickPrompt('How do I complete this task efficiently?')}
                  className="px-2.5 py-1 rounded-lg bg-[#27E6B5]/10 hover:bg-[#27E6B5]/20 text-[#27E6B5] border border-[#27E6B5]/30 text-[11px] transition-colors cursor-pointer"
                >
                  ⚡ How to complete?
                </button>
                <button
                  onClick={() => handleAskQuickPrompt('What libraries or tools should I use?')}
                  className="px-2.5 py-1 rounded-lg bg-[#27E6B5]/10 hover:bg-[#27E6B5]/20 text-[#27E6B5] border border-[#27E6B5]/30 text-[11px] transition-colors cursor-pointer"
                >
                  🛠️ Recommended tools
                </button>
                <button
                  onClick={() => handleAskQuickPrompt('What are common pitfalls and bugs to avoid?')}
                  className="px-2.5 py-1 rounded-lg bg-[#27E6B5]/10 hover:bg-[#27E6B5]/20 text-[#27E6B5] border border-[#27E6B5]/30 text-[11px] transition-colors cursor-pointer"
                >
                  ⚠️ Common pitfalls
                </button>
                <button
                  onClick={() => handleAskQuickPrompt('Break this task into 4 step-by-step subtasks.')}
                  className="px-2.5 py-1 rounded-lg bg-[#27E6B5]/10 hover:bg-[#27E6B5]/20 text-[#27E6B5] border border-[#27E6B5]/30 text-[11px] transition-colors cursor-pointer"
                >
                  🧩 Subtask breakdown
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Ask AI Tab */
          <div className="space-y-4">
            <form onSubmit={handleAskCustom} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Ask anything about this task or node..."
                  className="w-full bg-[#0C1220] border border-slate-700/80 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
                />
                <button
                  type="submit"
                  disabled={isAskingAi || !customQuestion.trim()}
                  className="absolute right-2 top-2 p-1 text-[#27E6B5] hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

            {isAskingAi && (
              <div className="p-8 text-center text-xs text-[#27E6B5] animate-pulse flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#27E6B5]" />
                <span>AI analyzing project context & node specifications...</span>
              </div>
            )}

            {aiAdvice && !isAskingAi && (
              <div className="space-y-3">
                <div className="bg-[#27E6B5]/10 border border-[#27E6B5]/25 p-3.5 rounded-xl">
                  <h5 className="text-xs font-bold text-[#27E6B5] mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Tactical Guidance
                  </h5>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {aiAdvice.advice}
                  </p>
                </div>

                {aiAdvice.steps && aiAdvice.steps.length > 0 && (
                  <div className="bg-[#0C1220] border border-slate-800 p-3 rounded-xl">
                    <h5 className="text-[11px] font-bold text-slate-300 mb-2 uppercase tracking-wider">
                      Execution Steps
                    </h5>
                    <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside">
                      {aiAdvice.steps.map((st, idx) => (
                        <li key={idx} className="leading-snug">{st}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {aiAdvice.recommended_tools && aiAdvice.recommended_tools.length > 0 && (
                  <div className="bg-[#0C1220] border border-slate-800 p-3 rounded-xl">
                    <h5 className="text-[11px] font-bold text-slate-300 mb-2 uppercase tracking-wider">
                      Recommended Tools & Stacks
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {aiAdvice.recommended_tools.map((tool, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-[#05080D] text-[#27E6B5] border border-[#27E6B5]/30 text-[11px]">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {aiAdvice.common_pitfalls && aiAdvice.common_pitfalls.length > 0 && (
                  <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl">
                    <h5 className="text-[11px] font-bold text-rose-300 mb-2 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Pitfalls to Avoid
                    </h5>
                    <ul className="space-y-1 text-xs text-rose-200">
                      {aiAdvice.common_pitfalls.map((pitfall, idx) => (
                        <li key={idx}>• {pitfall}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-slate-800/80 flex items-center justify-between bg-[#080D16]">
        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Delete
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};
