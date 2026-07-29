import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  Layers, 
  ArrowDownToLine, 
  UploadCloud, 
  RefreshCw, 
  BookOpen, 
  Sparkles, 
  ArrowRightLeft
} from 'lucide-react';

interface LandingPageProps {
  setActivePage: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setActivePage }) => {
  const { user, signIn, signUp } = useAuth();

  const handleViewDemo = async () => {
    // Log in a demo user using mock storage
    const demoEmail = 'guest@eltgenerator.demo';
    const demoPassword = 'password123';
    
    // Register first in mock storage if not exists
    await signUp(demoEmail, demoPassword, 'Guest Developer');
    const { error } = await signIn(demoEmail, demoPassword);
    
    if (!error) {
      setActivePage('dashboard');
    }
  };

  const handleGetStarted = () => {
    if (user) {
      setActivePage('dashboard');
    } else {
      setActivePage('login');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col justify-between overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />

      {/* Navigation Top bar (Landing state only) */}
      <div className="flex justify-between items-center py-6 px-4 md:px-12 w-full max-w-7xl mx-auto">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Layers size={22} />
          </div>
          <span className="font-extrabold text-xl bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent">ELT Generator</span>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <button 
              onClick={() => setActivePage('dashboard')}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button 
                onClick={() => setActivePage('login')}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => setActivePage('signup')}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto py-12 md:py-20">
        
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 text-xs font-semibold mb-8 animate-pulse">
          <Sparkles size={12} />
          <span>Powered by Gemini Heuristic Engine</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none mb-6">
          Turn Complex ELT Scripts into{' '}
          <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Clear Documentation
          </span>
        </h1>

        {/* Description */}
        <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Upload or paste your SQL, Python, PySpark, or dbt script and automatically generate structured, easy-to-understand technical documentation and interactive data flows.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 w-full sm:w-auto">
          <button
            onClick={handleGetStarted}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-95 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <span>Get Started Free</span>
            <ArrowRight size={18} />
          </button>
          
          <button
            onClick={handleViewDemo}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800 shadow-sm transition-all flex items-center justify-center space-x-2"
          >
            <span>View Demo</span>
          </button>
        </div>

        {/* ELT Workflow Visual Diagram */}
        <div className="w-full max-w-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800/80 rounded-2xl p-6 md:p-8 shadow-xl relative glass-panel">
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-6 uppercase tracking-widest text-center">
            How it works
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-3 shadow-md shadow-blue-500/5">
                <ArrowDownToLine size={20} />
              </div>
              <span className="font-bold text-sm block mb-1">1. Extract</span>
              <p className="text-xs text-slate-400 max-w-[140px] text-center">Identifies databases, source tables, CSVs, or REST API nodes.</p>
            </div>

            {/* Arrow md:show */}
            <div className="hidden md:flex absolute top-6 left-[18%] text-slate-300 dark:text-navy-800">
              <ArrowRightLeft size={16} />
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-3 shadow-md shadow-emerald-500/5">
                <UploadCloud size={20} />
              </div>
              <span className="font-bold text-sm block mb-1">2. Load</span>
              <p className="text-xs text-slate-400 max-w-[140px] text-center">Pinpoints destination endpoints and load processes (Merge/Insert).</p>
            </div>

            {/* Arrow md:show */}
            <div className="hidden md:flex absolute top-6 left-[43%] text-slate-300 dark:text-navy-800">
              <ArrowRightLeft size={16} />
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mb-3 shadow-md shadow-purple-500/5">
                <RefreshCw size={20} />
              </div>
              <span className="font-bold text-sm block mb-1">3. Transform</span>
              <p className="text-xs text-slate-400 max-w-[140px] text-center">Parses filtering conditions, field maps, and joins.</p>
            </div>

            {/* Arrow md:show */}
            <div className="hidden md:flex absolute top-6 left-[68%] text-slate-300 dark:text-navy-800">
              <ArrowRightLeft size={16} />
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-3 shadow-md shadow-rose-500/5">
                <BookOpen size={20} />
              </div>
              <span className="font-bold text-sm block mb-1">4. Document</span>
              <p className="text-xs text-slate-400 max-w-[140px] text-center">Generates technical files and visual maps instantly.</p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
