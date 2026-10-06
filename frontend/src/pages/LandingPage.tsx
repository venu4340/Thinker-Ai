import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Play, ArrowUp, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const PLACEHOLDERS = [
  "I want to become an AI engineer in 6 months",
  "I want to build an AI app for students",
  "I want to start a fitness business",
  "Launch a SaaS product in 90 days",
  "Build an autonomous AI agent system",
];

export const LandingPage: React.FC = () => {
  const { demoLogin, isAuthenticated } = useAuth();
  const [text, setText] = useState("");
  const [phIdx, setPhIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (text || isFocused || isGenerating) return;
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(t);
  }, [text, isFocused, isGenerating]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const handleProcessGoal = async (goalText: string) => {
    const trimmed = goalText.trim();
    if (!trimmed || isGenerating) return;

    setError(null);
    setIsGenerating(true);
    setGenerationStep("Understanding goal and scope...");

    const steps = [
      "Analyzing goal scope & domain requirements...",
      "Synthesizing sequential phases & milestones...",
      "Generating tasks with technical dependencies...",
      "Simulating potential execution & operational risks...",
      "Rendering visual thinking board & timeline...",
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setGenerationStep(steps[stepIdx]);
        stepIdx++;
      }
    }, 600);

    try {
      if (!isAuthenticated) {
        await demoLogin();
      }

      const project = await api.generateFromGoal(trimmed);
      clearInterval(interval);
      // Immediately open the existing ThinkFlow project dashboard/workspace
      window.location.href = `/project/${project.id}`;
    } catch (err: any) {
      clearInterval(interval);
      setIsGenerating(false);
      setError(err.message || "Failed to generate plan. Please try again.");
    }
  };

  const handleSubmit = () => {
    handleProcessGoal(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleGetStarted = async () => {
    if (isAuthenticated) window.location.href = "/dashboard";
    else {
      await demoLogin();
      window.location.href = "/dashboard";
    }
  };


  return (
    <div className="min-h-screen bg-[#05080D] text-[#F1F5F9] flex flex-col selection:bg-[#27E6B5] selection:text-[#03110F]">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#19C7D9]/06 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-[#27E6B5]/04 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[200px] bg-[#8B5CF6]/04 blur-[100px] rounded-full" />
      </div>

      {/* Navbar */}
      <header className="h-14 border-b border-slate-800/40 bg-[#080D16]/60 backdrop-blur-2xl px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#20D9B0] to-[#8B5CF6] p-0.5">
            <div className="w-full h-full bg-[#05080D] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#27E6B5]" />
            </div>
          </div>
          <span className="font-bold text-sm text-white">
            ThinkFlow <span className="text-[#27E6B5] text-xs font-semibold px-1.5 py-0.5 bg-[#27E6B5]/10 rounded border border-[#27E6B5]/15 ml-0.5">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleGetStarted} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#27E6B5] hover:bg-[#27E6B5]/10 transition-all cursor-pointer">
            <Play className="w-3 h-3" /> Demo
          </button>
          <a href="/login">
            <button className="px-3 py-1.5 rounded-lg text-xs text-[#64748B] hover:text-white border border-slate-800 hover:border-slate-600 hover:bg-white/5 transition-all cursor-pointer bg-transparent">
              Sign In
            </button>
          </a>
          <a href="/register">
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#20D9B0] to-[#159FB5] text-[#03110F] hover:opacity-90 shadow-md shadow-teal-500/15 cursor-pointer">
              Get Started
            </button>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative z-10">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0C1220]/80 border border-[#27E6B5]/20 text-xs text-[#27E6B5] font-semibold backdrop-blur-xl">
            <Sparkles className="w-3 h-3" />
            AI thinking partner for people with ideas
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Where will your idea{" "}
            <span className="bg-gradient-to-r from-[#27E6B5] via-[#19C7D9] to-[#8B5CF6] bg-clip-text text-transparent">
              take you?
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#64748B] max-w-lg mx-auto">
            Describe a goal, problem, or idea — ThinkFlow will turn it into a clear path forward.
          </p>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Input Box / Generating State ───────────────────────── */}
          <div
            className="rounded-2xl mt-6 transition-all duration-300 relative overflow-hidden"
            style={{
              background: "rgba(12,18,32,0.88)",
              border: isFocused ? "1px solid rgba(39,230,181,0.35)" : "1px solid rgba(148,163,184,0.12)",
              backdropFilter: "blur(20px)",
              boxShadow: isFocused
                ? "0 0 0 1px rgba(39,230,181,0.12), 0 20px 60px rgba(0,0,0,0.4)"
                : "0 20px 60px rgba(0,0,0,0.35)",
            }}
          >
            {isGenerating ? (
              <div className="p-8 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-[#27E6B5]/20 border-t-[#27E6B5] animate-spin" />
                  <Sparkles className="w-5 h-5 text-[#27E6B5] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div className="space-y-1.5 text-center">
                  <p className="text-sm font-semibold text-white tracking-wide">
                    {generationStep}
                  </p>
                  <p className="text-xs text-slate-400">
                    Structuring your roadmap, phases, tasks, and visual canvas...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={PLACEHOLDERS[phIdx]}
                  rows={2}
                  className="w-full bg-transparent text-[#F1F5F9] placeholder-[#475569] text-[15px] leading-relaxed resize-none outline-none px-5 pt-5 pb-3 font-medium"
                  style={{ minHeight: "72px", maxHeight: "160px" }}
                />
                <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <span className="text-[#27E6B5]">✦</span>
                    <span>AI Execution Planner</span>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!text.trim() || isGenerating}
                    className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
                      text.trim() && !isGenerating
                        ? "bg-gradient-to-r from-[#20D9B0] to-[#159FB5] text-[#03110F] shadow-md shadow-teal-500/25 hover:scale-105 active:scale-95"
                        : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>


          {/* Quick Ideas */}
          {!isGenerating && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {[
                "I want to become an AI engineer in 6 months",
                "I want to build an AI app for students",
                "I want to start a fitness business",
                "Launch a SaaS product in 90 days",
              ].map(idea => (
                <button
                  key={idea}
                  onClick={() => handleProcessGoal(idea)}
                  className="px-3 py-1.5 rounded-full text-xs text-[#64748B] hover:text-[#27E6B5] bg-white/[0.02] hover:bg-white/[0.05] border border-slate-800/60 hover:border-[#27E6B5]/30 transition-all cursor-pointer"
                >
                  {idea} →
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

