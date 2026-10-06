import React, { useState } from 'react';
import { Sparkles, Lock, Mail, Play, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

// Google "G" logo as inline SVG — matches official branding
const GoogleLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const { login, demoLogin, googleLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      sessionStorage.setItem('auth_redirect', getRedirectUrl());
      await googleLogin();
      // Browser will redirect to Google — no need to handle further
    } catch (err: any) {
      setGoogleLoading(false);
      setError(err.message || 'Google sign-in failed. Please try again.');
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

          <Button type="submit" variant="primary" size="md" isLoading={isLoading && !googleLoading} className="w-full py-2.5 text-xs font-bold shadow-lg shadow-teal-500/20">
            Sign In
          </Button>
        </form>

        {/* Divider — "or" */}
        <div className="flex items-center gap-3">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">or</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading || googleLoading}
          className="w-full p-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-slate-700/60 hover:border-slate-600 text-white font-semibold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <div className="w-4 h-4 rounded-full border-2 border-slate-500 border-t-white animate-spin" />
          ) : (
            <GoogleLogo className="group-hover:scale-110 transition-transform" />
          )}
          <span>Continue with Google</span>
        </button>

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
