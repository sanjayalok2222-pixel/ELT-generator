import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  User, 
  Settings, 
  Sun, 
  Moon, 
  Check, 
  RefreshCw, 
  Info
} from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Profile Form state
  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [avatarSeed, setAvatarSeed] = useState<string>(user?.email?.split('@')[0] || 'developer');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentAvatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed}`;

  // Generate random seed for avatar
  const handleRandomizeAvatar = () => {
    const randomStr = Math.random().toString(36).substring(7);
    setAvatarSeed(randomStr);
  };

  // Submit profile edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);

    try {
      const { error } = await updateProfile(fullName, currentAvatarUrl);
      if (error) {
        throw new Error(error.message);
      }
      setSuccessMessage("Profile details updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black">Account Settings</h2>
        <p className="text-sm text-slate-400">Configure profile settings, theme modes, and security configurations.</p>
      </div>

      {/* Success notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm animate-in fade-in slide-in-from-top-1">
          <Check size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid: Settings container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <img 
              src={user?.avatarUrl || currentAvatarUrl} 
              alt={user?.fullName} 
              className="w-24 h-24 rounded-full border-2 border-blue-500/20 p-1 object-cover" 
            />
            <button
              onClick={handleRandomizeAvatar}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all scale-95"
              title="Randomize Avatar seed"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          <div>
            <h3 className="font-extrabold text-base">{user?.fullName}</h3>
            <span className="text-xs text-slate-450 font-mono mt-0.5 block">{user?.email}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/10 border border-blue-500/20 text-blue-500 uppercase tracking-widest">
            Active User Account
          </span>
        </div>

        {/* Profile Settings form */}
        <div className="md:col-span-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="font-extrabold text-sm border-b border-slate-100 dark:border-navy-800 pb-3 flex items-center space-x-2">
            <User size={16} className="text-blue-500" />
            <span>Profile Information</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 block">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-350"
                placeholder="Ex. Jane Doe"
                required
              />
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 block">Email Address (Primary)</label>
              <input 
                type="email" 
                value={user?.email}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-navy-950/40 border border-slate-200 dark:border-navy-800 focus:outline-none text-slate-400 cursor-not-allowed font-mono"
                disabled
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs shadow-md shadow-blue-500/10 flex items-center space-x-1.5 transition-all self-end"
            >
              <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>

          </form>
        </div>

      </div>

      {/* Preferences / Customization Row */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-extrabold text-sm border-b border-slate-100 dark:border-navy-800 pb-3 flex items-center space-x-2">
          <Settings size={16} className="text-purple-500" />
          <span>App Preferences</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Theme Mode Toggle */}
          <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-navy-800 rounded-xl bg-slate-50/50 dark:bg-navy-950/20 shadow-inner">
            <div>
              <h4 className="text-xs font-bold">Theme Mode</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Toggle default app lighting preference.</p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-navy-700/50 bg-white dark:bg-navy-850 hover:bg-slate-50 dark:hover:bg-navy-800 text-xs font-bold flex items-center space-x-1.5 shadow-sm text-slate-700 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-blue-500" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          {/* Database Info panel */}
          <div className="p-4 border border-slate-100 dark:border-navy-800 rounded-xl bg-slate-50/50 dark:bg-navy-950/20 flex items-start space-x-3.5">
            <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold">Database Storage Sync</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                All metrics calculations and schema models are written locally via LocalStorage or real-time Supabase cloud synchronization.
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
