import React, { useState } from 'react';
import {
  Archive,
  Check,
  Code2,
  Copy,
  Download,
  FileCode,
  Layers,
  Server,
  X,
} from 'lucide-react';
import { PortfolioFile, SPRING_BOOT_PORTFOLIO_FILES } from '../services/portfolioService';
import { CodeBlock } from './CodeBlock';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PortfolioModal: React.FC<PortfolioModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<PortfolioFile>(
    SPRING_BOOT_PORTFOLIO_FILES[0]
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const categories = ['All', 'Controller', 'Service', 'Repository', 'Entity', 'Config', 'SQL', 'Docker'];

  const filteredFiles =
    categoryFilter === 'All'
      ? SPRING_BOOT_PORTFOLIO_FILES
      : SPRING_BOOT_PORTFOLIO_FILES.filter((f) => f.category === categoryFilter);

  const handleCopyCurrent = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownloadAll = () => {
    const bundle = {
      project: 'LocalMind – Full Stack Local AI Architecture',
      version: '1.0.0',
      stack: {
        backend: 'Java 21, Spring Boot 3.3.0, Spring Data JPA, Spring Security',
        database: 'PostgreSQL 16 + pgvector extension',
        ai_inference: 'Ollama local server REST API (Llama 3, Mistral, Gemma 2)',
        documents: 'Apache Tika extraction + HNSW vector indexing',
        orchestration: 'Docker Compose multi-stage containers',
      },
      files: SPRING_BOOT_PORTFOLIO_FILES.map((f) => ({
        path: f.path,
        category: f.category,
        language: f.language,
        content: f.content,
      })),
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LocalMind-SpringBoot-Postgres-Architecture.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Architecture & Docker Hub</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                  Production Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete backend code: Controllers, Services, JPA Entities, Apache Tika, HNSW pgvector SQL & Docker Compose
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All Files</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40 flex items-center gap-1.5 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Layout Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* File Explorer List */}
          <div className="md:col-span-4 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-3 space-y-1 bg-slate-50/30 dark:bg-slate-900/40">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-medium truncate w-full">
                    <span className="truncate">{file.path.split('/').pop()}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {file.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {file.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Code Viewer Panel */}
          <div className="md:col-span-8 flex flex-col min-h-0 bg-slate-950">
            {/* Viewer Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
              <span className="font-mono text-emerald-400 truncate">
                {selectedFile.path}
              </span>
              <button
                onClick={handleCopyCurrent}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy File</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Body */}
            <div className="flex-1 overflow-y-auto p-4 text-xs font-mono">
              <pre className="text-slate-200 leading-relaxed overflow-x-auto">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Complies with Java 21, Spring Boot 3.3, Apache Tika, and pgvector cosine HNSW index architecture.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
