import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles, ArrowUp, Plus, Trash2, LogOut,
  Sun, Moon, Monitor, ExternalLink, Zap, LayoutDashboard, MessageSquare,
  Copy, Check, Menu, X, AlertCircle, RefreshCw, Image as ImageIcon,
  BookOpen, Calendar, Rocket, ShieldAlert, CheckCircle2, ChevronRight,
  ChevronDown, Layers, ArrowRight, Play, Award, Code, CheckSquare,
  Clock, Users, Cpu, Target, HelpCircle, Lightbulb, Compass, Share2, GitBranch, Search
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme, ThemePreference } from "../context/ThemeContext";
import { api } from "../services/api";
import { InteractiveFlowModal } from "../components/canvas/InteractiveFlowModal";
import { ConstellationBackground } from "../components/canvas/ConstellationBackground";

// ── Types ─────────────────────────────────────────────────────────────────────
export type WorkspaceType = 
  | "chat" 
  | "roadmap" 
  | "learning" 
  | "project" 
  | "planning" 
  | "tasks" 
  | "timeline" 
  | "risk" 
  | "decision" 
  | "research";

export type IntentType =
  | "GENERAL_CHAT"
  | "LEARNING"
  | "LEARNING_ROADMAP"
  | "DAILY_LEARNING"
  | "PROJECT"
  | "PROJECT_PLAN"
  | "BUSINESS_IDEA"
  | "BUSINESS_PLAN"
  | "GOAL"
  | "GOAL_PLAN"
  | "TASK_PLAN"
  | "INTERVIEW_PREPARATION"
  | "RESEARCH"
  | "BRAINSTORM"
  | "DECISION"
  | "RISK_ANALYSIS"
  | "TIMELINE"
  | "GENERAL_PLANNING";

export interface StructuredWorkspaceData {
  intent?: IntentType | string;
  workspace?: WorkspaceType | string;
  title?: string;
  goal?: string;
  duration?: string;
  frequency?: string;
  data?: any;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  structured?: StructuredWorkspaceData | null;
  is_error?: boolean;
  imagePreview?: string;
}

interface Conversation {
  id: string;
  title: string;
  model: string;
  message_count: number;
  updated_at: string;
}

interface SelectedImage {
  file: File;
  previewUrl: string;
  name: string;
}

const API = "/api/v1";

function getToken() {
  return api.getToken();
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(text: string, isLight: boolean): React.ReactNode {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      elements.push(
        <p key={i} className={`font-bold mt-3 mb-1 ${isLight ? "text-slate-900" : "text-[#F1F5F9]"}`}>
          {line.slice(2, -2)}
        </p>
      );
    } else if (/^\*\*(.+?)\*\*/.test(line)) {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      elements.push(
        <p key={i} className="leading-relaxed mb-1">
          {parts.map((p, pi) =>
            p.startsWith("**") && p.endsWith("**") ? (
              <strong key={pi} className={`font-semibold ${isLight ? "text-slate-900" : "text-[#F1F5F9]"}`}>
                {p.slice(2, -2)}
              </strong>
            ) : (
              p
            )
          )}
        </p>
      );
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <div key={i} className="flex items-start gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#20D9B0] mt-2 flex-shrink-0" />
          <span className="leading-relaxed">{line.slice(2)}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(
        <div key={i} className="flex items-start gap-2 mb-1">
          <span className="text-[#20D9B0] font-semibold text-xs font-mono mt-0.5 flex-shrink-0 w-4">
            {line.match(/^\d+/)![0]}.
          </span>
          <span className="leading-relaxed">{line.replace(/^\d+\.\s/, "")}</span>
        </div>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h3 key={i} className={`text-base font-bold mt-4 mb-2 ${isLight ? "text-slate-900" : "text-[#F1F5F9]"}`}>
          {line.slice(2)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h4 key={i} className={`text-sm font-bold mt-3 mb-1 ${isLight ? "text-slate-900" : "text-[#F1F5F9]"}`}>
          {line.slice(3)}
        </h4>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="leading-relaxed mb-1">{line}</p>);
    }
    i++;
  }
  return <div className={`text-[13px] leading-relaxed ${isLight ? "text-slate-700" : "text-[#94A3B8]"}`}>{elements}</div>;
}

// ── Response Parsing ──────────────────────────────────────────────────────────
function parseResponse(raw: string): { display: string; structured: StructuredWorkspaceData | null } {
  if (!raw) return { display: "", structured: null };

  // 1. Check for <THINKFLOW_RESPONSE>...</THINKFLOW_RESPONSE>
  const tfMatch = raw.match(/<THINKFLOW_RESPONSE>([\s\S]*?)<\/THINKFLOW_RESPONSE>/);
  if (tfMatch) {
    try {
      const structured: StructuredWorkspaceData = JSON.parse(tfMatch[1].trim());
      const display = raw.replace(/<THINKFLOW_RESPONSE>[\s\S]*?<\/THINKFLOW_RESPONSE>/, "").trim();
      return { display, structured };
    } catch {
      // JSON syntax incomplete during streaming
    }
  }

  // 2. Fallback check for legacy <THINKFLOW_PLAN>...</THINKFLOW_PLAN>
  const planMatch = raw.match(/<THINKFLOW_PLAN>([\s\S]*?)<\/THINKFLOW_PLAN>/);
  if (planMatch) {
    try {
      const plan = JSON.parse(planMatch[1].trim());
      const display = raw.replace(/<THINKFLOW_PLAN>[\s\S]*?<\/THINKFLOW_PLAN>/, "").trim();
      return {
        display,
        structured: {
          intent: "PROJECT_PLAN",
          workspace: "roadmap",
          title: plan.goal || "Action Plan",
          goal: plan.goal,
          data: plan,
        },
      };
    } catch {}
  }

  // Clean trailing unclosed tags during streaming
  const cleaned = raw.replace(/<THINKFLOW_(RESPONSE|PLAN)>[\s\S]*$/, "").trim();
  return { display: cleaned, structured: null };
}

