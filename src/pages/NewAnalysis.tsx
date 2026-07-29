import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext';
import { 
  generateAIDocumentation, 
  saveAnalysisResult, 
  SAMPLES 
} from '../services/analysisEngine';
import { 
  Upload, 
  Code2, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  Info, 
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface NewAnalysisProps {
  setActivePage: (page: string) => void;
  setSelectedHistoryItem: (item: any) => void;
}

export const NewAnalysis: React.FC<NewAnalysisProps> = ({ setActivePage, setSelectedHistoryItem }) => {
  const { user } = useAuth();
  
  // Editor state
  const [code, setCode] = useState<string>('');
  const [fileName, setFileName] = useState<string>('untitled.sql');
  const [language, setLanguage] = useState<string>('sql');
  
  // App UI State
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load transfer code for re-analyze
  useEffect(() => {
    const transferCode = localStorage.getItem('code_editor_transfer_code');
    const transferName = localStorage.getItem('code_editor_transfer_name');
    const transferLang = localStorage.getItem('code_editor_transfer_lang');

    if (transferCode) {
      setCode(transferCode);
      setFileName(transferName || 'untitled.sql');
      setLanguage(transferLang || 'sql');

      // Clear from storage
      localStorage.removeItem('code_editor_transfer_code');
      localStorage.removeItem('code_editor_transfer_name');
      localStorage.removeItem('code_editor_transfer_lang');
    }
  }, []);

  // Load sample scripts
  const handleLoadSample = (langType: 'sql' | 'python' | 'pyspark' | 'dbt_sql') => {
    setErrorMessage(null);
    if (langType === 'sql') {
      setCode(SAMPLES.sql.code);
      setFileName(SAMPLES.sql.name);
      setLanguage('sql');
    } else if (langType === 'python') {
      setCode(SAMPLES.python.code);
      setFileName(SAMPLES.python.name);
      setLanguage('python');
    } else if (langType === 'pyspark') {
      setCode(SAMPLES.pyspark.code);
      setFileName(SAMPLES.pyspark.name);
      setLanguage('pyspark');
    } else if (langType === 'dbt_sql') {
      setCode(SAMPLES.dbt_sql.code);
      setFileName(SAMPLES.dbt_sql.name);
      setLanguage('dbt_sql');
    }
  };

  // Detect language based on extension
  const detectLanguageByExtension = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'py') return 'python';
    if (ext === 'sql') return 'sql';
    return 'sql'; // default
  };

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Limit check (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("File is too large! Maximum limit is 2MB.");
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'sql' && ext !== 'py' && ext !== 'txt') {
      setErrorMessage("Unsupported File! Please upload only .sql, .py, or .txt files.");
      return;
    }

    setFileName(file.name);
    
    // Auto-detect language
    const detectedLang = detectLanguageByExtension(file.name);
    setLanguage(detectedLang);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setCode(result);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    setErrorMessage(null);

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("File is too large! Maximum limit is 2MB.");
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'sql' && ext !== 'py' && ext !== 'txt') {
      setErrorMessage("Unsupported File! Please upload only .sql, .py, or .txt files.");
      return;
    }

    setFileName(file.name);
    const detectedLang = detectLanguageByExtension(file.name);
    setLanguage(detectedLang);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setCode(result);
      }
    };
    reader.readAsText(file);
  };

  // Execute documentation analysis
  const handleAnalyze = async () => {
    if (!user) return;
    
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setErrorMessage("Empty Script! Please write, paste, or upload an ELT script first.");
      return;
    }

    setAnalyzing(true);
    setErrorMessage(null);

    try {
      // 1. Run parsing engine (heuristic or Gemini AI)
      const analysisResult = await generateAIDocumentation(fileName, trimmedCode, language);
      
      // 2. Save result to DB (or localstorage fallback)
      const { scriptId, error } = await saveAnalysisResult(
        user.id,
        fileName,
        language,
        trimmedCode,
        analysisResult
      );

      if (error) {
        throw new Error(error.message || "Database write transaction failed.");
      }

      // Add script ID to analysis results before rendering
      const viewResultItem = {
        id: scriptId || 'temp-id',
        name: fileName,
        language: language,
        code: trimmedCode,
        created_at: new Date().toISOString(),
        analysis: analysisResult,
        documentation: analysisResult.generatedDocumentation
      };

      // Set and jump
      setSelectedHistoryItem(viewResultItem);
      setActivePage('result');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Analysis Failed! An error occurred during script documentation compile.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Loading Overlay */}
      {analyzing && (
        <div className="fixed inset-0 bg-navy-950/80 backdrop-blur z-50 flex flex-col items-center justify-center text-center px-4">
          <div className="relative mb-6">
            {/* Outer spinning gradient ring */}
            <div className="w-16 h-16 rounded-full border-4 border-t-blue-500 border-r-purple-500 border-b-indigo-500 border-l-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-blue-400 animate-pulse" size={22} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Analyzing Script Architecture...</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            Detecting data lineage, identifying source columns, mappings tables, and compiling technical documents.
          </p>
        </div>
      )}

      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">ELT Script Analysis</h2>
          <p className="text-sm text-slate-400">Upload transaction scripts or paste SQL procedures to map columns and dependencies.</p>
        </div>
        
        {/* Load Sample Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center space-x-1">
            <Lightbulb size={12} className="text-amber-500" />
            <span>Load Sample:</span>
          </span>
          <button 
            onClick={() => handleLoadSample('sql')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-navy-800 hover:border-blue-500/20 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
          >
            SQL Aggregate
          </button>
          <button 
            onClick={() => handleLoadSample('python')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-navy-800 hover:border-amber-500/20 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
          >
            Python API
          </button>
          <button 
            onClick={() => handleLoadSample('pyspark')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-navy-800 hover:border-orange-500/20 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
          >
            PySpark S3
          </button>
          <button 
            onClick={() => handleLoadSample('dbt_sql')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-navy-800 hover:border-red-500/20 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
          >
            dbt Model
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm flex items-start space-x-3 shadow-sm">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold">Execution Error</h4>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Grid: Editor + Dropzone Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar settings */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* File Upload Dropzone */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 dark:border-navy-800 hover:border-blue-500 dark:hover:border-blue-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-white dark:bg-navy-900/50 shadow-sm group"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".sql,.py,.txt"
              className="hidden" 
            />
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl inline-flex mb-3 group-hover:scale-110 transition-transform">
              <Upload size={22} />
            </div>
            <h4 className="font-bold text-sm">Drag & Drop File</h4>
            <p className="text-xs text-slate-400 mt-1">Supports .sql, .py, or .txt files (max 2MB)</p>
            <button className="mt-4 px-3.5 py-1.5 text-xs font-bold bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg transition-colors border border-transparent dark:border-navy-750">
              Browse Files
            </button>
          </div>

          {/* Properties Panel */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm border-b border-slate-100 dark:border-navy-800 pb-3 flex items-center space-x-2">
              <Code2 size={16} className="text-blue-500" />
              <span>Pipeline Settings</span>
            </h3>
            
            {/* File Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 block">Script Name</label>
              <input 
                type="text" 
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 focus:outline-none focus:border-blue-500 font-mono text-slate-700 dark:text-slate-300"
                placeholder="weekly_sales.sql"
              />
            </div>

            {/* Language Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 block">Manual Language Selector</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
              >
                <option value="sql">SQL Ingestion (Heuristic)</option>
                <option value="python">Python Pandas / Py</option>
                <option value="pyspark">PySpark Pipeline</option>
                <option value="dbt_sql">dbt Incremental model</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-navy-950 border border-slate-150 dark:border-navy-850 rounded-xl text-[11px] leading-relaxed text-slate-400 flex items-start space-x-2.5">
              <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <span>
                Selecting the exact script language optimizes structural parsing accuracy.
              </span>
            </div>

          </div>

        </div>

        {/* Large Editor Panel */}
        <div className="lg:col-span-3 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between h-[520px]">
          
          {/* Editor Header */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between bg-slate-50/50 dark:bg-navy-950/20 shrink-0">
            <div className="flex items-center space-x-2">
              <FileText size={16} className="text-slate-400" />
              <span className="font-mono text-xs font-semibold">{fileName}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Code Editor</span>
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-0 bg-[#1e1e1e] relative">
            <Editor
              height="100%"
              language={language === 'dbt_sql' ? 'sql' : language}
              value={code}
              onChange={(val) => setCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: 'Fira Code, Source Code Pro, Courier New, monospace',
                minimap: { enabled: false },
                lineHeight: 20,
                scrollbar: {
                  verticalScrollbarSize: 6,
                  horizontalScrollbarSize: 6
                },
                automaticLayout: true,
                padding: { top: 12, bottom: 12 }
              }}
              loading={
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-400 text-xs">
                  Loading code compiler editor...
                </div>
              }
            />
          </div>

          {/* Editor Footer / CTA Button */}
          <div className="p-4 border-t border-slate-200 dark:border-navy-800 flex items-center justify-between bg-slate-50/50 dark:bg-navy-950/20 shrink-0">
            <span className="text-xs text-slate-400 font-mono">
              Lines count: {code ? code.split('\n').length : 0}
            </span>
            <button
              onClick={handleAnalyze}
              className="px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-95 text-white shadow-md shadow-blue-500/10 flex items-center space-x-1.5 transition-all text-sm"
            >
              <Sparkles size={16} />
              <span>Analyze Script</span>
              <ChevronRight size={14} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
