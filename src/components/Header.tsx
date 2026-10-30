import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  Code2,
  Cpu,
  Moon,
  PanelLeft,
  Plus,
  RefreshCw,
  Settings,
  Sun,
} from 'lucide-react';
import { ConnectionStatus, OllamaModel } from '../types';

interface HeaderProps {
  currentModel: string;
  models: OllamaModel[];
  onSelectModel: (model: string) => void;
  connectionStatus: ConnectionStatus;
  onRefreshConnection: () => void;
  onOpenDocuments: () => void;
  onOpenPortfolio: () => void;
  onOpenSettings: () => void;
  onOpenModelManager: () => void;
  onNewChat: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeDocCount: number;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentModel,
  models,
  onSelectModel,
  connectionStatus,
  onRefreshConnection,
  onOpenDocuments,
  onOpenPortfolio,
  onOpenSettings,
  onOpenModelManager,
  theme,
  onToggleTheme,
  activeDocCount,
  onToggleSidebar,
  sidebarOpen,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  return (
    <header className="px-4 py-2.5 bg-[#000000] dark:bg-[#000000] light:bg-[#ffffff] border-b border-[#212121] dark:border-[#212121] light:border-slate-200 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Left: Sidebar toggle + Model Pill */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-[#212121] transition-colors"
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#212121] light:hover:bg-slate-100 text-sm font-semibold text-white light:text-slate-900 transition-colors cursor-pointer group"
          >
            <span>{currentModel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
          </button>

          {modelDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setModelDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-1 w-64 rounded-xl bg-[#212121] dark:bg-[#212121] light:bg-white border border-[#333] shadow-2xl py-1 z-50">
                <div className="px-3 py-2 border-b border-[#333] text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Ollama Models</span>
                  <button
                    onClick={() => {
                      onOpenModelManager();
                      setModelDropdownOpen(false);
                    }}
                    className="text-indigo-400 hover:underline text-[10px]"
                  >
                    Manage
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {models.map((m) => {
                    const isSelected = m.name === currentModel || m.model === currentModel;
                    return (
                      <button
                        key={m.name || m.model}
                        onClick={() => {
                          onSelectModel(m.name || m.model);
                          setModelDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[#2d2d2d] transition-colors ${
                          isSelected ? 'bg-white/10 text-white font-semibold' : 'text-slate-300'
                        }`}
                      >
                        <div className="truncate">
                          <div className="font-medium truncate">{m.name}</div>
                          {m.details?.parameter_size && (
                            <div className="text-[10px] text-slate-400">
                              {m.details.parameter_size} · {m.details.quantization_level || 'GGUF'}
                            </div>
                          )}
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Utilities & Theme Toggle */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* RAG Knowledge Docs */}
        <button
          onClick={onOpenDocuments}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-[#212121] hover:bg-[#2f2f2f] border border-[#333] transition-colors"
          title="Document RAG Knowledge Base"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Docs</span>
          {activeDocCount > 0 && (
            <span className="px-1.5 py-0.2 bg-indigo-500 text-white text-[10px] rounded-full font-mono">
              {activeDocCount}
            </span>
          )}
        </button>

        {/* Theme Toggle (Light & Dark) */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#212121] transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#212121] transition-colors cursor-pointer"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
