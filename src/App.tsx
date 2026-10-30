/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  AppSettings,
  ConnectionStatus,
  Conversation,
  Message,
  OllamaModel,
  UploadedDocument,
} from './types';
import {
  DEFAULT_MODELS,
  checkOllamaConnection,
  fetchInstalledModels,
  streamChatCompletion,
} from './services/ollamaService';
import {
  DEFAULT_SETTINGS,
  getActiveConversationId,
  getStoredConversations,
  getStoredDocuments,
  getStoredMessages,
  getStoredSettings,
  saveConversations,
  saveDocuments,
  saveMessages,
  saveSettings,
  setActiveConversationId,
} from './services/storageService';
import {
  buildRagPrompt,
  chunkText,
  extractTextFromFile,
  retrieveRelevantChunks,
} from './services/ragService';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { MessageInput } from './components/MessageInput';
import { DocumentModal } from './components/DocumentModal';
import { ModelManagerModal } from './components/ModelManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { PortfolioModal } from './components/PortfolioModal';

export default function App() {
  // App Settings & Theme
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);
  const [theme, setTheme] = useState<'dark' | 'light'>(settings.theme || 'dark');

  // Connection & Models
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    mode: 'local',
    host: settings.ollamaHost,
    lastChecked: Date.now(),
  });
  const [models, setModels] = useState<OllamaModel[]>(DEFAULT_MODELS);
  const [currentModel, setCurrentModel] = useState<string>(settings.defaultModel || 'llama3:8b');

  // Conversations & Messages
  const [conversations, setConversations] = useState<Conversation[]>(getStoredConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(getActiveConversationId);
  const [messages, setMessages] = useState<Message[]>([]);

  // Documents (RAG)
  const [documents, setDocuments] = useState<UploadedDocument[]>(getStoredDocuments);
  const [activeDocIds, setActiveDocIds] = useState<string[]>([]);

  // UI Modals & Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);

  // Streaming State & Abort Controller
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Theme Syncing
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Initial Connection & Model Check
  useEffect(() => {
    handleCheckConnection();
  }, [settings.ollamaHost]);

  const handleCheckConnection = async () => {
    const status = await checkOllamaConnection(settings.ollamaHost);
    setConnectionStatus(status);
    const fetched = await fetchInstalledModels(settings.ollamaHost);
    setModels(fetched);
  };

  // Load Messages for Active Conversation
  useEffect(() => {
    if (activeConvId) {
      const msgs = getStoredMessages(activeConvId);
      setMessages(msgs);
      setActiveConversationId(activeConvId);

      const currentConv = conversations.find((c) => c.id === activeConvId);
      if (currentConv?.model) {
        setCurrentModel(currentConv.model);
      }
      if (currentConv?.documentIds) {
        setActiveDocIds(currentConv.documentIds);
      }
    } else if (conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
  }, [activeConvId]);

  // Sync Documents
  useEffect(() => {
    saveDocuments(documents);
  }, [documents]);

  // Conversation Management
  const handleNewConversation = () => {
    if (isStreaming) handleStopGeneration();

    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Chat',
      model: currentModel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      documentIds: activeDocIds,
    };

    const updated = [newConv, ...conversations];
    setConversations(updated);
    saveConversations(updated);
    setActiveConvId(newId);
    setMessages([]);
  };

  const handleSelectConversation = (id: string) => {
    if (isStreaming) handleStopGeneration();
    setActiveConvId(id);
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c
    );
    setConversations(updated);
    saveConversations(updated);
  };

  const handleDeleteConversation = (id: string) => {
    if (isStreaming) handleStopGeneration();

    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    saveConversations(updated);

    // Delete stored messages for this conversation
    const allMsgs = getStoredMessages();
    const remainingMsgs = allMsgs.filter((m) => m.conversationId !== id);
    saveMessages(remainingMsgs);

    if (activeConvId === id) {
      if (updated.length > 0) {
        setActiveConvId(updated[0].id);
      } else {
        handleNewConversation();
      }
    }
  };

  const handleTogglePin = (id: string) => {
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, pinned: !c.pinned } : c
    );
    setConversations(updated);
    saveConversations(updated);
  };

  const handleExportConversation = (id: string, format: 'markdown' | 'json') => {
    const conv = conversations.find((c) => c.id === id);
    const msgs = getStoredMessages(id);
    if (!conv) return;

    let content = '';
    let mime = 'text/plain';
    let filename = `${conv.title.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    if (format === 'json') {
      content = JSON.stringify({ conversation: conv, messages: msgs }, null, 2);
      mime = 'application/json';
      filename += '.json';
    } else {
      content = `# ${conv.title}\n*Model: ${conv.model} · Exported from LocalMind*\n\n---\n\n`;
      msgs.forEach((m) => {
        const sender = m.role === 'user' ? '### User' : `### ${m.model || 'LocalMind'}`;
        content += `${sender}\n\n${m.content}\n\n---\n\n`;
      });
      filename += '.md';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Document Upload & RAG Indexing
  const handleUploadFile = async (file: File) => {
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const rawText = await extractTextFromFile(file);
    const chunks = chunkText(docId, file.name, rawText);

    const newDoc: UploadedDocument = {
      id: docId,
      name: file.name,
      size: file.size,
      type: file.type || file.name.split('.').pop() || 'text',
      uploadedAt: Date.now(),
      chunkCount: chunks.length,
      rawTextLength: rawText.length,
      status: 'indexed',
      chunks,
    };

    const updated = [newDoc, ...documents];
    setDocuments(updated);
    saveDocuments(updated);
    // Auto-attach to active documents
    setActiveDocIds((prev) => [...prev, docId]);
  };

  const handleDeleteDocument = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    setDocuments(updated);
    saveDocuments(updated);
    setActiveDocIds((prev) => prev.filter((dId) => dId !== id));
  };

  const handleToggleActiveDoc = (id: string) => {
    setActiveDocIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  // Sending Messages & Streaming
  const handleSendMessage = async (rawPrompt: string) => {
    if (!rawPrompt.trim() || isStreaming) return;

    let targetConvId = activeConvId;
    if (!targetConvId || !conversations.some((c) => c.id === targetConvId)) {
      const newId = `conv-${Date.now()}`;
      const firstTitle = rawPrompt.slice(0, 32) + (rawPrompt.length > 32 ? '...' : '');
      const newConv: Conversation = {
        id: newId,
        title: firstTitle,
        model: currentModel,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        documentIds: activeDocIds,
      };
      const updated = [newConv, ...conversations];
      setConversations(updated);
      saveConversations(updated);
      setActiveConvId(newId);
      targetConvId = newId;
    }

    // Check for RAG document retrieval
    const activeDocs = documents.filter((d) => activeDocIds.includes(d.id));
    let finalPrompt = rawPrompt;
    let citations: any[] = [];

    if (activeDocs.length > 0) {
      const retrieved = retrieveRelevantChunks(
        rawPrompt,
        activeDocs,
        settings.ragMaxChunks,
        settings.ragSimilarityThreshold
      );
      if (retrieved.length > 0) {
        citations = retrieved;
        const rag = buildRagPrompt(rawPrompt, retrieved, activeDocs);
        finalPrompt = rag.augmentedPrompt;
      }
    }

    // Create user message
    const userMsg: Message = {
      id: `msg-${Date.now()}-u`,
      conversationId: targetConvId,
      role: 'user',
      content: rawPrompt,
      timestamp: Date.now(),
    };

    // Create placeholder assistant message
    const assistantMsgId = `msg-${Date.now()}-a`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      conversationId: targetConvId,
      role: 'assistant',
      model: currentModel,
      content: '',
      timestamp: Date.now(),
      status: 'streaming',
      citations: citations.length > 0 ? citations : undefined,
    };

    const newMessages = [...messages, userMsg, assistantMsg];
    setMessages(newMessages);

    // Save user message to persistent storage immediately
    const allMsgs = getStoredMessages();
    saveMessages([...allMsgs, userMsg]);

    // Update conversation title if first message
    const currentConv = conversations.find((c) => c.id === targetConvId);
    if (currentConv && currentConv.title === 'New Chat') {
      const autoTitle = rawPrompt.slice(0, 32) + (rawPrompt.length > 32 ? '...' : '');
      handleRenameConversation(targetConvId, autoTitle);
    }

    // Start streaming
    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    // Prepare message history for Ollama context
    const historyPayload = [
      { role: 'system', content: settings.systemPrompt },
      ...messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: finalPrompt },
    ];

    let accumulatedContent = '';

    await streamChatCompletion({
      model: currentModel,
      messages: historyPayload,
      settings,
      signal: abortControllerRef.current.signal,
      onToken: (token) => {
        accumulatedContent += token;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
          )
        );
      },
      onComplete: (fullText, metrics) => {
        setIsStreaming(false);
        abortControllerRef.current = null;

        const completedAssistantMsg: Message = {
          ...assistantMsg,
          content: fullText,
          status: 'complete',
          tokenCount: metrics.tokens,
          tokensPerSec: metrics.tokensPerSec,
          generationDurationMs: metrics.durationMs,
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? completedAssistantMsg : m))
        );

        // Save complete assistant message to storage
        const currentAll = getStoredMessages();
        saveMessages([...currentAll, completedAssistantMsg]);
      },
      onError: (err) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedContent || `Local inference error: ${err}`,
                  status: 'error',
                  error: err,
                }
              : m
          )
        );
      },
    });
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = (messageId: string) => {
    if (isStreaming) return;
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex <= 0) return;

    // Find preceding user prompt
    const prevUserMsg = messages[msgIndex - 1];
    if (prevUserMsg && prevUserMsg.role === 'user') {
      // Remove old assistant message and re-run
      const trimmed = messages.slice(0, msgIndex);
      setMessages(trimmed);
      handleSendMessage(prevUserMsg.content);
    }
  };

  const handlePullModel = async (modelName: string) => {
    const newModel: OllamaModel = {
      name: modelName,
      model: modelName,
      modified_at: new Date().toISOString(),
      size: 4400000000,
      digest: 'localmind_' + Math.random().toString(36).substring(2, 10),
      details: {
        parent_model: '',
        format: 'gguf',
        family: modelName.split(':')[0],
        parameter_size: modelName.includes('70b') ? '70B' : '8.0B',
        quantization_level: 'Q4_K_M',
      },
      isCustom: true,
    };
    setModels((prev) => [newModel, ...prev]);
    setCurrentModel(modelName);
  };

  const handleUpdateHost = async (host: string) => {
    try {
      await fetch('/api/config/host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host }),
      });
    } catch {
      // Offline fallback
    }
    const updated = { ...settings, ollamaHost: host };
    setSettings(updated);
    saveSettings(updated);
    await handleCheckConnection();
  };

  const handleClearAllData = () => {
    localStorage.clear();
    setConversations(getStoredConversations());
    setActiveConvId('seed-conv-1');
    setMessages(getStoredMessages('seed-conv-1'));
    setDocuments([]);
    setActiveDocIds([]);
    setSettings(DEFAULT_SETTINGS);
  };

  const handleSetDefaultModel = (modelName: string) => {
    const updated = { ...settings, defaultModel: modelName };
    setSettings(updated);
    saveSettings(updated);
  };

  const activeDocuments = documents.filter((d) => activeDocIds.includes(d.id));

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#2b2c37] dark:bg-[#20212b] light:bg-[#f9fafb] text-slate-100 light:text-slate-900 transition-colors">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConvId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onTogglePinConversation={handleTogglePin}
        onExportConversation={handleExportConversation}
        onOpenModelManager={() => setModelModalOpen(true)}
        onOpenPortfolio={() => setPortfolioModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        connectionStatus={connectionStatus}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        onToggleTheme={() => {
          const nextTheme: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark';
          setTheme(nextTheme);
          const updated: AppSettings = { ...settings, theme: nextTheme };
          setSettings(updated);
          saveSettings(updated);
        }}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header
          currentModel={currentModel}
          models={models}
          onSelectModel={setCurrentModel}
          connectionStatus={connectionStatus}
          onRefreshConnection={handleCheckConnection}
          onOpenDocuments={() => setDocumentModalOpen(true)}
          onOpenPortfolio={() => setPortfolioModalOpen(true)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenModelManager={() => setModelModalOpen(true)}
          onNewChat={handleNewConversation}
          theme={theme}
          onToggleTheme={() => {
            const nextTheme: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark';
            setTheme(nextTheme);
            const updated: AppSettings = { ...settings, theme: nextTheme };
            setSettings(updated);
            saveSettings(updated);
          }}
          activeDocCount={activeDocIds.length}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* Chat Stream View */}
        <ChatArea
          messages={messages}
          isStreaming={isStreaming}
          currentModel={currentModel}
          onSelectPromptSuggestion={(p) => handleSendMessage(p)}
          onRegenerate={handleRegenerate}
        />

        {/* Floating Input Area */}
        <MessageInput
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          onStopGeneration={handleStopGeneration}
          activeDocuments={activeDocuments}
          onAttachFile={handleUploadFile}
          onRemoveDocument={(id) => handleToggleActiveDoc(id)}
          currentModel={currentModel}
        />
      </div>

      {/* Modals */}
      <DocumentModal
        isOpen={documentModalOpen}
        onClose={() => setDocumentModalOpen(false)}
        documents={documents}
        onUploadFile={handleUploadFile}
        onDeleteDocument={handleDeleteDocument}
        activeDocIds={activeDocIds}
        onToggleActiveDoc={handleToggleActiveDoc}
      />

      <ModelManagerModal
        isOpen={modelModalOpen}
        onClose={() => setModelModalOpen(false)}
        models={models}
        currentModel={currentModel}
        onSelectModel={setCurrentModel}
        connectionStatus={connectionStatus}
        onRefreshConnection={handleCheckConnection}
        onUpdateHost={handleUpdateHost}
        onPullModel={handlePullModel}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          saveSettings(newSettings);
        }}
        onClearAllData={handleClearAllData}
      />

      <PortfolioModal
        isOpen={portfolioModalOpen}
        onClose={() => setPortfolioModalOpen(false)}
      />
    </div>
  );
}
