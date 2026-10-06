import React from 'react';
import { 
  Sparkles, Download, Search, LayoutGrid, Calendar, ShieldAlert, 
  CheckSquare, Scale, Users, LogOut, Sun, Moon, ArrowLeft, Bot
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface NavbarProps {
  onOpenCommandPalette: () => void;
  onOpenExportModal: () => void;
  onOpenNewProjectModal?: () => void;
  onOpenDocModal?: () => void;
  onOpenVersionsModal?: () => void;
  onOpenChallengeModal?: () => void;
  onOpenApproachesModal?: () => void;
  onToggleAiAssistant?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCommandPalette,
  onOpenExportModal,
  onOpenNewProjectModal,
  onOpenDocModal,
  onOpenVersionsModal,
  onOpenChallengeModal,
  onOpenApproachesModal,
  onToggleAiAssistant,
}) => {
  const { user, logout } = useAuth();
  const { project, activeView, setActiveView } = useProject();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 border-b border-slate-800/60 bg-[#080D16]/85 backdrop-blur-2xl px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Active Project Breadcrumb */}
      <div className="flex items-center gap-4">
        <a href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group text-decoration-none">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#20D9B0] via-[#19C7D9] to-[#8B5CF6] p-0.5 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#05080D] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#27E6B5]" />
            </div>
          </div>
          <span className="font-bold text-base tracking-tight text-white hidden sm:inline">
            ThinkFlow <span className="text-[#27E6B5] font-semibold text-[11px] px-1.5 py-0.5 bg-[#27E6B5]/10 rounded border border-[#27E6B5]/20 ml-1">AI</span>
          </span>
        </a>

        {project && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800/80">
            <a 
              href="/dashboard" 
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Dashboard</span>
            </a>
            <span className="text-slate-600 text-xs">/</span>
            <h1 className="text-xs font-semibold text-slate-200 max-w-[200px] truncate">
              {project.title}
            </h1>
            <Badge variant="teal" size="sm">
              {project.category}
            </Badge>
          </div>
        )}
      </div>

      {/* Center View Selector (when a project is open) */}
      {project && (
        <div className="hidden xl:flex items-center bg-[#0C1220]/90 border border-slate-800/80 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setActiveView('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'canvas' ? 'bg-[#27E6B5]/15 text-[#27E6B5] border border-[#27E6B5]/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Visual Board
          </button>
          <button
            onClick={() => setActiveView('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'timeline' ? 'bg-[#27E6B5]/15 text-[#27E6B5] border border-[#27E6B5]/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Timeline
          </button>
          <button
            onClick={() => setActiveView('risks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'risks' ? 'bg-[#27E6B5]/15 text-[#27E6B5] border border-[#27E6B5]/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Risk Matrix
          </button>
          <button
            onClick={() => setActiveView('tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'tasks' ? 'bg-[#27E6B5]/15 text-[#27E6B5] border border-[#27E6B5]/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" /> Tasks ({project.tasks.length})
          </button>
          <button
            onClick={() => setActiveView('decisions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'decisions' ? 'bg-[#27E6B5]/15 text-[#27E6B5] border border-[#27E6B5]/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" /> Decisions
          </button>
          <button
            onClick={() => setActiveView('resources')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'resources' ? 'bg-[#27E6B5]/15 text-[#27E6B5] border border-[#27E6B5]/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Resources
          </button>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Command Search Shortcut */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#0C1220] hover:bg-[#101827] text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 text-xs transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[#27E6B5]" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-[#05080D] text-slate-400 border border-slate-700 rounded">
            Ctrl+K
          </kbd>
        </button>

        {/* Theme Switcher Toggle (Dark / White Mode) */}
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

        {project && (
          <>
            {/* Challenge Plan Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenChallengeModal}
              className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hidden md:inline-flex"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Challenge
            </Button>

            {/* Export Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenExportModal}
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </>
        )}

        {/* User Account Menu */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800/80">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#20D9B0] to-[#19C7D9] text-[#03110F] font-bold text-xs flex items-center justify-center shadow-md">
              {user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-[#101827] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <a href="/login">
            <Button variant="primary" size="sm">Sign In</Button>
          </a>
        )}
      </div>
    </header>
  );
};
