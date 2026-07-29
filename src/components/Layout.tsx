import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  FileCode, 
  History, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Layers
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
  setSelectedHistoryItem?: (item: any) => void; // helper to jump from history to results
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, setActivePage }) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-analysis', label: 'New Analysis', icon: FileCode },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleLogout = async () => {
    await signOut();
    setActivePage('landing');
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200 transition-colors duration-200">
      
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-800 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg text-white">
            <Layers size={18} />
          </div>
          <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent text-sm">ELT Doc Gen</span>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={toggleTheme} 
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Sidebar (Responsive) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-navy-800 transform 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static transition-transform duration-300 ease-in-out flex flex-col justify-between shadow-lg md:shadow-none
      `}>
        {/* Sidebar Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-navy-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg text-white shadow-md shadow-blue-500/20">
                <Layers size={20} />
              </div>
              <span className="font-extrabold text-lg bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent">ELT Generator</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id || (item.id === 'new-analysis' && activePage === 'result');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-800/50 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'}
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / User Profile */}
        <div className="p-4 border-t border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/20">
          {user && (
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={user.avatarUrl} 
                alt={user.fullName} 
                className="w-10 h-10 rounded-full border border-blue-500/20 p-0.5 object-cover" 
              />
              <div className="overflow-hidden flex-1">
                <h4 className="text-sm font-semibold truncate leading-tight">{user.fullName}</h4>
                <span className="text-xs text-slate-400 truncate block leading-tight">{user.email}</span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Desktop Navbar */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-800 shadow-sm sticky top-0 z-30">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-slate-400">Developer Workspace</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-500 font-mono">v1.0.0</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-50 dark:bg-navy-800 hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-navy-700/50 shadow-sm"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Profile Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-navy-800"
                >
                  <img 
                    src={user.avatarUrl} 
                    alt={user.fullName} 
                    className="w-8 h-8 rounded-full border border-blue-500/20 object-cover" 
                  />
                  <span className="text-sm font-medium pr-1">{user.fullName.split(' ')[0]}</span>
                </button>

                {dropdownOpen && (
                  <>
                    <div 
                      onClick={() => setDropdownOpen(false)}
                      className="fixed inset-0 z-40"
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-navy-800">
                        <span className="block text-xs text-slate-400">Signed in as</span>
                        <span className="block text-sm font-medium truncate">{user.email}</span>
                      </div>
                      <button
                        onClick={() => {
                          setActivePage('profile');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 flex items-center space-x-2"
                      >
                        <User size={14} />
                        <span>Profile Settings</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-t border-slate-100 dark:border-navy-800 flex items-center space-x-2"
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 dark:bg-navy-950/40">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-4 px-8 text-center text-xs text-slate-400 border-t border-slate-200/50 dark:border-navy-900/50 bg-white/50 dark:bg-navy-900/30">
          <p>© {currentYear} ELT Script Documentation Generator. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};
