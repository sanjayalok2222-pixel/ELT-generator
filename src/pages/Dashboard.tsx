import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserHistory } from '../services/analysisEngine';
import { 
  FileCode, 
  ArrowRight, 
  Plus, 
  FileText, 
  Calendar, 
  ArrowUpRight,
  Database
} from 'lucide-react';

interface DashboardProps {
  setActivePage: (page: string) => void;
  setSelectedHistoryItem: (item: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActivePage, setSelectedHistoryItem }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalScripts: 0, totalDocs: 0 });
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const loadDashboardData = async () => {
      try {
        const history = await fetchUserHistory(user.id);
        setRecentItems(history.slice(0, 5));
        setStats({
          totalScripts: history.length,
          totalDocs: history.length // Each analyzed script generates 1 documentation
        });
      } catch (err) {
        console.error("Failed loading dashboard details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const handleQuickUpload = () => {
    setActivePage('new-analysis');
  };

  const handleViewItem = (item: any) => {
    setSelectedHistoryItem(item);
    setActivePage('result');
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'sql': return 'SQL';
      case 'python': return 'Python';
      case 'pyspark': return 'PySpark';
      case 'dbt_sql': return 'dbt SQL';
      default: return lang;
    }
  };

  const getLanguageColor = (lang: string) => {
    switch (lang) {
      case 'sql': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'python': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'pyspark': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'dbt_sql': return 'bg-orange-600/10 text-orange-600 border-orange-600/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative space-y-2">
          <h2 className="text-2xl md:text-3xl font-black">Welcome back, {user?.fullName}!</h2>
          <p className="text-blue-100 max-w-xl text-sm md:text-base">
            Upload or paste your data transformation files to generate interactive mappings and markdown documentation instantly.
          </p>
        </div>
        <button
          onClick={handleQuickUpload}
          className="relative px-5 py-3 rounded-xl font-bold bg-white text-blue-600 hover:bg-slate-50 shadow-lg shadow-black/10 transition-all flex items-center justify-center space-x-1.5 self-start md:self-auto shrink-0"
        >
          <Plus size={18} />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Grid: Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Total Scripts */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-2">
            <span className="text-sm font-semibold text-slate-400">Total Scripts Ingested</span>
            <div className="text-3xl font-black">{loading ? '...' : stats.totalScripts}</div>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 text-blue-500">
            <FileCode size={26} />
          </div>
        </div>

        {/* Total Docs */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-2">
            <span className="text-sm font-semibold text-slate-400">Documentation Generated</span>
            <div className="text-3xl font-black">{loading ? '...' : stats.totalDocs}</div>
          </div>
          <div className="p-4 rounded-xl bg-purple-500/10 text-purple-500">
            <FileText size={26} />
          </div>
        </div>

        {/* Supported Languages */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-2">
            <span className="text-sm font-semibold text-slate-400">Supported Parsers</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/10">SQL</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/10">Python</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-500/10 text-orange-500 border border-orange-500/10">PySpark</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/10">dbt SQL</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Database size={26} />
          </div>
        </div>

      </div>

      {/* Grid: Main Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Scripts & Docs */}
        <div className="lg:col-span-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Recent Analyses</h3>
              <button 
                onClick={() => setActivePage('history')}
                className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center space-x-0.5"
              >
                <span>View All History</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <span className="text-xs text-slate-400">Loading history logs...</span>
              </div>
            ) : recentItems.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-navy-800 rounded-xl">
                <FileCode size={36} className="mx-auto text-slate-300 dark:text-navy-850 mb-3" />
                <h4 className="font-semibold text-slate-500 dark:text-slate-400">No scripts analyzed yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">Upload or paste SQL queries or python files to start mapping pipelines.</p>
                <button
                  onClick={handleQuickUpload}
                  className="mt-4 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                >
                  Upload First Script
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleViewItem(item)}
                    className="group flex items-center justify-between p-3.5 border border-slate-100 dark:border-navy-800 hover:border-blue-500/20 rounded-xl bg-slate-50/50 dark:bg-navy-950/20 hover:bg-white dark:hover:bg-navy-800/40 cursor-pointer transition-all duration-150"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="p-2 bg-slate-100 dark:bg-navy-800 rounded-lg group-hover:bg-blue-500/10 group-hover:text-blue-500 text-slate-500 transition-all shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm truncate group-hover:text-blue-500 transition-colors">{item.name}</h4>
                        <div className="flex items-center space-x-2.5 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${getLanguageColor(item.language)}`}>
                            {getLanguageLabel(item.language)}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center space-x-0.5">
                            <Calendar size={10} />
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-blue-500 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Parser Info sidebar cards */}
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4">Supported Formats</h3>
            <div className="space-y-4">
              
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">SQL Queries (.sql)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">Supports Postgres, Snowflake, Redshift style syntax, joins, aggregates, and schemas mappings.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Python Scripts (.py, .txt)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">Analyzes Pandas dataframe operations, file extracts, and SQL connections.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">PySpark Pipeline Scripts</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">Scrapes Spark Session details, DataFrame loads, S3 paths, and Delta Lake destinations.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">dbt Models (.sql)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">Parses Jinja parameters, dependencies references, and model config materializations.</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
