import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { AuthPages } from './pages/AuthPages';
import { Dashboard } from './pages/Dashboard';
import { NewAnalysis } from './pages/NewAnalysis';
import { AnalysisResult } from './pages/AnalysisResult';
import { History } from './pages/History';
import { ProfileSettings } from './pages/ProfileSettings';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  
  // Routing state
  const [activePage, setActivePage] = useState<string>('landing');
  
  // Shared data flow state
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);

  // Redirect logged in user from landing to dashboard
  useEffect(() => {
    if (user && activePage === 'landing') {
      setActivePage('dashboard');
    }
  }, [user, activePage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <span className="text-xs font-bold text-slate-400 font-mono tracking-widest uppercase">
          Initializing Workspace...
        </span>
      </div>
    );
  }

  // Unauthenticated Views
  if (!user) {
    if (activePage === 'login') {
      return <AuthPages initialState="login" setActivePage={setActivePage} />;
    }
    if (activePage === 'signup') {
      return <AuthPages initialState="signup" setActivePage={setActivePage} />;
    }
    return <LandingPage setActivePage={setActivePage} />;
  }

  // Authenticated Views Layout Routing
  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {activePage === 'dashboard' && (
        <Dashboard 
          setActivePage={setActivePage} 
          setSelectedHistoryItem={setSelectedHistoryItem} 
        />
      )}
      {activePage === 'new-analysis' && (
        <NewAnalysis 
          setActivePage={setActivePage} 
          setSelectedHistoryItem={setSelectedHistoryItem} 
        />
      )}
      {activePage === 'result' && (
        <AnalysisResult 
          item={selectedHistoryItem} 
          setActivePage={setActivePage} 
        />
      )}
      {activePage === 'history' && (
        <History 
          setActivePage={setActivePage} 
          setSelectedHistoryItem={setSelectedHistoryItem} 
        />
      )}
      {activePage === 'profile' && (
        <ProfileSettings />
      )}
      {/* Fallback to dashboard if invalid authenticated route state */}
      {!['dashboard', 'new-analysis', 'result', 'history', 'profile'].includes(activePage) && (
        <Dashboard 
          setActivePage={setActivePage} 
          setSelectedHistoryItem={setSelectedHistoryItem} 
        />
      )}
    </Layout>
  );
};

export default App;
