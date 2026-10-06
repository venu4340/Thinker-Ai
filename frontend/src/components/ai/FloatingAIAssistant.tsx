import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send, X, MessageSquare, Loader2, ChevronDown, HelpCircle } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const FloatingAIAssistant: React.FC = () => {
  const { project, askNodeAdvice } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your ThinkFlow AI Strategy Assistant. Ask me anything about project risks, architecture, bottlenecks, or task priorities.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'How can I reduce project risk?',
    'Which task should I prioritize first?',
    'What dependencies might be missing?',
    'Is this timeline realistic?',
    'What key technical resources do I need?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  if (!project) return null;

  const handleSendMessage = async (textToSend: string) => {
    const query = textToSend.trim();
    if (!query || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setIsLoading(true);

    try {
      const res = await askNodeAdvice(
        project.id,
        'project',
        { title: project.title, goal: project.goal, category: project.category },
        query
      );
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.advice + (res.steps?.length ? '\n\nKey Steps:\n' + res.steps.map((s) => `• ${s}`).join('\n') : ''),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I encountered an issue analyzing this request. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-gradient-to-r from-[#20D9B0] to-[#159FB5] text-[#03110F] shadow-2xl shadow-teal-500/30 hover:scale-105 transition-all duration-200 cursor-pointer flex items-center gap-2 group"
        title="ThinkFlow AI Assistant"
      >
        <Bot className="w-5 h-5 text-[#03110F]" />
        <span className="text-xs font-bold hidden sm:inline text-[#03110F]">
          {isOpen ? 'Close Assistant' : 'Ask ThinkFlow AI'}
        </span>
      </button>

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 z-40 w-full max-w-sm sm:max-w-md h-[520px] bg-[#0C1220]/95 border border-slate-700/60 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 bg-[#080D16]/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#27E6B5]/15 border border-[#27E6B5]/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#27E6B5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">ThinkFlow AI Assistant</h4>
                <p className="text-[10px] text-slate-400">Context-grounded project strategist</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-[#20D9B0] to-[#159FB5] text-[#03110F] font-medium shadow-sm'
                      : 'bg-[#080D16] border border-slate-800/80 text-slate-200'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 bg-[#080D16] border border-slate-800 p-3 rounded-2xl w-fit">
                <Loader2 className="w-3.5 h-3.5 text-[#27E6B5] animate-spin" />
                <span>Analyzing project graph...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts Pills */}
          <div className="px-3 py-2 border-t border-slate-800/60 bg-[#080D16]/60 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-[#0C1220] hover:bg-[#101827] text-slate-400 hover:text-[#27E6B5] border border-slate-800 text-[10px] transition-colors cursor-pointer shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="p-3 border-t border-slate-800/80 bg-[#080D16] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about this project..."
              className="flex-1 bg-[#0C1220] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 rounded-xl bg-[#27E6B5] text-[#03110F] hover:brightness-105 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
