import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ArrowLeft, Wand2, FileText, 
  Clock, DollarSign, Users, Cpu, Target
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';

export const CreateProjectPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Software');
  const [goal, setGoal] = useState('');
  const [budget, setBudget] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [techStack, setTechStack] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idea = params.get('idea');
    if (idea) {
      setTitle(idea);
      setGoal(idea);
      setDescription(idea);
    }
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [error, setError] = useState<string | null>(null);


  const categories = [
    'Software', 'Startup', 'Education', 'Research', 
    'Business', 'Marketing', 'Personal', 'Other'
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    setError(null);

    const steps = [
      'Analyzing idea & core problem statement...',
      'Understanding objectives & target outcomes...',
      'Breaking problem into architectural phases...',
      'Identifying task dependencies & execution sequence...',
      'Simulating potential operational & technical risks...',
      'Building timeline & critical path...',
      'Creating visual execution board...'
    ];

    let stepIdx = 0;
    setProgressStep(steps[0]);
    const timer = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setProgressStep(steps[stepIdx]);
      }
    }, 500);

    try {
      // 1. Create project record
      const proj = await api.createProject({
        title,
        description: description || title,
        category,
        goal,
        budget,
        timeframe,
        team_size: teamSize,
        tech_stack: techStack,
      });

      // 2. Upload doc if present
      if (file) {
        await api.uploadDocument(proj.id, file);
      }

      // 3. Trigger AI generation
      await api.generateAIPlan(proj.id);

      clearInterval(timer);
      window.location.href = `/project/${proj.id}`;
    } catch (err: any) {
      clearInterval(timer);
      setError(err.message || 'Failed to generate plan');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05080D] text-[#F1F5F9] flex flex-col p-6 lg:p-12 relative selection:bg-[#27E6B5] selection:text-[#03110F]">
      {/* Background Ambient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#19C7D9]/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-3xl w-full mx-auto space-y-8 relative z-10">
        {/* Top Link */}
        <div>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#27E6B5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </a>
        </div>

        {/* Title Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#27E6B5]/10 border border-[#27E6B5]/30 text-xs font-semibold text-[#27E6B5]">
            <Sparkles className="w-3.5 h-3.5 text-[#27E6B5]" />
            <span>AI Planning Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Create New Thinking Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Enter your idea or problem brief. ThinkFlow AI will transform it into an end-to-end execution system.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleGenerate} className="bg-[#0C1220]/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI-Powered Inventory Management Platform"
              className="w-full bg-[#05080D] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#27E6B5] transition-colors"
            />
          </div>

          {/* Core Problem / Idea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Problem / Idea Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you want to build, the core problem you are solving, or the target workflow..."
              className="w-full bg-[#05080D] border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#27E6B5] transition-colors"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Domain / Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-[#27E6B5]/15 text-[#27E6B5] shadow-md border border-[#27E6B5]/30'
                      : 'bg-[#05080D] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#27E6B5]" />
              Success Goal (What does success look like?)
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Launch live pilot with 20 businesses and under 50ms barcode sync latency"
              className="w-full bg-[#05080D] border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#27E6B5]"
            />
          </div>

          {/* Constraints Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-[#27E6B5]" /> Budget Constraints
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. Bootstrapped / $10,000"
                className="w-full bg-[#05080D] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#27E6B5]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#27E6B5]" /> Timeframe
              </label>
              <input
                type="text"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                placeholder="e.g. 8 - 10 Weeks"
                className="w-full bg-[#05080D] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#27E6B5]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#27E6B5]" /> Team Size & Roles
              </label>
              <input
                type="text"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                placeholder="e.g. 2 Full-stack devs, 1 Designer"
                className="w-full bg-[#05080D] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#27E6B5]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-[#27E6B5]" /> Preferred Tech Stack / Tools
              </label>
              <input
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="e.g. FastAPI, React, PostgreSQL, Redis"
                className="w-full bg-[#05080D] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#27E6B5]"
              />
            </div>
          </div>

          {/* Optional Document Upload */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#27E6B5]" />
              Attach Requirements Document / PRD (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,.txt,.md,.docx"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#27E6B5]/15 file:text-[#27E6B5] hover:file:bg-[#27E6B5]/25 cursor-pointer"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-bold text-sm py-3.5 shadow-xl shadow-teal-500/25"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Generate My Plan with ThinkFlow AI
            </Button>
          </div>
        </form>
      </div>

      {/* Generation Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0C1220]/95 border border-[#27E6B5]/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#20D9B0] to-[#19C7D9] blur-xl opacity-60 animate-pulse" />
              <div className="relative w-full h-full rounded-full bg-[#05080D] border border-[#27E6B5]/50 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[#27E6B5] animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Synthesizing Visual Execution Plan
              </h3>
              <p className="text-xs text-[#27E6B5] font-mono">
                {progressStep}
              </p>
            </div>

            <div className="w-full bg-[#05080D] rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div className="bg-gradient-to-r from-[#20D9B0] to-[#19C7D9] h-full w-full animate-[pulse_1s_ease-in-out_infinite]" />
            </div>

            <p className="text-[11px] text-slate-400">
              Validating structured Pydantic schema and generating React Flow DAG...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
