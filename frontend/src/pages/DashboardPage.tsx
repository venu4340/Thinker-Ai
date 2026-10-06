import React, { useEffect, useState } from 'react';
import { 
  Plus, Search, Sparkles, Trash2, ArrowRight, Layers, LogOut, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { ProjectSummary, TemplateItem } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { GoalExecutionSummary } from '../components/dashboard/GoalExecutionSummary';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeProjectDetail, setActiveProjectDetail] = useState<any>(null);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projData, tmplData] = await Promise.all([
        api.listProjects(),
        api.listTemplates(),
      ]);
      setProjects(projData);
      setTemplates(tmplData);

      if (projData && projData.length > 0) {
        try {
          const detail = await api.getProject(projData[0].id);
          setActiveProjectDetail(detail);
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleUseTemplate = async (tmplId: string) => {
    const proj = await api.useTemplate(tmplId);
    window.location.href = `/project/${proj.id}`;
  };

  const categories = ['All', 'Startup', 'Software', 'Research', 'Marketing', 'Education', 'Personal'];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.goal && p.goal.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-[#05080D] text-[#F1F5F9] flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800/60 bg-[#080D16]/80 backdrop-blur-2xl px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#20D9B0] via-[#19C7D9] to-[#8B5CF6] p-0.5 shadow-md shadow-teal-500/20">
            <div className="w-full h-full bg-[#05080D] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#27E6B5]" />
            </div>
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            ThinkFlow <span className="text-[#27E6B5] font-semibold text-xs px-1.5 py-0.5 bg-[#27E6B5]/10 rounded border border-[#27E6B5]/20 ml-1">AI</span>
          </span>
        </a>

        <div className="flex items-center gap-3">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light / White' : 'Dark'} mode`}
            className="p-2 text-slate-400 hover:text-[#27E6B5] bg-[#0C1220] hover:bg-[#101827] rounded-xl border border-slate-800 transition-all cursor-pointer flex items-center justify-center"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#27E6B5]" />
            )}
          </button>

          <a href="/create">
            <Button variant="primary" size="sm" className="text-xs font-semibold shadow-md shadow-teal-500/20">
              <Plus className="w-3.5 h-3.5 mr-1" />
              + Create New Project
            </Button>
          </a>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#20D9B0] to-[#19C7D9] text-[#03110F] font-bold text-xs flex items-center justify-center">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-[#101827] transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-10 space-y-10">
        {/* Welcome & Stats Row */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Creator'} 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Turn your ideas into structured execution plans.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a href="/create">
                <Button variant="primary" size="md" className="font-bold text-xs shadow-lg shadow-teal-500/20">
                  <Plus className="w-4 h-4 mr-1.5" />
                  + Create New Project
                </Button>
              </a>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#0C1220]/80 border border-slate-800/80 shadow-md">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Projects
              </span>
              <span className="text-2xl font-extrabold text-white">{projects.length}</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0C1220]/80 border border-slate-800/80 shadow-md">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Active Tasks
              </span>
              <span className="text-2xl font-extrabold text-[#27E6B5]">
                {projects.reduce((acc, p) => acc + p.task_count, 0)}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0C1220]/80 border border-slate-800/80 shadow-md">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Risks Identified
              </span>
              <span className="text-2xl font-extrabold text-amber-400">
                {projects.reduce((acc, p) => acc + p.risk_count, 0)}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0C1220]/80 border border-slate-800/80 shadow-md">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Avg Completion
              </span>
              <span className="text-2xl font-extrabold text-emerald-400">
                {projects.length
                  ? (projects.reduce((acc, p) => acc + p.progress, 0) / projects.length).toFixed(0)
                  : 0}
                %
              </span>
            </div>
          </div>

          {/* Goal Execution Overview (Active Goal) */}
          {projects.length > 0 && (
            <div className="pt-2">
              <GoalExecutionSummary project={activeProjectDetail || projects[0]} />
            </div>
          )}
        </div>

        {/* Search & Category Filter Pills */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, goals, or categories..."
                className="w-full bg-[#0C1220] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#27E6B5] transition-colors"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#27E6B5]/15 text-[#27E6B5] border border-[#27E6B5]/30'
                      : 'bg-[#0C1220] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Project Cards Grid */}
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
              Loading projects portfolio...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 text-center bg-[#0C1220]/40 rounded-3xl border border-dashed border-slate-800 space-y-3">
              <Sparkles className="w-8 h-8 mx-auto text-[#27E6B5]" />
              <h3 className="text-sm font-bold text-white">No matching projects found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Ready to transform an idea into an execution system? Create your first visual plan.
              </p>
              <div className="pt-2">
                <a href="/create">
                  <Button variant="primary" size="sm">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Create New Idea
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => (window.location.href = `/project/${proj.id}`)}
                  className="bg-[#0C1220]/80 hover:bg-[#101827] border border-slate-800/80 hover:border-[#27E6B5]/40 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl shadow-md flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="teal" size="sm">
                        {proj.category}
                      </Badge>
                      <button
                        onClick={(e) => handleDeleteProject(e, proj.id)}
                        title="Delete project"
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-[#27E6B5] transition-colors line-clamp-2">
                      {proj.title}
                    </h3>

                    {proj.goal && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        🎯 {proj.goal}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1 text-slate-400">
                        <span>Progress</span>
                        <span className="font-bold text-[#27E6B5]">{proj.progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-[#05080D] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#20D9B0] to-[#19C7D9] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(proj.progress, 5)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>⚡ {proj.task_count} tasks</span>
                      <span>⚠️ {proj.risk_count} risks</span>
                      <span className="text-[#27E6B5] font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Open Board <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Templates Showcase Section */}
        {templates.length > 0 && (
          <div className="pt-6 border-t border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Explore Industry Templates
                </h3>
                <p className="text-xs text-slate-400">
                  Kickstart with production roadmaps pre-configured for startups, research, marketing, and capstone projects.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.slice(0, 3).map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => handleUseTemplate(tmpl.id)}
                  className="p-4 bg-[#0C1220]/80 border border-slate-800 hover:border-purple-500/40 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between space-y-3 shadow-md"
                >
                  <div className="space-y-1.5">
                    <Badge variant="purple" size="sm">
                      {tmpl.category}
                    </Badge>
                    <h4 className="text-xs font-bold text-white">{tmpl.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{tmpl.description}</p>
                  </div>
                  <span className="text-xs text-purple-400 font-semibold flex items-center gap-1">
                    Clone Template <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
