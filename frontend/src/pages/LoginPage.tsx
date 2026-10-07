import React, { useState } from 'react';
import { Sparkles, Lock, Mail, Play, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { login, demoLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errParam = params.get('error');
    if (errParam) {
      setError(decodeURIComponent(errParam));
    }
  }, []);

  const getRedirectUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect') || '/thinker.html';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      window.location.href = getRedirectUrl();
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    try {
      await demoLogin();
      window.location.href = getRedirectUrl();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#05080D] flex flex-col justify-center items-center p-6 relative selection:bg-[#27E6B5] selection:text-[#03110F]">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[300px] bg-[#19C7D9]/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-[#0C1220]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl relative z-10 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#20D9B0] via-[#19C7D9] to-[#8B5CF6] p-0.5 shadow-lg shadow-teal-500/20">
            <div className="w-full h-full bg-[#05080D] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#27E6B5]" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to ThinkFlow</h2>
          <p className="text-xs text-slate-400">Sign in to your visual planning workspace</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Email + Password Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-[#05080D] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#27E6B5] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#05080D] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#27E6B5] transition-colors"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" isLoading={isLoading} className="w-full py-2.5 text-xs font-bold shadow-lg shadow-teal-500/20">
            Sign In
          </Button>
        </form>

        {/* Divider — "or" */}
        <div className="flex items-center gap-3">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">or</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* Demo Login Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full p-3.5 rounded-2xl bg-[#27E6B5]/10 hover:bg-[#27E6B5]/20 border border-[#27E6B5]/30 text-[#27E6B5] font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer group"
        >
          <Play className="w-4 h-4 text-[#27E6B5] group-hover:scale-110 transition-transform" />
          <span>Explore as Demo User</span>
        </button>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <a href={`/register${window.location.search}`} className="text-[#27E6B5] hover:underline font-semibold">
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
};
