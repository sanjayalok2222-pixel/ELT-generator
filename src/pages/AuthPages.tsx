import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface AuthPagesProps {
  initialState: 'login' | 'signup';
  setActivePage: (page: string) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({ initialState, setActivePage }) => {
  const { signIn, signUp, resetPassword } = useAuth();
  
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>((initialState as any) || 'login');
  
  // Form fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');

  // Status indicators
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetEmail = email.trim();
    if (!targetEmail) {
      setErrorMessage("Please enter your email address.");
      setLoading(false);
      return;
    }

    try {
      if (view === 'login') {
        const { error } = await signIn(targetEmail, password);
        if (error) throw new Error(error.message || "Failed to log in.");
        setActivePage('dashboard');
      } else if (view === 'signup') {
        const trimmedName = fullName.trim();
        if (!trimmedName) throw new Error("Full name is required for registration.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters long.");

        const { error } = await signUp(targetEmail, password, trimmedName);
        if (error) throw new Error(error.message || "Registration failed.");
        
        // Show mock or real success notice
        setSuccessMessage("Account created successfully! Redirecting...");
        setTimeout(() => {
          setActivePage('dashboard');
        }, 1500);
      } else if (view === 'forgot') {
        const { error } = await resetPassword(targetEmail);
        if (error) throw new Error(error.message || "Email not found.");
        setSuccessMessage("Password reset email sent! Check your inbox.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 relative">
      
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl -z-10" />

      {/* Main card */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl w-full max-w-md p-8 md:p-10 shadow-2xl glass-panel relative">
        
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl text-white shadow-lg shadow-blue-500/20 mb-3.5">
            <Layers size={26} />
          </div>
          <h2 className="font-extrabold text-xl bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent">ELT Generator</h2>
          
          <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
            {view === 'login' && 'Sign in to access your developer dashboard'}
            {view === 'signup' && 'Register an account to begin documentation parsing'}
            {view === 'forgot' && 'Reset your user password credentials'}
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3.5 mb-5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-start space-x-2.5 animate-in fade-in slide-in-from-top-1">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success notification */}
        {successMessage && (
          <div className="p-3.5 mb-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-start space-x-2.5 animate-in fade-in slide-in-from-top-1">
            <CheckCircle size={15} className="mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Auth Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name (Signup Only) */}
          {view === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input 
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-705 dark:text-slate-300"
                  placeholder="Jane Doe"
                  required
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-705 dark:text-slate-300"
                placeholder="developer@eltgen.io"
                required
              />
            </div>
          </div>

          {/* Password (Hide for Forgot) */}
          {view !== 'forgot' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400">Password</label>
                {view === 'login' && (
                  <button 
                    type="button"
                    onClick={() => { setView('forgot'); setErrorMessage(null); setSuccessMessage(null); }}
                    className="text-[10px] font-bold text-blue-500 hover:text-blue-600"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-705 dark:text-slate-300"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-95 shadow-md shadow-blue-500/10 flex items-center justify-center space-x-1.5 transition-all text-xs"
          >
            <span>
              {loading ? 'Processing...' : (
                view === 'login' ? 'Sign In' : (view === 'signup' ? 'Create Account' : 'Send Reset Link')
              )}
            </span>
            <ArrowRight size={14} />
          </button>

        </form>

        {/* Toggle navigation link */}
        <div className="text-center mt-6 text-xs text-slate-400">
          {view === 'login' && (
            <p>
              Don't have an account?{' '}
              <button 
                onClick={() => { setView('signup'); setErrorMessage(null); setSuccessMessage(null); }}
                className="font-bold text-blue-500 hover:text-blue-600"
              >
                Sign Up
              </button>
            </p>
          )}
          {view === 'signup' && (
            <p>
              Already have an account?{' '}
              <button 
                onClick={() => { setView('login'); setErrorMessage(null); setSuccessMessage(null); }}
                className="font-bold text-blue-500 hover:text-blue-600"
              >
                Sign In
              </button>
            </p>
          )}
          {view === 'forgot' && (
            <button 
              onClick={() => { setView('login'); setErrorMessage(null); setSuccessMessage(null); }}
              className="font-bold text-blue-500 hover:text-blue-600 flex items-center justify-center space-x-1 mx-auto"
            >
              <ArrowRight className="rotate-180" size={12} />
              <span>Back to Sign In</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
