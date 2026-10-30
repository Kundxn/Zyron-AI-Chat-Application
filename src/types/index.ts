export interface OllamaModelDetails {
  parent_model?: string;
  format?: string;
  family?: string;
  families?: string[];
  parameter_size?: string;
  quantization_level?: string;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: OllamaModelDetails;
  isCustom?: boolean;
}

export interface MessageCitation {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber?: number;
  chunkIndex: number;
  snippet: string;
  similarity: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokenCount?: number;
  tokensPerSec?: number;
  generationDurationMs?: number;
  citations?: MessageCitation[];
  model?: string;
  status?: 'sending' | 'streaming' | 'complete' | 'error';
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  systemPrompt?: string;
  temperature?: number;
  pinned?: boolean;
  documentIds?: string[];
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  pageNumber?: number;
  chunkIndex: number;
  embedding?: number[];
  termFrequencies?: Record<string, number>;
}

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
  chunkCount: number;
  rawTextLength: number;
  status: 'indexed' | 'processing' | 'error';
  chunks?: DocumentChunk[];
}

export interface AppSettings {
  ollamaHost: string;
  defaultModel: string;
  temperature: number;
  topP: number;
  contextLength: number;
  systemPrompt: string;
  theme: 'dark' | 'light';
  streamSpeed: 'normal' | 'fast' | 'instant';
  ragSimilarityThreshold: number;
  ragMaxChunks: number;
  soundEffects: boolean;
}

export interface ConnectionStatus {
  connected: boolean;
  mode: 'live' | 'local';
  host: string;
  latencyMs?: number;
  lastChecked: number;
}
