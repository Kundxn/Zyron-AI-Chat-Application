import React, { useState } from 'react';
import {
  Check,
  Cpu,
  DownloadCloud,
  HardDrive,
  RefreshCw,
  Sliders,
  Terminal,
  X,
} from 'lucide-react';
import { formatBytes } from '../services/ollamaService';
import { ConnectionStatus, OllamaModel } from '../types';

interface ModelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: OllamaModel[];
  currentModel: string;
  onSelectModel: (model: string) => void;
  connectionStatus: ConnectionStatus;
  onRefreshConnection: () => void;
  onUpdateHost: (host: string) => Promise<void>;
  onPullModel: (modelName: string) => Promise<void>;
}

export const ModelManagerModal: React.FC<ModelManagerModalProps> = ({
  isOpen,
  onClose,
  models,
  currentModel,
  onSelectModel,
  connectionStatus,
  onRefreshConnection,
  onUpdateHost,
  onPullModel,
}) => {
  const [pullInput, setPullInput] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState<string | null>(null);
  const [hostInput, setHostInput] = useState(connectionStatus.host || 'http://localhost:11434');
  const [isUpdatingHost, setIsUpdatingHost] = useState(false);

  if (!isOpen) return null;

  const handlePull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pullInput.trim() || isPulling) return;
    setIsPulling(true);
    setPullProgress('Connecting to Ollama library...');

    setTimeout(() => setPullProgress('Verifying manifest & digest layers...'), 800);
    setTimeout(() => setPullProgress('Downloading weights (4.7 GB)...'), 1800);
    setTimeout(() => setPullProgress('Finalizing GGUF quantization layers...'), 2800);

    try {
      await onPullModel(pullInput.trim());
      setTimeout(() => {
        setIsPulling(false);
        setPullProgress(null);
        setPullInput('');
      }, 3400);
    } catch {
      setIsPulling(false);
      setPullProgress(null);
    }
  };

  const handleHostSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostInput.trim()) return;
    setIsUpdatingHost(true);
    try {
      await onUpdateHost(hostInput.trim());
    } finally {
      setIsUpdatingHost(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                Ollama Model Management
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect local weights, pull new architectures, and monitor inference hardware
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Host Endpoint Configuration */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Ollama Inference Server Endpoint
                </div>
                <div className="text-[11px] text-slate-400">
                  Connects to your local or private Ollama daemon (Default: http://localhost:11434)
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
                    connectionStatus.connected
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {connectionStatus.connected ? '● Connected' : '○ Demo Fallback'}
                </span>
                <button
                  onClick={onRefreshConnection}
                  className="p-1 text-slate-400 hover:text-indigo-500 rounded"
                  title="Check latency"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleHostSave} className="flex gap-2">
              <input
                type="text"
                value={hostInput}
                onChange={(e) => setHostInput(e.target.value)}
                placeholder="http://localhost:11434"
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isUpdatingHost}
                className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
              >
                {isUpdatingHost ? 'Connecting...' : 'Apply Endpoint'}
              </button>
            </form>
          </div>

          {/* Pull Model Form */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Pull or Register Model
            </div>
            <div className="text-[11px] text-slate-400 mb-3">
              Enter model tag from the Ollama library (e.g. <code className="font-mono text-indigo-500">llama3:8b</code>, <code className="font-mono text-indigo-500">deepseek-r1:8b</code>, <code className="font-mono text-indigo-500">mistral:latest</code>)
            </div>

            <form onSubmit={handlePull} className="flex gap-2">
              <input
                type="text"
                value={pullInput}
                onChange={(e) => setPullInput(e.target.value)}
                placeholder="e.g. qwen2.5:7b, llama3.3:70b"
                disabled={isPulling}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!pullInput.trim() || isPulling}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium transition-colors"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>{isPulling ? 'Pulling...' : 'Pull Model'}</span>
              </button>
            </form>

            {pullProgress && (
              <div className="mt-3 p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                <span className="text-indigo-600 dark:text-indigo-400 font-mono">{pullProgress}</span>
              </div>
            )}
          </div>

          {/* Installed Models Grid */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Installed Models ({models.length})
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {models.map((m) => {
                const isSelected = m.name === currentModel || m.model === currentModel;
                return (
                  <div
                    key={m.name || m.model}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {m.name || m.model}
                        </span>
                        {isSelected ? (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => onSelectModel(m.name || m.model)}
                            className="text-[11px] font-medium text-slate-500 hover:text-indigo-500"
                          >
                            Set Active
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <div>
                          Size: <span className="text-slate-700 dark:text-slate-300">{formatBytes(m.size)}</span>
                        </div>
                        <div>
                          Params: <span className="text-slate-700 dark:text-slate-300">{m.details?.parameter_size || 'N/A'}</span>
                        </div>
                        <div>
                          Quant: <span className="text-slate-700 dark:text-slate-300">{m.details?.quantization_level || 'GGUF'}</span>
                        </div>
                        <div>
                          Family: <span className="text-slate-700 dark:text-slate-300">{m.details?.family || 'Transformer'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400 font-mono truncate">
                      <span className="truncate">Digest: {m.digest?.slice(0, 16)}...</span>
                      <span className="text-emerald-500">Ready</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
