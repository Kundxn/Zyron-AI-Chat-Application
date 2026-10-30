import React, { useState } from 'react';
import {
  Clock,
  Code,
  Compass,
  FileCode,
  FolderClosed,
  HelpCircle,
  Image as ImageIcon,
  Library,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Plus,
  Puzzle,
  Search,
  Settings,
  Sparkles,
  SquarePen,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { ConnectionStatus, Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onTogglePinConversation: (id: string) => void;
  onExportConversation: (id: string, format: 'markdown' | 'json') => void;
  onOpenModelManager: () => void;
  onOpenPortfolio: () => void;
  onOpenSettings: () => void;
  connectionStatus: ConnectionStatus;
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onTogglePinConversation,
  onExportConversation,
  onOpenModelManager,
  onOpenPortfolio,
  onOpenSettings,
  connectionStatus,
  isOpen,
  onClose,
  theme,
  onToggleTheme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'images' | 'codex'>('chat');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConvs = filteredConversations.filter((c) => c.pinned);
  const recentConvs = filteredConversations.filter((c) => !c.pinned);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#171717] dark:bg-[#171717] light:bg-[#f9f9f9] border-r border-[#262626] dark:border-[#262626] light:border-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header with Zyron */}
        <div className="px-3 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base text-white dark:text-white light:text-slate-900 tracking-tight">
              Zyron
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearchInput(!showSearchInput)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-[#212121] transition-colors"
              title="Search chats"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-[#212121] transition-colors"
              title="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional Search Bar */}
        {showSearchInput && (
          <div className="px-3 pb-2">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#212121] dark:bg-[#212121] light:bg-white text-xs text-white light:text-slate-900 placeholder-slate-500 border border-[#2f2f2f] outline-none"
            />
          </div>
        )}

        {/* Top Action Links from ChatGPT screenshot */}
        <div className="px-2 space-y-0.5">
          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewConversation();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-[#212121] dark:bg-[#212121] light:bg-slate-200/80 text-white dark:text-white light:text-slate-900 text-xs font-medium hover:bg-[#2a2a2a] transition-colors text-left"
          >
            <SquarePen className="w-4 h-4 text-slate-300" />
            <span>New chat</span>
          </button>

          <button
            onClick={() => {
              onNewConversation();
              onSelectConversation('seed-conv-1');
            }}
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-[#212121] light:hover:bg-slate-200 text-xs transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-slate-400" />
            <span>Images</span>
          </button>

          <button
            onClick={onOpenModelManager}
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-[#212121] light:hover:bg-slate-200 text-xs transition-colors"
          >
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Scheduled</span>
          </button>

          <button
            onClick={onOpenPortfolio}
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-[#212121] light:hover:bg-slate-200 text-xs transition-colors"
          >
            <Library className="w-4 h-4 text-slate-400" />
            <span>Library</span>
          </button>

          <button
            onClick={onOpenModelManager}
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-[#212121] light:hover:bg-slate-200 text-xs transition-colors"
          >
            <Puzzle className="w-4 h-4 text-slate-400" />
            <span>Plugins</span>
          </button>

          <button
            onClick={onOpenPortfolio}
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-[#212121] light:hover:bg-slate-200 text-xs transition-colors"
          >
            <Code className="w-4 h-4 text-slate-400" />
            <span>Codex</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-[#212121] light:hover:bg-slate-200 text-xs transition-colors"
          >
            <span className="text-slate-400 text-xs font-bold leading-none">•••</span>
            <span>Explore</span>
          </button>
        </div>

        {/* Scrollable Conversation Threads */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {/* Pinned Section */}
          <div>
            <div className="px-3 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Pinned
            </div>
            <div className="space-y-0.5">
              {pinnedConvs.length > 0 ? (
                pinnedConvs.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        if (window.innerWidth < 768) onClose();
                      }}
                      className={`group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#212121] text-white font-medium'
                          : 'text-slate-300 hover:bg-[#212121]'
                      }`}
                    >
                      <span className="truncate flex-1">{conv.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePinConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-white"
                        title="Unpin"
                      >
                        <Pin className="w-3 h-3 fill-current text-indigo-400" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="px-3 text-xs text-slate-500">interview, hi</div>
              )}
            </div>
          </div>

          {/* Projects Section from ChatGPT */}
          <div>
            <div className="px-3 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Projects</span>
              <span className="text-[10px] text-slate-500">⌄</span>
            </div>
            <div className="px-3 py-0.5 text-xs text-slate-500">No projects</div>
          </div>

          {/* Recents Section */}
          <div>
            <div className="px-3 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Recents
            </div>
            <div className="space-y-0.5">
              {recentConvs.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      onSelectConversation(conv.id);
                      if (window.innerWidth < 768) onClose();
                    }}
                    className={`group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-[#212121] text-white font-medium'
                        : 'text-slate-300 hover:bg-[#212121]'
                    }`}
                  >
                    <span className="truncate flex-1">{conv.title}</span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePinConversation(conv.id);
                        }}
                        className="p-0.5 text-slate-400 hover:text-white"
                        title="Pin chat"
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="p-0.5 text-slate-400 hover:text-red-400"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Profile Bar matching Kundan Singh in the screenshot! */}
        <div className="p-2 border-t border-[#262626] dark:border-[#262626] light:border-slate-200 bg-[#171717] dark:bg-[#171717] light:bg-[#f9f9f9] space-y-2">
          {/* User Profile */}
          <div
            onClick={onOpenSettings}
            className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-[#212121] light:hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#f97316] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                KS
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white dark:text-white light:text-slate-900 truncate">
                  Kundan Singh
                </div>
                <div className="text-[11px] text-slate-400">
                  Free
                </div>
              </div>
            </div>

            {/* Light / Dark Mode Toggle inside profile bar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleTheme();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-[#2b2b2b] transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
