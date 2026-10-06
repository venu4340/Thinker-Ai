import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateProjectPage } from './pages/CreateProjectPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ChatPage } from './pages/ChatPage';

const Router: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { isAuthenticated, isLoading, handleGoogleCallback } = useAuth();

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
    if (currentPath === '/auth/google/callback') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        handleGoogleCallback(token).then(() => {
          const redirect = sessionStorage.getItem('auth_redirect') || '/thinker.html';
          sessionStorage.removeItem('auth_redirect');
          window.location.href = redirect;
        });
      } else {
        window.location.href = '/login';
      }
    }
  }, [currentPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05080D] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-[#27E6B5]/30 border-t-[#27E6B5] animate-spin" />
      </div>
    );
  }

  if (currentPath === '/' || currentPath === '' || currentPath === '/projects' || currentPath === '/thinker') {
    window.location.replace('/thinker.html');
    return null;
  }
  if (currentPath === '/login') return <LoginPage />;
  if (currentPath === '/register') return <RegisterPage />;
  if (currentPath === '/auth/google/callback') {
    // Show a loading spinner while processing
    return (
      <div className="min-h-screen bg-[#05080D] flex items-center justify-center flex-col gap-4">
        <div className="w-6 h-6 rounded-full border-2 border-[#27E6B5]/30 border-t-[#27E6B5] animate-spin" />
        <p className="text-slate-400 text-sm">Signing in with Google...</p>
      </div>
    );
  }

  // Protected routes — redirect to login if not authenticated
  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }

  if (currentPath === '/dashboard') return <DashboardPage />;

  if (currentPath === '/chat') {
    const params = new URLSearchParams(window.location.search);
    const goal = params.get('goal') || params.get('idea');
    return <ChatPage initialGoal={goal || undefined} />;
  }


  if (currentPath === '/create') return <CreateProjectPage />;

  if (currentPath.startsWith('/project/')) {
    const projectId = currentPath.replace('/project/', '').split('/')[0];
    return (
      <ProjectProvider>
        <ProjectDetailPage projectId={projectId} />
      </ProjectProvider>
    );
  }

  window.location.replace('/thinker.html');
  return null;
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
