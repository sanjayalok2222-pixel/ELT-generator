import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { DataFlowGraph } from '../components/DataFlowGraph';
import { 
  FileText, 
  ArrowLeft, 
  Download, 
  Copy, 
  Check, 
  Database, 
  RefreshCw, 
  GitBranch, 
  Columns,
  Eye,
  FileCode2,
  Calendar,
  Layers2
} from 'lucide-react';

interface AnalysisResultProps {
  item: any; // The selected history item or fresh result
  setActivePage: (page: string) => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ item, setActivePage }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [copied, setCopied] = useState<boolean>(false);
  const [splitView, setSplitView] = useState<boolean>(false);

  if (!item) {
    return (
      <div className="text-center py-20 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl max-w-lg mx-auto mt-10">
        <p className="text-slate-400">No analysis results loaded.</p>
        <button 
          onClick={() => setActivePage('new-analysis')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm"
        >
          Go Back to Upload
        </button>
      </div>
    );
  }

  const { analysis, documentation, code, language, name, created_at } = item;

  // Handle markdown copying
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(documentation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download raw markdown file
  const handleDownloadMarkdown = () => {
    const blob = new Blob([documentation], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${name.split('.')[0]}_documentation.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download raw txt file
  const handleDownloadTxt = () => {
    const blob = new Blob([documentation], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${name.split('.')[0]}_documentation.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download PDF / Print
  const handlePrintPDF = () => {
    window.print();
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'sources', label: 'Sources', icon: Database },
    { id: 'targets', label: 'Targets', icon: Layers2 },
    { id: 'transformations', label: 'Transformations', icon: RefreshCw },
    { id: 'mapping', label: 'Column Mapping', icon: Columns },
    { id: 'flow', label: 'Data Flow', icon: GitBranch },
    { id: 'docs', label: 'Generated Documentation', icon: FileText }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto print:p-0 animate-in fade-in duration-200">
      
      {/* Print-only title */}
      <div className="hidden print:block mb-8">
        <h1 className="text-3xl font-bold mb-2">ELT Script Analysis & Technical Documentation</h1>
        <p className="text-sm text-slate-500">File: {name} | Compiled: {new Date(created_at).toLocaleString()}</p>
      </div>

      {/* Header controls (Hide during printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => setActivePage('new-analysis')}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm text-xs font-bold w-fit"
        >
          <ArrowLeft size={14} />
          <span>New Analysis</span>
        </button>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Compare/Split view */}
          <button
            onClick={() => setSplitView(!splitView)}
            className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all ${
              splitView 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800'
            }`}
          >
            <Columns size={14} />
            <span>{splitView ? 'Close Split View' : 'Compare Code vs Doc'}</span>
          </button>

          {/* Copy Markdown */}
          <button
            onClick={handleCopyMarkdown}
            className="px-4 py-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 text-xs font-bold flex items-center space-x-1.5 shadow-sm"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy MD'}</span>
          </button>

          {/* Download Options Dropdown */}
          <div className="relative group/dl">
            <button
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-95 text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-blue-500/10"
            >
              <Download size={14} />
              <span>Export Documentation</span>
            </button>
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-xl py-1 z-50 hidden group-hover/dl:block animate-in fade-in slide-in-from-top-1 duration-100">
              <button
                onClick={handleDownloadMarkdown}
                className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300"
              >
                Download Markdown (.md)
              </button>
              <button
                onClick={handleDownloadTxt}
                className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300"
              >
                Download Plain Text (.txt)
              </button>
              <button
                onClick={handlePrintPDF}
                className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300"
              >
                Export PDF (Print Layout)
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Meta Info Header */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-4 min-w-0">
          <div className="p-3 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-500 rounded-xl shrink-0">
            <FileCode2 size={24} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold truncate">{name}</h2>
            <div className="flex items-center space-x-3.5 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                Language: {getLanguageLabel(language)}
              </span>
              <span className="text-xs text-slate-400 flex items-center space-x-1">
                <Calendar size={12} />
                <span>Uploaded: {new Date(created_at).toLocaleDateString()}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-slate-400">Documentation Synchronized</span>
        </div>
      </div>

      {/* Split/Compare View Mode */}
      {splitView ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px] print:hidden">
          
          {/* Left panel: Original Script */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/20 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center space-x-1.5">
                <FileCode2 size={14} className="text-blue-500" />
                <span>Original Code Source</span>
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Read-Only</span>
            </div>
            <div className="flex-1 bg-[#1e1e1e]">
              <Editor
                height="100%"
                language={language === 'dbt_sql' ? 'sql' : language}
                value={code}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  fontSize: 12,
                  fontFamily: 'Fira Code, Source Code Pro, Courier New, monospace',
                  minimap: { enabled: false },
                  lineHeight: 18,
                  scrollbar: {
                    verticalScrollbarSize: 4,
                    horizontalScrollbarSize: 4
                  },
                  automaticLayout: true
                }}
              />
            </div>
          </div>

          {/* Right panel: Documentation Renderer */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl overflow-y-auto shadow-sm p-6 flex flex-col">
            <div className="pb-4 border-b border-slate-100 dark:border-navy-800 mb-4 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-500 flex items-center space-x-1.5">
                <FileText size={14} className="text-purple-500" />
                <span>Compiled Documentation Output</span>
              </span>
            </div>
            <div className="flex-1 prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed overflow-y-auto pr-2">
              <div 
                className="markdown-content" 
                dangerouslySetInnerHTML={{ 
                  __html: documentation
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    // Convert headers
                    .replace(/^#\s+(.+)$/gm, '<h1 class="text-xl font-bold text-slate-900 dark:text-white mt-4 mb-2">$1</h1>')
                    .replace(/^##\s+(.+)$/gm, '<h2 class="text-base font-bold text-slate-800 dark:text-slate-200 mt-4 mb-2 border-b border-slate-150 dark:border-navy-800 pb-1">$1</h2>')
                    .replace(/^###\s+(.+)$/gm, '<h3 class="text-sm font-bold text-slate-700 dark:text-slate-300 mt-3 mb-1">$1</h3>')
                    // Convert bold and inline code
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-950 font-mono text-xs text-rose-500">$1</code>')
                    // Convert horizontal rules
                    .replace(/^---$/gm, '<hr class="my-4 border-slate-150 dark:border-navy-800" />')
                    // Convert tables
                    .replace(/\|(.+)\|/g, (match: string) => {
                      if (match.includes('---')) return ''; // ignore separator rows
                      const cells = match.split('|').slice(1, -1);
                      const isHeader = match.includes('Source Column') || match.includes('Source Field');
                      const cellTag = isHeader ? 'th' : 'td';
                      const cellClass = isHeader 
                        ? 'px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 font-bold text-left text-xs' 
                        : 'px-3 py-2 border border-slate-150 dark:border-navy-850 text-xs';
                      const rowCells = cells.map((c: string) => `<${cellTag} class="${cellClass}">${c.trim()}</${cellTag}>`).join('');
                      return `<tr class="border-collapse">${rowCells}</tr>`;
                    })
                    // Convert bullet lists
                    .replace(/^\*\s+(.+)$/gm, '<li class="list-disc ml-5 text-slate-600 dark:text-slate-400 my-1 text-xs">$1</li>')
                    .replace(/^-\s+(.+)$/gm, '<li class="list-disc ml-5 text-slate-600 dark:text-slate-400 my-1 text-xs">$1</li>')
                }} 
              />
            </div>
          </div>

        </div>
      ) : (
        /* Normal Tabs View (Hide during print, except active print layout) */
        <div className="space-y-6">
          
          {/* Tab Navigation Menu */}
          <div className="flex border-b border-slate-200 dark:border-navy-800 overflow-x-auto print:hidden shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-1.5 px-4 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition-all
                    ${isActive 
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}
                  `}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm min-h-[360px] print:border-none print:shadow-none print:p-0">
            
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-100">
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Script Purpose</h3>
                  <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{analysis.purpose}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-navy-800">
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Business Logic Rules</h3>
                    <ul className="space-y-2">
                      {analysis.businessLogic.map((rule: string, i: number) => (
                        <li key={i} className="flex items-start space-x-2 text-sm text-slate-600 dark:text-slate-400">
                          <span className="h-5 w-5 bg-blue-500/10 text-blue-500 rounded-md font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Script Flow Summary</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{analysis.summary}</p>
                    
                    <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider pt-2 block">Dependencies</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.dependencies.map((dep: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-lg text-xs font-mono">
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SOURCES TAB */}
            {activeTab === 'sources' && (
              <div className="space-y-6 animate-in fade-in duration-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Source Database */}
                  <div className="p-4 bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-850 rounded-xl space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Source DB Node</span>
                    <h4 className="font-bold font-mono text-sm text-slate-700 dark:text-slate-300">{analysis.sources.database || 'Unspecified'}</h4>
                  </div>

                  {/* API details */}
                  <div className="p-4 bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-850 rounded-xl space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">External API Ingestions</span>
                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      {analysis.sources.apis.length > 0 ? analysis.sources.apis.join(', ') : 'None'}
                    </h4>
                  </div>

                  {/* Input files */}
                  <div className="p-4 bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-850 rounded-xl space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Input Files (CSVs/JSONs)</span>
                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      {analysis.sources.files.length > 0 ? analysis.sources.files.join(', ') : 'None'}
                    </h4>
                  </div>

                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-navy-800">
                  <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Source Tables Extracted</h3>
                  {analysis.sources.tables.length === 0 ? (
                    <p className="text-sm text-slate-400">No source tables extracted explicitly.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {analysis.sources.tables.map((table: string, i: number) => (
                        <div key={i} className="px-4 py-3 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl flex items-center space-x-2.5 shadow-sm">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-xs font-mono font-semibold truncate">{table}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. TARGETS TAB */}
            {activeTab === 'targets' && (
              <div className="space-y-6 animate-in fade-in duration-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Target DB */}
                  <div className="p-4 bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-850 rounded-xl space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Target Warehouse</span>
                    <h4 className="font-bold font-mono text-sm text-slate-700 dark:text-slate-300">{analysis.targets.database || 'Unspecified'}</h4>
                  </div>

                  {/* Operation */}
                  <div className="p-4 bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-850 rounded-xl space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Load Operation Strategy</span>
                    <span className="inline-block px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold text-xs rounded-md">
                      {analysis.targets.operation || 'UNKNOWN'}
                    </span>
                  </div>

                  {/* Destination Details */}
                  <div className="p-4 bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-850 rounded-xl space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Destination details</span>
                    <h4 className="font-semibold text-xs text-slate-500 dark:text-slate-400">{analysis.targets.destination || 'Target Table'}</h4>
                  </div>

                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-navy-800">
                  <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Destination Table</h3>
                  {analysis.targets.tables.length === 0 ? (
                    <p className="text-sm text-slate-400">No target destination table configured.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                      {analysis.targets.tables.map((table: string, i: number) => (
                        <div key={i} className="px-4 py-3 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl flex items-center space-x-2.5 shadow-sm">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                          <span className="text-xs font-mono font-semibold truncate">{table}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. TRANSFORMATIONS TAB */}
            {activeTab === 'transformations' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4">Pipeline Transformations</h3>
                {analysis.transformations.length === 0 ? (
                  <p className="text-sm text-slate-450">No transformation blocks detected.</p>
                ) : (
                  <div className="space-y-3">
                    {analysis.transformations.map((trans: any, i: number) => (
                      <div key={i} className="p-4 bg-slate-50/50 dark:bg-navy-950/20 border border-slate-150 dark:border-navy-800 rounded-xl flex items-start space-x-4 shadow-sm">
                        <div className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-500 font-bold font-mono text-[10px] tracking-wide shrink-0">
                          {trans.type}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">{trans.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. COLUMN MAPPING TAB */}
            {activeTab === 'mapping' && (
              <div className="space-y-4 animate-in fade-in duration-100 overflow-x-auto">
                <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4">Field Mapping Specification</h3>
                
                <table className="w-full text-left border-collapse border border-slate-200 dark:border-navy-800 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800">
                      <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Source Column</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Transformation Action</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Target Column</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-850">
                    {analysis.columnMapping.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/15">
                        <td className="px-5 py-3.5 text-xs font-mono font-semibold text-slate-600 dark:text-slate-350">{row.sourceColumn}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">{row.transformation}</td>
                        <td className="px-5 py-3.5 text-xs font-mono font-semibold text-blue-500 dark:text-blue-400">{row.targetColumn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. DATA FLOW LINEAGE TAB */}
            {activeTab === 'flow' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <DataFlowGraph 
                  sources={analysis.sources} 
                  targets={analysis.targets} 
                  transformations={analysis.transformations} 
                />
              </div>
            )}

            {/* 7. FULL DOCUMENTATION TAB */}
            {activeTab === 'docs' && (
              <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-350 space-y-4 leading-relaxed max-w-4xl mx-auto py-4">
                <div 
                  className="markdown-content" 
                  dangerouslySetInnerHTML={{ 
                    __html: documentation
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      // Convert headers
                      .replace(/^#\s+(.+)$/gm, '<h1 class="text-2xl font-black text-slate-900 dark:text-white mt-6 mb-3 border-b border-slate-150 dark:border-navy-800 pb-2">$1</h1>')
                      .replace(/^##\s+(.+)$/gm, '<h2 class="text-lg font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2 border-b border-slate-150 dark:border-navy-800 pb-1">$1</h2>')
                      .replace(/^###\s+(.+)$/gm, '<h3 class="text-sm font-bold text-slate-700 dark:text-slate-300 mt-4 mb-1">$1</h3>')
                      // Convert bold and inline code
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-950 font-mono text-xs text-rose-500">$1</code>')
                      // Convert horizontal rules
                      .replace(/^---$/gm, '<hr class="my-6 border-slate-150 dark:border-navy-800" />')
                      // Convert tables
                      .replace(/\|(.+)\|/g, (match: string) => {
                        if (match.includes('---')) return '';
                        const cells = match.split('|').slice(1, -1);
                        const isHeader = match.includes('Source Column') || match.includes('Source Field');
                        const cellTag = isHeader ? 'th' : 'td';
                        const cellClass = isHeader 
                          ? 'px-4 py-3 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 font-bold text-left text-xs' 
                          : 'px-4 py-3 border border-slate-150 dark:border-navy-850 text-xs';
                        const rowCells = cells.map((c: string) => `<${cellTag} class="${cellClass}">${c.trim()}</${cellTag}>`).join('');
                        return `<tr>${rowCells}</tr>`;
                      })
                      // Convert bullet lists
                      .replace(/^\*\s+(.+)$/gm, '<li class="list-disc ml-6 my-1.5 text-slate-650 dark:text-slate-400 text-sm">$1</li>')
                      .replace(/^-\s+(.+)$/gm, '<li class="list-disc ml-6 my-1.5 text-slate-650 dark:text-slate-400 text-sm">$1</li>')
                  }} 
                />
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
