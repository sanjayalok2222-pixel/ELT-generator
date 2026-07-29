import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchUserHistory, 
  deleteHistoryItem 
} from '../services/analysisEngine';
import { 
  Search, 
  Trash2, 
  Eye, 
  Download, 
  RefreshCw, 
  Calendar,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

interface HistoryProps {
  setActivePage: (page: string) => void;
  setSelectedHistoryItem: (item: any) => void;
}

export const History: React.FC<HistoryProps> = ({ setActivePage, setSelectedHistoryItem }) => {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  
  // Modal / Confirm state
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchUserHistory(user.id);
      setHistoryItems(data);
    } catch (err) {
      console.error("Failed loading history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  // View action
  const handleView = (item: any) => {
    setSelectedHistoryItem(item);
    setActivePage('result');
  };

  // Re-analyze action (pre-populates editor and runs it)
  const handleReanalyze = (item: any) => {
    // Navigate to new-analysis page with parameters
    // To make it easy, we can just set editor code states
    // but here we can just open it in NewAnalysis directly.
    // For now we navigate user to new-analysis page and populate it.
    // We can save the selected history code to localstorage as a transfer mechanism
    localStorage.setItem('code_editor_transfer_code', item.code);
    localStorage.setItem('code_editor_transfer_name', item.name);
    localStorage.setItem('code_editor_transfer_lang', item.language);
    setActivePage('new-analysis');
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deleteItemId) return;
    try {
      const ok = await deleteHistoryItem(deleteItemId);
      if (ok) {
        setHistoryItems(prev => prev.filter(item => item.id !== deleteItemId));
      }
    } catch (err) {
      console.error("Failed deleting history log:", err);
    } finally {
      setDeleteItemId(null);
    }
  };

  // Export/Download MD utility
  const handleDownloadMarkdown = (item: any) => {
    const blob = new Blob([item.documentation], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${item.name.split('.')[0]}_documentation.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get matching language label
  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'sql': return 'SQL';
      case 'python': return 'Python';
      case 'pyspark': return 'PySpark';
      case 'dbt_sql': return 'dbt SQL';
      default: return lang;
    }
  };

  // Filter items
  const filteredItems = historyItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = selectedLanguage === 'all' || item.language === selectedLanguage;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black">Documentation History</h2>
        <p className="text-sm text-slate-400">Manage, view, recompile, or delete previously generated ELT mappings files.</p>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-350"
            placeholder="Search by script name..."
          />
        </div>

        {/* Language Filter */}
        <div className="w-full sm:w-48 shrink-0">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full px-3 py-3 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-350"
          >
            <option value="all">All Languages</option>
            <option value="sql">SQL Scripts</option>
            <option value="python">Python Files</option>
            <option value="pyspark">PySpark Pipeline</option>
            <option value="dbt_sql">dbt SQL</option>
          </select>
        </div>

      </div>

      {/* History List */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl overflow-hidden shadow-sm">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Loading documentation index...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen size={48} className="mx-auto text-slate-300 dark:text-navy-850 mb-3" />
            <h4 className="font-bold text-slate-500 dark:text-slate-400">No documents found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto">Try refining your search queries or compile a new script schema analysis.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800 text-slate-400">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Script Name</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Language</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Generated Date</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Analysis Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-850">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/15">
                    
                    {/* File Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2 bg-slate-100 dark:bg-navy-800 rounded-lg text-slate-500">
                          <Eye size={16} />
                        </div>
                        <span className="font-semibold text-sm truncate max-w-[240px] block">{item.name}</span>
                      </div>
                    </td>

                    {/* Language Badge */}
                    <td className="px-6 py-4">
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-navy-950 text-slate-600 dark:text-slate-400 border border-slate-250 dark:border-navy-850">
                        {getLanguageLabel(item.language)}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                        <Calendar size={12} />
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Ready</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center space-x-1">
                        
                        {/* View */}
                        <button
                          onClick={() => handleView(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800 hover:text-blue-500"
                          title="View Technical Documentation"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Re-analyze */}
                        <button
                          onClick={() => handleReanalyze(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800 hover:text-amber-500"
                          title="Edit & Recompile Script"
                        >
                          <RefreshCw size={16} />
                        </button>

                        {/* Download */}
                        <button
                          onClick={() => handleDownloadMarkdown(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800 hover:text-emerald-500"
                          title="Download Markdown Documentation"
                        >
                          <Download size={16} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteItemId(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-500"
                          title="Delete History Record"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {deleteItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-500">
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-extrabold text-base">Delete History Log</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete this script documentation? This action is permanent and cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteItemId(null)}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 hover:bg-slate-50 dark:hover:bg-navy-850"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-500/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