// ── Roadmap Workspace Component ───────────────────────────────────────────────
const RoadmapWorkspace: React.FC<{
  data: StructuredWorkspaceData;
  isLight: boolean;
  onSendPrompt: (prompt: string) => void;
  onCreateProject: (title: string, goal: string) => void;
  onViewVisualFlow: (data: StructuredWorkspaceData) => void;
}> = ({ data, isLight, onSendPrompt, onCreateProject, onViewVisualFlow }) => {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);
  const phases = data.data?.phases || [];

  return (
    <div className={`mt-4 rounded-2xl border transition-all overflow-hidden ${
      isLight ? "bg-white border-slate-200/90 shadow-md" : "bg-[#0A101D] border-slate-800/80 shadow-2xl"
    }`}>
      {/* Header */}
      <div className={`px-4 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
        isLight ? "bg-slate-50/80 border-slate-200/80" : "bg-[#070B14] border-slate-800/60"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#20D9B0] to-[#159FB5] flex items-center justify-center text-[#03110F] shadow-sm">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                {data.title || "Skill Mastery Roadmap"}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#20D9B0]/15 text-[#20D9B0] border border-[#20D9B0]/30">
                Roadmap Workspace
              </span>
            </div>
            {data.duration && (
              <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Target Timeline: <span className="font-medium text-[#20D9B0]">{data.duration}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewVisualFlow(data)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                : "bg-white/5 hover:bg-white/10 text-white border-white/10"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-[#20D9B0]" />
            Visual Flow
          </button>
          <button
            onClick={() => onCreateProject(data.title || "Learning Roadmap", data.goal || "")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#20D9B0] to-[#159FB5] text-[#03110F] hover:opacity-95 shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Open in Thinking Canvas
          </button>
        </div>
      </div>

      {/* Phases Accordion / List */}
      <div className="p-4 space-y-3">
        {phases.map((phase: any, idx: number) => {
          const isExpanded = expandedPhase === idx;
          const phaseNum = phase.phase_number || idx + 1;

          return (
            <div
              key={idx}
              className={`rounded-xl border transition-all ${
                isExpanded
                  ? isLight
                    ? "bg-slate-50/50 border-[#20D9B0]/40 shadow-sm"
                    : "bg-[#0E1626] border-[#20D9B0]/30 shadow-lg"
                  : isLight
                  ? "bg-white border-slate-200/80 hover:border-slate-300"
                  : "bg-[#070C16] border-slate-800/60 hover:border-slate-700"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedPhase(isExpanded ? null : idx)}
                className="w-full flex items-center justify-between p-3.5 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-[#20D9B0]/10 border border-[#20D9B0]/30 flex items-center justify-center text-xs font-mono font-bold text-[#20D9B0] flex-shrink-0">
                    {phaseNum}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                      {phase.title}
                    </p>
                    {phase.duration && (
                      <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        {phase.duration}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className={`px-4 pb-4 pt-1 space-y-3 border-t text-xs ${
                  isLight ? "border-slate-200/60 text-slate-700" : "border-slate-800/60 text-slate-300"
                }`}>
                  {phase.why_it_matters && (
                    <div className={`p-2.5 rounded-lg text-[11px] leading-relaxed ${
                      isLight ? "bg-amber-50/80 text-amber-900 border border-amber-200/60" : "bg-amber-500/10 text-amber-200 border border-amber-500/20"
                    }`}>
                      <span className="font-semibold">Why this matters: </span>
                      {phase.why_it_matters}
                    </div>
                  )}

                  {/* Topics */}
                  {phase.topics && phase.topics.length > 0 && (
                    <div>
                      <span className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Core Concepts & Topics
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {phase.topics.map((top: string, ti: number) => (
                          <span
                            key={ti}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                              isLight ? "bg-slate-100 text-slate-800 border border-slate-200" : "bg-white/5 text-slate-200 border border-white/10"
                            }`}
                          >
                            {top}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exercises & Projects */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {phase.exercises && phase.exercises.length > 0 && (
                      <div className={`p-2.5 rounded-lg border ${
                        isLight ? "bg-slate-50 border-slate-200/80" : "bg-[#060A12] border-slate-800/80"
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold text-[#20D9B0]">
                          <Code className="w-3.5 h-3.5" />
                          <span>Practical Exercises</span>
                        </div>
                        <ul className="space-y-1 text-[11px]">
                          {phase.exercises.map((ex: string, ei: number) => (
                            <li key={ei} className="flex items-start gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-[#20D9B0] mt-1.5 flex-shrink-0" />
                              <span>{ex}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {phase.projects && phase.projects.length > 0 && (
                      <div className={`p-2.5 rounded-lg border ${
                        isLight ? "bg-slate-50 border-slate-200/80" : "bg-[#060A12] border-slate-800/80"
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold text-[#159FB5]">
                          <Rocket className="w-3.5 h-3.5" />
                          <span>Milestone Project</span>
                        </div>
                        <ul className="space-y-1 text-[11px]">
                          {phase.projects.map((pr: string, pi: number) => (
                            <li key={pi} className="flex items-start gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-[#159FB5] mt-1.5 flex-shrink-0" />
                              <span>{pr}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Completion Criteria */}
                  {phase.completion_criteria && phase.completion_criteria.length > 0 && (
                    <div className="pt-1">
                      <span className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Readiness Checkpoint
                      </span>
                      <div className="space-y-1">
                        {phase.completion_criteria.map((cr: string, ci: number) => (
                          <div key={ci} className="flex items-center gap-2 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#20D9B0] flex-shrink-0" />
                            <span>{cr}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Refine Prompt Chips */}
      <div className={`px-4 py-3 border-t flex items-center gap-2 overflow-x-auto ${
        isLight ? "bg-slate-50/50 border-slate-200/80" : "bg-[#070B14] border-slate-800/60"
      }`}>
        <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
          isLight ? "text-slate-400" : "text-slate-500"
        }`}>
          Refine:
        </span>
        {[
          "I only have 1 hour per day",
          "I already know Python",
          "Make month 2 harder",
          "Show me visually"
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => onSendPrompt(chip)}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border whitespace-nowrap cursor-pointer transition-all active:scale-95 ${
              isLight
                ? "bg-white text-slate-700 border-slate-200 hover:border-[#20D9B0] hover:text-[#20D9B0]"
                : "bg-white/5 text-slate-300 border-slate-800 hover:border-[#20D9B0] hover:text-[#20D9B0]"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Daily Learning Workspace Component ─────────────────────────────────────────
const DailyLearningWorkspace: React.FC<{
  data: StructuredWorkspaceData;
  isLight: boolean;
  onSendPrompt: (prompt: string) => void;
  onViewVisualFlow: (data: StructuredWorkspaceData) => void;
}> = ({ data, isLight, onSendPrompt, onViewVisualFlow }) => {
  const [completedItems, setCompletedItems] = useState<{ [key: string]: boolean }>({});
  const payload = data.data || {};
  const today = payload.today || {};
  const upcomingDays = payload.upcoming_days || [];
  const currentDay = payload.current_day || today.day_number || 1;

  const toggleCheck = (key: string) => {
    setCompletedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={`mt-4 rounded-2xl border transition-all overflow-hidden ${
      isLight ? "bg-white border-slate-200/90 shadow-md" : "bg-[#0A101D] border-slate-800/80 shadow-2xl"
    }`}>
      {/* Header */}
      <div className={`px-4 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
        isLight ? "bg-slate-50/80 border-slate-200/80" : "bg-[#070B14] border-slate-800/60"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#20D9B0] to-[#159FB5] flex items-center justify-center text-[#03110F] shadow-sm">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                {data.title || "Daily Learning Track"}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#20D9B0]/15 text-[#20D9B0] border border-[#20D9B0]/30">
                Day {currentDay} of {payload.total_days || 30}
              </span>
            </div>
            <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              Active Topic: <span className="font-medium text-[#20D9B0]">{today.topic || "Daily Lesson"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewVisualFlow(data)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                : "bg-white/5 hover:bg-white/10 text-white border-white/10"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-[#20D9B0]" />
            Visual Flow
          </button>
          <button
            onClick={() => onSendPrompt(`Start day ${currentDay} lesson: ${today.topic || ""}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#20D9B0] to-[#159FB5] text-[#03110F] hover:opacity-95 shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Start Today's Lesson
          </button>
        </div>
      </div>

      {/* 4 Daily Pillars: Learn, Practice, Build, Review */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. Learn */}
        <div className={`p-3.5 rounded-xl border ${
          isLight ? "bg-teal-50/50 border-teal-200/80" : "bg-[#0A1622] border-teal-500/20"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-[#20D9B0]" />
            <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
              1. Learn
            </span>
          </div>
          <p className={`text-xs leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>
            {today.learn || "Core conceptual foundations."}
          </p>
        </div>

        {/* 2. Practice */}
        <div className={`p-3.5 rounded-xl border ${
          isLight ? "bg-cyan-50/50 border-cyan-200/80" : "bg-[#081724] border-cyan-500/20"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 text-[#19C7D9]" />
            <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
              2. Practice
            </span>
          </div>
          {Array.isArray(today.practice) ? (
            <div className="space-y-1.5">
              {today.practice.map((item: string, idx: number) => {
                const key = `practice-${idx}`;
                return (
                  <div
                    key={idx}
                    onClick={() => toggleCheck(key)}
                    className="flex items-start gap-2 text-xs cursor-pointer group"
                  >
                    <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center transition-colors ${
                      completedItems[key]
                        ? "bg-[#19C7D9] border-[#19C7D9] text-[#03110F]"
                        : "border-slate-400 group-hover:border-[#19C7D9]"
                    }`}>
                      {completedItems[key] && <Check className="w-3 h-3" />}
                    </div>
                    <span className={completedItems[key] ? "line-through text-slate-400" : (isLight ? "text-slate-700" : "text-slate-300")}>
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={`text-xs leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>
              {today.practice || "Hands-on exercises and coding challenges."}
            </p>
          )}
        </div>

        {/* 3. Build */}
        <div className={`p-3.5 rounded-xl border ${
          isLight ? "bg-violet-50/50 border-violet-200/80" : "bg-[#111028] border-violet-500/20"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="w-4 h-4 text-[#8B5CF6]" />
            <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
              3. Build
            </span>
          </div>
          <p className={`text-xs leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>
            {today.build || "Build a working mini-project to reinforce today's topic."}
          </p>
        </div>

        {/* 4. Review */}
        <div className={`p-3.5 rounded-xl border ${
          isLight ? "bg-amber-50/50 border-amber-200/80" : "bg-[#18140B] border-amber-500/20"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
              4. Review
            </span>
          </div>
          <p className={`text-xs leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>
            {today.review || "Key takeaways and self-reflection retention check."}
          </p>
        </div>
      </div>

      {/* Upcoming days roadmap preview */}
      {upcomingDays && upcomingDays.length > 0 && (
        <div className={`px-4 py-3 border-t text-xs ${
          isLight ? "bg-slate-50/50 border-slate-200/80" : "bg-[#070B14] border-slate-800/60"
        }`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${
            isLight ? "text-slate-400" : "text-slate-500"
          }`}>
            Upcoming Sessions:
          </span>
          <div className="flex flex-wrap gap-2">
            {upcomingDays.map((ud: any, idx: number) => (
              <button
                key={idx}
                onClick={() => onSendPrompt(`Let's move to Day ${ud.day}: ${ud.topic}`)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  isLight
                    ? "bg-white border-slate-200 text-slate-700 hover:border-[#20D9B0]"
                    : "bg-[#0A101C] border-slate-800 text-slate-300 hover:border-[#20D9B0]"
                }`}
              >
                <span className="font-mono text-[#20D9B0] font-bold">Day {ud.day}:</span>
                <span className="truncate max-w-[150px]">{ud.topic}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className={`px-4 py-3 border-t flex items-center gap-2 overflow-x-auto ${
        isLight ? "bg-slate-50/50 border-slate-200/80" : "bg-[#070B14] border-slate-800/60"
      }`}>
        <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
          isLight ? "text-slate-400" : "text-slate-500"
        }`}>
          Actions:
        </span>
        {[
          "I finished today! Move to Day 2",
          "Give me 3 coding exercises for today",
          "Show me visually"
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => onSendPrompt(chip)}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border whitespace-nowrap cursor-pointer transition-all active:scale-95 ${
              isLight
                ? "bg-white text-slate-700 border-slate-200 hover:border-[#20D9B0] hover:text-[#20D9B0]"
                : "bg-white/5 text-slate-300 border-slate-800 hover:border-[#20D9B0] hover:text-[#20D9B0]"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Project Workspace Component ───────────────────────────────────────────────
const ProjectWorkspace: React.FC<{
  data: StructuredWorkspaceData;
  isLight: boolean;
  onSendPrompt: (prompt: string) => void;
  onCreateProject: (title: string, goal: string) => void;
  onViewVisualFlow: (data: StructuredWorkspaceData) => void;
}> = ({ data, isLight, onSendPrompt, onCreateProject, onViewVisualFlow }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "features" | "architecture" | "steps">("overview");
  const projectData = data.data || {};

  return (
    <div className={`mt-4 rounded-2xl border transition-all overflow-hidden ${
      isLight ? "bg-white border-slate-200/90 shadow-md" : "bg-[#0A101D] border-slate-800/80 shadow-2xl"
    }`}>
      {/* Header */}
      <div className={`px-4 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
        isLight ? "bg-slate-50/80 border-slate-200/80" : "bg-[#070B14] border-slate-800/60"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#20D9B0] to-[#8B5CF6] flex items-center justify-center text-[#03110F] shadow-sm">
            <Rocket className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                {data.title || "Project Execution Plan"}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
                Project Workspace
              </span>
            </div>
            <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {projectData.solution || data.goal || "End-to-end architecture & execution roadmap."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewVisualFlow(data)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                : "bg-white/5 hover:bg-white/10 text-white border-white/10"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-[#20D9B0]" />
            Visual Flow
          </button>
          <button
            onClick={() => onCreateProject(data.title || "New Project", projectData.problem || data.goal || "")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#20D9B0] to-[#159FB5] text-[#03110F] hover:opacity-95 shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Create Thinking Board
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`px-4 pt-2 border-b flex items-center gap-2 text-xs font-medium overflow-x-auto ${
        isLight ? "border-slate-200/80 bg-slate-50/40" : "border-slate-800/60 bg-[#070B14]"
      }`}>
        {[
          { id: "overview", label: "Problem & Solution" },
          { id: "features", label: "Features & MVP" },
          { id: "architecture", label: "Tech Stack & Architecture" },
          { id: "steps", label: "Dev Steps & Launch" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "border-[#20D9B0] text-[#20D9B0] font-semibold"
                : isLight
                ? "border-transparent text-slate-500 hover:text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 text-xs">
        {activeTab === "overview" && (
          <div className="space-y-3">
            {projectData.problem && (
              <div className={`p-3 rounded-xl border ${isLight ? "bg-rose-50/50 border-rose-200" : "bg-rose-500/05 border-rose-500/20"}`}>
                <span className={`text-[11px] font-bold block mb-1 ${isLight ? "text-rose-900" : "text-rose-300"}`}>
                  Problem Statement
                </span>
                <p className={isLight ? "text-slate-700" : "text-slate-300"}>{projectData.problem}</p>
              </div>
            )}
            {projectData.target_users && (
              <div className={`p-3 rounded-xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"}`}>
                <span className={`text-[11px] font-bold block mb-1 ${isLight ? "text-slate-900" : "text-white"}`}>
                  Target Audience
                </span>
                <p className={isLight ? "text-slate-700" : "text-slate-300"}>{projectData.target_users}</p>
              </div>
            )}
            {projectData.solution && (
              <div className={`p-3 rounded-xl border ${isLight ? "bg-teal-50/50 border-teal-200" : "bg-[#20D9B0]/05 border-[#20D9B0]/20"}`}>
                <span className={`text-[11px] font-bold block mb-1 ${isLight ? "text-teal-900" : "text-[#20D9B0]"}`}>
                  Proposed Solution
                </span>
                <p className={isLight ? "text-slate-700" : "text-slate-300"}>{projectData.solution}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "features" && (
          <div className="space-y-3">
            {projectData.core_features && (
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Core Features
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {projectData.core_features.map((feat: string, idx: number) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                        isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#20D9B0] flex-shrink-0" />
                      <span className={isLight ? "text-slate-800" : "text-slate-200"}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {projectData.mvp_scope && (
              <div className={`p-3 rounded-xl border ${isLight ? "bg-amber-50/60 border-amber-200" : "bg-amber-500/10 border-amber-500/20"}`}>
                <span className={`text-[11px] font-bold block mb-1 ${isLight ? "text-amber-900" : "text-amber-300"}`}>
                  MVP Scope & First Milestone
                </span>
                <p className={isLight ? "text-slate-700" : "text-slate-300"}>{projectData.mvp_scope}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "architecture" && (
          <div className="space-y-3">
            {projectData.tech_stack && (
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Recommended Tech Stack
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(projectData.tech_stack) ? (
                    projectData.tech_stack.map((item: string, idx: number) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          isLight ? "bg-teal-50 text-teal-800 border border-teal-200" : "bg-[#20D9B0]/10 text-[#20D9B0] border border-[#20D9B0]/30"
                        }`}
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <p className={isLight ? "text-slate-700" : "text-slate-300"}>{projectData.tech_stack}</p>
                  )}
                </div>
              </div>
            )}

            {projectData.architecture && (
              <div className={`p-3 rounded-xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-[#070C16] border-slate-800"}`}>
                <span className={`text-[11px] font-bold block mb-1 ${isLight ? "text-slate-900" : "text-white"}`}>
                  Architecture & Data Flow
                </span>
                <p className={isLight ? "text-slate-700" : "text-slate-300"}>{projectData.architecture}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "steps" && (
          <div className="space-y-3">
            {projectData.development_steps && (
              <div className="space-y-2">
                {projectData.development_steps.map((st: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded bg-[#20D9B0]/20 text-[#20D9B0] font-mono font-bold text-xs flex items-center justify-center">
                        {st.step || idx + 1}
                      </span>
                      <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                        {st.title}
                      </span>
                    </div>
                    {st.tasks && (
                      <ul className="pl-7 space-y-1 text-[11px]">
                        {st.tasks.map((task: string, ti: number) => (
                          <li key={ti} className="list-disc text-slate-400">
                            <span className={isLight ? "text-slate-700" : "text-slate-300"}>{task}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Refinement Chips */}
      <div className={`px-4 py-3 border-t flex items-center gap-2 overflow-x-auto ${
        isLight ? "bg-slate-50/50 border-slate-200/80" : "bg-[#070B14] border-slate-800/60"
      }`}>
        <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
          isLight ? "text-slate-400" : "text-slate-500"
        }`}>
          Explore:
        </span>
        {[
          "Suggest alternative tech stack",
          "Show biggest project risks",
          "Show me visually"
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => onSendPrompt(chip)}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border whitespace-nowrap cursor-pointer transition-all active:scale-95 ${
              isLight
                ? "bg-white text-slate-700 border-slate-200 hover:border-[#20D9B0] hover:text-[#20D9B0]"
                : "bg-white/5 text-slate-300 border-slate-800 hover:border-[#20D9B0] hover:text-[#20D9B0]"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Risk Workspace Component ──────────────────────────────────────────────────
const RiskWorkspace: React.FC<{
  data: StructuredWorkspaceData;
  isLight: boolean;
  onSendPrompt: (prompt: string) => void;
  onViewVisualFlow: (data: StructuredWorkspaceData) => void;
}> = ({ data, isLight, onSendPrompt, onViewVisualFlow }) => {
  const risks = data.data?.risks || [];

  return (
    <div className={`mt-4 rounded-2xl border transition-all overflow-hidden ${
      isLight ? "bg-white border-slate-200/90 shadow-md" : "bg-[#0A101D] border-slate-800/80 shadow-2xl"
    }`}>
      <div className={`px-4 py-3.5 border-b flex items-center justify-between ${
        isLight ? "bg-slate-50/80 border-slate-200/80" : "bg-[#070B14] border-slate-800/60"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                {data.title || "Project Risk Matrix"}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                Risk Workspace
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onViewVisualFlow(data)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isLight
              ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
              : "bg-white/5 hover:bg-white/10 text-white border-white/10"
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-[#20D9B0]" />
          Visual Flow
        </button>
      </div>

      <div className="p-4 space-y-2.5">
        {risks.map((r: any, idx: number) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border text-xs ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-[#070C16] border-slate-800"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                {r.risk || r.title}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {r.probability && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Prob: {r.probability}
                  </span>
                )}
                {r.impact && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Impact: {r.impact}
                  </span>
                )}
              </div>
            </div>
            {r.mitigation && (
              <div className={`mt-2 p-2 rounded-lg text-[11px] ${
                isLight ? "bg-teal-50 text-teal-900 border border-teal-200/60" : "bg-[#20D9B0]/10 text-[#20D9B0] border border-[#20D9B0]/20"
              }`}>
                <span className="font-semibold">Mitigation Strategy: </span>
                {r.mitigation}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={`px-4 py-3 border-t flex items-center gap-2 overflow-x-auto ${
        isLight ? "bg-slate-50/50 border-slate-200/80" : "bg-[#070B14] border-slate-800/60"
      }`}>
        <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
          isLight ? "text-slate-400" : "text-slate-500"
        }`}>
          Actions:
        </span>
        {[
          "Suggest automated tests to prevent risks",
          "Show security vulnerabilities",
          "Show me visually"
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => onSendPrompt(chip)}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border whitespace-nowrap cursor-pointer transition-all active:scale-95 ${
              isLight
                ? "bg-white text-slate-700 border-slate-200 hover:border-[#20D9B0] hover:text-[#20D9B0]"
                : "bg-white/5 text-slate-300 border-slate-800 hover:border-[#20D9B0] hover:text-[#20D9B0]"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Decision Workspace Component ──────────────────────────────────────────────
const DecisionWorkspace: React.FC<{
  data: StructuredWorkspaceData;
  isLight: boolean;
  onSendPrompt: (prompt: string) => void;
  onViewVisualFlow: (data: StructuredWorkspaceData) => void;
}> = ({ data, isLight, onSendPrompt, onViewVisualFlow }) => {
  const payload = data.data || {};
  const options = payload.options || [];

  return (
    <div className={`mt-4 rounded-2xl border transition-all overflow-hidden ${
      isLight ? "bg-white border-slate-200/90 shadow-md" : "bg-[#0A101D] border-slate-800/80 shadow-2xl"
    }`}>
      <div className={`px-4 py-3.5 border-b flex items-center justify-between ${
        isLight ? "bg-slate-50/80 border-slate-200/80" : "bg-[#070B14] border-slate-800/60"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-sm">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                {data.title || "Decision Matrix"}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                Decision Workspace
              </span>
            </div>
            {payload.question && (
              <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                {payload.question}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => onViewVisualFlow(data)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isLight
              ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
              : "bg-white/5 hover:bg-white/10 text-white border-white/10"
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-[#20D9B0]" />
          Visual Flow
        </button>
      </div>

      {payload.recommendation && (
        <div className={`m-4 p-3 rounded-xl border text-xs ${
          isLight ? "bg-teal-50/80 border-teal-200 text-teal-900" : "bg-[#20D9B0]/10 border-[#20D9B0]/25 text-[#20D9B0]"
        }`}>
          <span className="font-bold">Recommendation: </span>
          {payload.recommendation}
        </div>
      )}

      <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt: any, idx: number) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border text-xs ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-[#070C16] border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                {opt.name}
              </span>
              {opt.verdict && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  opt.verdict === "Recommended"
                    ? "bg-[#20D9B0]/20 text-[#20D9B0]"
                    : "bg-slate-500/20 text-slate-400"
                }`}>
                  {opt.verdict}
                </span>
              )}
            </div>

            {opt.pros && opt.pros.length > 0 && (
              <div className="mb-2">
                <span className="text-[10px] font-bold uppercase text-[#20D9B0] block mb-1">Pros</span>
                <ul className="space-y-0.5 pl-3 list-disc text-[11px] text-slate-400">
                  {opt.pros.map((p: string, pi: number) => (
                    <li key={pi}><span className={isLight ? "text-slate-700" : "text-slate-300"}>{p}</span></li>
                  ))}
                </ul>
              </div>
            )}

            {opt.cons && opt.cons.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-400 block mb-1">Cons</span>
                <ul className="space-y-0.5 pl-3 list-disc text-[11px] text-slate-400">
                  {opt.cons.map((c: string, ci: number) => (
                    <li key={ci}><span className={isLight ? "text-slate-700" : "text-slate-300"}>{c}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Timeline Workspace Component ──────────────────────────────────────────────
const TimelineWorkspace: React.FC<{
  data: StructuredWorkspaceData;
  isLight: boolean;
  onSendPrompt: (prompt: string) => void;
  onViewVisualFlow: (data: StructuredWorkspaceData) => void;
}> = ({ data, isLight, onSendPrompt, onViewVisualFlow }) => {
  const payload = data.data || {};
  const milestones = payload.milestones || [];

  return (
    <div className={`mt-4 rounded-2xl border transition-all overflow-hidden ${
      isLight ? "bg-white border-slate-200/90 shadow-md" : "bg-[#0A101D] border-slate-800/80 shadow-2xl"
    }`}>
      <div className={`px-4 py-3.5 border-b flex items-center justify-between ${
        isLight ? "bg-slate-50/80 border-slate-200/80" : "bg-[#070B14] border-slate-800/60"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shadow-sm">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                {data.title || "Project Timeline"}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Timeline Workspace
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onViewVisualFlow(data)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isLight
              ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
              : "bg-white/5 hover:bg-white/10 text-white border-white/10"
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-[#20D9B0]" />
          Visual Flow
        </button>
      </div>

      <div className="p-4 space-y-3">
        {milestones.map((m: any, idx: number) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-[#070C16] border-slate-800"
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
              {idx + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                  {m.milestone || m.title}
                </span>
                {m.duration && (
                  <span className="text-[10px] font-mono text-[#20D9B0] bg-[#20D9B0]/10 px-2 py-0.5 rounded">
                    {m.duration}
                  </span>
                )}
              </div>
              {m.deliverables && (
                <ul className="pl-4 list-disc space-y-0.5 text-[11px] text-slate-400">
                  {m.deliverables.map((del: string, di: number) => (
                    <li key={di}><span className={isLight ? "text-slate-700" : "text-slate-300"}>{del}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── MessageBubble ──────────────────────────────────────────────────────────────
const MessageBubble: React.FC<{
  msg: Message;
  isLight: boolean;
  onSendPrompt: (prompt: string) => void;
  onCreateProject: (title: string, goal: string) => void;
  onViewVisualFlow: (data: StructuredWorkspaceData) => void;
  onRetry?: () => void;
}> = ({ msg, isLight, onSendPrompt, onCreateProject, onViewVisualFlow, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";
  const { display, structured } = parseResponse(msg.content);

  const copyContent = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end mb-4 sm:mb-6 w-full">
        {msg.imagePreview && (
          <div className="mb-2 max-w-[280px] rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-md">
            <img src={msg.imagePreview} alt="User attachment" className="w-full h-auto object-cover max-h-60" />
          </div>
        )}
        <div
          className={`max-w-[88%] sm:max-w-[75%] px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl rounded-br-sm text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-wrap break-words ${
            isLight
              ? "bg-[#E6F9F4] text-slate-900 border border-[#20D9B0]/40"
              : "bg-[#27E6B5]/10 text-[#F1F5F9] border border-[#27E6B5]/20"
          }`}
        >
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 sm:mb-8 group w-full min-w-0">
      {/* AI Header */}
      <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#20D9B0] to-[#8B5CF6] flex items-center justify-center flex-shrink-0 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-[12px] font-semibold text-[#20D9B0] tracking-wide">ThinkFlow AI</span>
      </div>

      {/* Content */}
      <div className="pl-0 sm:pl-8 min-w-0 break-words">
        {msg.content === "THINKING" ? (
          <div className="flex items-center gap-1.5 py-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#20D9B0] animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-[#20D9B0] animate-pulse [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-[#20D9B0] animate-pulse [animation-delay:300ms]" />
          </div>
        ) : msg.is_error ? (
          <div className={`p-4 rounded-xl border text-xs max-w-xl ${
            isLight
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-rose-500/05 border-rose-500/20 text-rose-300"
          }`}>
            <div className="flex items-start gap-2.5 mb-3">
              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 leading-relaxed">
                <p className={`font-semibold mb-1 ${isLight ? "text-rose-900" : "text-rose-200"}`}>Service Notice</p>
                <p>{msg.content}</p>
              </div>
            </div>
            {onRetry && (
              <div className={`flex items-center gap-2 mt-2 pt-2 border-t ${isLight ? "border-rose-200" : "border-rose-500/10"}`}>
                <button
                  onClick={onRetry}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    isLight
                      ? "bg-rose-100 hover:bg-rose-200 text-rose-900"
                      : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-200"
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry Request
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {renderMarkdown(display, isLight)}

            {/* Structured Interactive Workspace Renderers */}
            {structured && (
              <>
                {(structured.workspace === "roadmap" || structured.intent === "LEARNING_ROADMAP" || structured.intent === "LEARNING") && (
                  <RoadmapWorkspace
                    data={structured}
                    isLight={isLight}
                    onSendPrompt={onSendPrompt}
                    onCreateProject={onCreateProject}
                    onViewVisualFlow={onViewVisualFlow}
                  />
                )}

                {(structured.workspace === "learning" || structured.intent === "DAILY_LEARNING") && (
                  <DailyLearningWorkspace
                    data={structured}
                    isLight={isLight}
                    onSendPrompt={onSendPrompt}
                    onViewVisualFlow={onViewVisualFlow}
                  />
                )}

                {(structured.workspace === "project" || structured.workspace === "planning" || structured.intent === "PROJECT_PLAN" || structured.intent === "PROJECT" || structured.intent === "BUSINESS_PLAN" || structured.intent === "BUSINESS_IDEA") && (
                  <ProjectWorkspace
                    data={structured}
                    isLight={isLight}
                    onSendPrompt={onSendPrompt}
                    onCreateProject={onCreateProject}
                    onViewVisualFlow={onViewVisualFlow}
                  />
                )}

                {(structured.workspace === "risk" || structured.intent === "RISK_ANALYSIS") && (
                  <RiskWorkspace
                    data={structured}
                    isLight={isLight}
                    onSendPrompt={onSendPrompt}
                    onViewVisualFlow={onViewVisualFlow}
                  />
                )}

                {(structured.workspace === "decision" || structured.intent === "DECISION") && (
                  <DecisionWorkspace
                    data={structured}
                    isLight={isLight}
                    onSendPrompt={onSendPrompt}
                    onViewVisualFlow={onViewVisualFlow}
                  />
                )}

                {(structured.workspace === "timeline" || structured.intent === "TIMELINE") && (
                  <TimelineWorkspace
                    data={structured}
                    isLight={isLight}
                    onSendPrompt={onSendPrompt}
                    onViewVisualFlow={onViewVisualFlow}
                  />
                )}
              </>
            )}

            {/* Copy button */}
            <button
              onClick={copyContent}
              className={`mt-2 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-[11px] transition-all cursor-pointer ${
                isLight ? "text-slate-400 hover:text-slate-700" : "text-[#475569] hover:text-[#94A3B8]"
              }`}
            >
              {copied ? <Check className="w-3 h-3 text-[#20D9B0]" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ── Composer (Gemini-style) ───────────────────────────────────────────────────
const Composer: React.FC<{
  onSend: (text: string, image?: SelectedImage | null) => void;
  isStreaming: boolean;
  isLight: boolean;
}> = ({ onSend, isStreaming, isLight }) => {
  const [text, setText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const submit = () => {
    const trimmed = text.trim();
    if ((!trimmed && !selectedImage) || isStreaming) return;
    onSend(trimmed, selectedImage);
    setText("");
    setSelectedImage(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // Close plus attachment popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setSelectedImage({ file, previewUrl, name: file.name });
      setMenuOpen(false);
    }
  };

  const handleRemoveImage = () => {
    if (selectedImage?.previewUrl) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Main Composer Box */}
      <div
        className={`rounded-3xl transition-all duration-200 p-2.5 sm:p-3 relative ${
          isLight
            ? "bg-white border border-slate-300/80 shadow-lg shadow-slate-200/50 focus-within:border-[#20D9B0] focus-within:ring-2 focus-within:ring-[#20D9B0]/20"
            : "bg-[#0C1220]/95 border border-slate-700/60 shadow-2xl focus-within:border-[#20D9B0]/60 focus-within:ring-2 focus-within:ring-[#20D9B0]/15"
        }`}
      >
        {/* Selected Image Thumbnail Preview */}
        {selectedImage && (
          <div className="px-3 pt-2 pb-1 flex items-center">
            <div className="relative group inline-block">
              <img
                src={selectedImage.previewUrl}
                alt={selectedImage.name}
                className="w-14 h-14 object-cover rounded-xl border border-slate-300 dark:border-slate-700 shadow-md"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 text-white hover:bg-rose-500 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder="Describe a goal, problem, or idea..."
          rows={1}
          className={`w-full bg-transparent text-sm leading-relaxed resize-none outline-none px-3 pt-2 pb-1.5 font-normal ${
            isLight
              ? "text-slate-900 placeholder:text-slate-400"
              : "text-[#F1F5F9] placeholder:text-[#64748B]"
          }`}
          style={{ minHeight: "44px", maxHeight: "160px" }}
        />

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-end pt-1 px-1">
          {/* Right: Send Button */}
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim() || isStreaming}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer ${
              text.trim() && !isStreaming
                ? "bg-gradient-to-r from-[#20D9B0] to-[#159FB5] text-[#03110F] shadow-md shadow-teal-500/25 hover:scale-105 active:scale-95"
                : isLight
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
            }`}
            title="Send (Enter)"
          >
            {isStreaming ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-[#03110F]/30 border-t-[#03110F] animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Theme Selector Dropdown Component ─────────────────────────────────────────
const ThemeSelector: React.FC<{ isLight: boolean }> = ({ isLight }) => {
  const { themePreference, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options: { id: ThemePreference; label: string; icon: React.ReactNode }[] = [
    { id: "system", label: "System", icon: <Monitor className="w-3.5 h-3.5" /> },
    { id: "light", label: "Light", icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
    { id: "dark", label: "Dark", icon: <Moon className="w-3.5 h-3.5 text-indigo-400" /> },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 ${
          isLight
            ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            : "text-[#64748B] hover:text-[#94A3B8] hover:bg-white/5"
        }`}
        title="Theme settings"
      >
        {themePreference === "light" ? (
          <Sun className="w-3.5 h-3.5 text-amber-500" />
        ) : themePreference === "dark" ? (
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
        ) : (
          <Monitor className="w-3.5 h-3.5" />
        )}
      </button>

      {open && (
        <div
          className={`absolute bottom-full mb-2 right-0 w-36 rounded-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 ${
            isLight
              ? "bg-white border border-slate-200 shadow-xl"
              : "bg-[#0A101C] border border-slate-700/80 shadow-2xl"
          }`}
        >
          <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
            isLight ? "text-slate-400" : "text-slate-500"
          }`}>
            Theme
          </div>
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => {
                setTheme(opt.id);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                themePreference === opt.id
                  ? isLight
                    ? "text-[#159FB5] font-semibold bg-slate-50"
                    : "text-[#20D9B0] font-semibold bg-white/5"
                  : isLight
                  ? "text-slate-700 hover:bg-slate-100"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                {opt.icon}
                <span>{opt.label}</span>
              </div>
              {themePreference === opt.id && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main ChatPage ──────────────────────────────────────────────────────────────
export const ChatPage: React.FC<{ initialGoal?: string; initialIdea?: string }> = ({ initialGoal, initialIdea }) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUserPrompt, setLastUserPrompt] = useState<string>("");
  const [flowModalData, setFlowModalData] = useState<StructuredWorkspaceData | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initialProcessedRef = useRef(false);

  const loadConversations = async () => {
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const r = await fetch(`${API}/chat/conversations`, {
        credentials: "include",
        headers,
      });
      if (r.ok) setConversations(await r.json());
    } catch {}
  };

  const loadConversation = async (convId: string) => {
    setActiveConvId(convId);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const r = await fetch(`${API}/chat/conversations/${convId}/messages`, {
        credentials: "include",
        headers,
      });
      if (r.ok) {
        const msgs: Message[] = await r.json();
        setMessages(msgs);
      }
    } catch {}
  };

  const newConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    await fetch(`${API}/chat/conversations/${convId}`, {
      method: "DELETE",
      credentials: "include",
      headers,
    });
    if (activeConvId === convId) newConversation();
    setConversations(prev => prev.filter(c => c.id !== convId));
  };

  const sendMessage = useCallback(
    async (content: string, image?: SelectedImage | null) => {
      if (isStreaming) return;
      setLastUserPrompt(content);

      // Check if user is asking to show visual flow for the latest structured response
      const lower = content.toLowerCase();
      if (
        (lower.includes("show me visually") || lower.includes("show as flow") || lower.includes("visual roadmap") || lower.includes("show visually")) &&
        messages.length > 0
      ) {
        // Find latest structured message
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].structured) {
            setFlowModalData(messages[i].structured!);
            break;
          }
        }
      }

      let imageBase64: string | undefined = undefined;
      let imageMimeType: string | undefined = undefined;
      if (image?.file) {
        imageMimeType = image.file.type || "image/jpeg";
        imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(image.file);
        });
      }

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content,
        created_at: new Date().toISOString(),
        imagePreview: image?.previewUrl,
      };
      const thinkingMsg: Message = {
        id: `t-${Date.now()}`,
        role: "assistant",
        content: "THINKING",
      };

      setMessages(prev => [...prev, userMsg, thinkingMsg]);
      setIsStreaming(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      let assistantId = thinkingMsg.id;
      let fullText = "";
      let convId = activeConvId;

      try {
        const token = getToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const r = await fetch(`${API}/chat/send`, {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({
            conversation_id: convId,
            content,
            provider: "gemini",
            image_base64: imageBase64,
            image_mime_type: imageMimeType,
          }),
          signal: ctrl.signal,
        });

        if (!r.ok) {
          const errData = await r.json().catch(() => null);
          throw new Error(errData?.detail || `Backend connection failed with status ${r.status}`);
        }

        const reader = r.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            try {
              const payload = JSON.parse(trimmed.slice(6));
              if (payload.type === "meta") {
                convId = payload.conversation_id;
                if (payload.message_id) {
                  assistantId = payload.message_id;
                }
                if (!activeConvId && convId) {
                  setActiveConvId(convId);
                }
              } else if (payload.type === "chunk") {
                fullText += payload.text;
                const curText = fullText;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === thinkingMsg.id || m.id === assistantId
                      ? { ...m, id: assistantId, content: curText, is_error: false }
                      : m
                  )
                );
              } else if (payload.type === "error") {
                const errMsg = payload.message || "AI couldn't respond. Please try again.";
                setMessages(prev =>
                  prev.map(m =>
                    m.id === thinkingMsg.id || m.id === assistantId
                      ? { ...m, id: assistantId, content: errMsg, is_error: true }
                      : m
                  )
                );
              } else if (payload.type === "done") {
                const { structured } = parseResponse(fullText);
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId ? { ...m, structured: structured || m.structured } : m
                  )
                );
              }
            } catch {}
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          const msg = err.message && !err.message.includes("Failed to fetch") ? err.message : "AI couldn't respond. Please try again.";
          setMessages(prev =>
            prev.map(m =>
              m.id === thinkingMsg.id || m.id === assistantId
                ? {
                    ...m,
                    id: assistantId,
                    content: msg,
                    is_error: true,
                  }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        loadConversations();
      }
    },
    [isStreaming, activeConvId, messages]
  );

  const handleRetry = () => {
    if (lastUserPrompt) {
      setMessages(prev => prev.filter(m => !m.is_error && m.content !== "THINKING"));
      sendMessage(lastUserPrompt);
    }
  };

  const handleCreateProject = async (title: string, goal: string) => {
    try {
      const proj = await api.createProject({
        title,
        description: goal || title,
        category: "Software",
        goal: goal || title,
      });
      window.location.href = `/project/${proj.id}`;
    } catch {
      window.location.href = `/create?idea=${encodeURIComponent(title)}`;
    }
  };
  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-send initial goal if provided
  useEffect(() => {
    const goal = initialGoal || initialIdea;
    if (goal && !initialProcessedRef.current) {
      initialProcessedRef.current = true;
      try {
        window.history.replaceState({}, '', '/chat');
      } catch {}
      sendMessage(goal);
    }
  }, [initialGoal, initialIdea, sendMessage]);

  // Scroll to bottom on messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" });
    }
  }, [messages, isStreaming]);

  return (
    <div
      className={`h-screen flex overflow-hidden transition-colors duration-200 relative ${
        isLight ? "bg-[#f3f1ff] text-slate-900" : "bg-[#12102a] text-[#eeeaff]"
      }`}
    >
      {/* Exact purple constellation / connected-nodes background from thinker.html */}
      <ConstellationBackground isLight={isLight} />

      {/* Interactive React Flow Diagram Modal */}
      <InteractiveFlowModal
        isOpen={!!flowModalData}
        onClose={() => setFlowModalData(null)}
        data={flowModalData}
        isLight={isLight}
      />

      {/* Mobile Drawer Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar / History Drawer ────────────────────────────────────────── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:relative md:z-20 flex-shrink-0 flex flex-col transition-all duration-300 border-r ${
          sidebarOpen
            ? "translate-x-0 w-72 max-w-[85vw] md:w-64 md:translate-x-0 shadow-2xl md:shadow-none"
            : "-translate-x-full md:translate-x-0 w-72 max-w-[85vw] md:w-0 md:overflow-hidden pointer-events-none md:pointer-events-auto"
        } ${
          isLight
            ? "bg-white border-slate-200/90 shadow-sm md:bg-white/80 md:backdrop-blur-xl"
            : "bg-[#161338] border-white/10 md:bg-[#161338]/85 md:backdrop-blur-xl"
        }`}
      >
        {sidebarOpen && (
          <>
            {/* Logo + New + Mobile Close */}
            <div
              className={`p-4 border-b flex items-center justify-between flex-shrink-0 ${
                isLight ? "border-slate-200/80" : "border-white/10"
              }`}
            >
              <a href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#20D9B0] to-[#8B5CF6] p-0.5 shadow-sm">
                  <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isLight ? "bg-white" : "bg-[#12102a]"}`}>
                    <Sparkles className="w-3.5 h-3.5 text-[#20D9B0]" />
                  </div>
                </div>
                <span className={`font-bold text-sm ${isLight ? "text-slate-900" : "text-white"}`}>ThinkFlow</span>
              </a>
              <div className="flex items-center gap-1">
                <button
                  onClick={newConversation}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    isLight
                      ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      : "text-[#64748B] hover:text-[#27E6B5] hover:bg-white/5"
                  }`}
                  title="New conversation"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={`md:hidden p-1.5 rounded-lg transition-all cursor-pointer ${
                    isLight
                      ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      : "text-[#64748B] hover:text-white hover:bg-white/5"
                  }`}
                  title="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Nav links */}
            <div className="px-3 py-2 flex-shrink-0">
              <a
                href="/dashboard"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                  isLight
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
                    : "text-[#64748B] hover:text-[#94A3B8] hover:bg-white/5"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#20D9B0]" />
                Project Dashboard
              </a>
            </div>

            {/* Search History */}
            <div className="px-3 pb-1 flex-shrink-0">
              <div className="relative">
                <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs outline-none transition-colors ${
                    isLight
                      ? "bg-slate-100 text-slate-900 placeholder-slate-400 focus:bg-slate-200/70"
                      : "bg-white/5 text-white placeholder-slate-500 focus:bg-white/10"
                  }`}
                />
              </div>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
              <p className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isLight ? "text-slate-400" : "text-[#334155]"}`}>
                Recent
              </p>
              {conversations.length === 0 && (
                <p className={`px-3 py-2 text-[11px] ${isLight ? "text-slate-400" : "text-[#334155]"}`}>
                  No conversations yet
                </p>
              )}
              {conversations
                .filter(conv => !searchQuery.trim() || conv.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    role="button"
                    tabIndex={0}
                    className={`w-full text-left flex items-start justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer group ${
                      activeConvId === conv.id
                        ? isLight
                          ? "bg-teal-50 text-slate-900 border border-teal-200 font-medium"
                          : "bg-[#27E6B5]/10 text-[#F1F5F9] border border-[#27E6B5]/20"
                        : isLight
                        ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        : "text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <MessageSquare className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${activeConvId === conv.id ? "text-[#20D9B0]" : "text-slate-400"}`} />
                      <span className="line-clamp-2 leading-snug">{conv.title}</span>
                    </div>
                    <button
                      onClick={e => deleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-500 transition-all cursor-pointer flex-shrink-0"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
            </div>

            {/* User footer */}
            <div
              className={`p-3 border-t flex items-center justify-between flex-shrink-0 ${
                isLight ? "border-slate-200/80 bg-slate-50/50" : "border-white/10 bg-[#12102a]/50"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#20D9B0] to-[#19C7D9] text-[#03110F] font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                  {user?.full_name ? user.full_name[0].toUpperCase() : "U"}
                </div>
                <span className={`text-xs truncate font-medium ${isLight ? "text-slate-700" : "text-[#a9a3d6]"}`}>
                  {user?.full_name || user?.email}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ThemeSelector isLight={isLight} />
                <button
                  onClick={logout}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    isLight ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50" : "text-[#a9a3d6] hover:text-rose-400 hover:bg-white/5"
                  }`}
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 w-full h-full relative z-10 overflow-hidden">
        {/* Top bar */}
        <div
          className={`h-12 flex items-center justify-between px-3 sm:px-4 flex-shrink-0 border-b ${
            isLight
              ? "border-slate-200/80 bg-white/70 backdrop-blur-xl"
              : "border-white/10 bg-[#12102a]/60 backdrop-blur-xl"
          }`}
        >
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
              isLight ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100" : "text-[#a9a3d6] hover:text-white hover:bg-white/5"
            }`}
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {activeConvId && (
              <button
                onClick={newConversation}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  isLight
                    ? "text-slate-700 hover:bg-slate-100 border border-slate-200 font-medium"
                    : "text-[#a9a3d6] hover:text-white hover:bg-white/5 border border-white/10"
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">New Conversation</span><span className="sm:hidden">New</span>
              </button>
            )}
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          {messages.length === 0 ? (
            /* Clean Center Hero */
            <div className="h-full flex flex-col items-center justify-center px-4 sm:px-6 pb-20 sm:pb-28">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#20D9B0] to-[#8B5CF6] p-0.5 mb-4 sm:mb-6 shadow-md">
                <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${isLight ? "bg-white" : "bg-[#12102a]"}`}>
                  <Sparkles className="w-6 h-6 text-[#20D9B0]" />
                </div>
              </div>
              <h1 className={`text-xl sm:text-3xl font-bold mb-2 text-center tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                Where will your idea take you?
              </h1>
              <p className={`text-xs sm:text-sm text-center max-w-md ${isLight ? "text-slate-500" : "text-[#64748B]"}`}>
                Describe a goal, problem, or idea — ThinkFlow will understand your intent and build the path forward.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-4 sm:pt-8 pb-4 sm:pb-6 w-full min-w-0">
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isLight={isLight}
                  onSendPrompt={sendMessage}
                  onCreateProject={handleCreateProject}
                  onViewVisualFlow={(d) => setFlowModalData(d)}
                  onRetry={handleRetry}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Composer Area */}
        <div className="flex-shrink-0 px-3 sm:px-4 pb-3 sm:pb-4 pt-2 max-w-3xl mx-auto w-full min-w-0">
          <Composer
            onSend={sendMessage}
            isStreaming={isStreaming}
            isLight={isLight}
          />
          <p className={`text-center text-[10px] mt-1.5 sm:mt-2 ${isLight ? "text-slate-400 font-medium" : "text-[#334155]"}`}>
            ThinkFlow AI — Turn ideas into action.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
