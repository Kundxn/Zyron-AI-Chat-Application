import { AppSettings, Conversation, Message, UploadedDocument } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'localmind_conversations_v1',
  MESSAGES: 'localmind_messages_v1',
  DOCUMENTS: 'localmind_documents_v1',
  SETTINGS: 'localmind_settings_v1',
  ACTIVE_CONVERSATION: 'localmind_active_conversation_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  ollamaHost: 'http://localhost:11434',
  defaultModel: 'mistral:latest',
  temperature: 0.7,
  topP: 0.9,
  contextLength: 4096,
  systemPrompt: 'You are Zyron, an advanced, helpful, and precise AI assistant powered by Ollama. When greeted with "hi", "hello" or asked who you are, introduce yourself as Zyron ("Hi, I am Zyron!"). You provide clear, well-structured, and accurate responses with code examples when requested.',
  theme: 'dark',
  streamSpeed: 'normal',
  ragSimilarityThreshold: 0.25,
  ragMaxChunks: 4,
  soundEffects: false,
};

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'seed-conv-1',
    title: 'Spring Boot 3 + PostgreSQL Architecture',
    model: 'llama3:8b',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    pinned: true,
  },
  {
    id: 'seed-conv-2',
    title: 'Local Ollama RAG Pipeline Design',
    model: 'mistral:7b',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 24,
  },
];

const SEED_MESSAGES: Message[] = [
  {
    id: 'seed-msg-1',
    conversationId: 'seed-conv-1',
    role: 'user',
    content: 'How should I structure a clean layered Spring Boot 3 application with pgvector for local Ollama RAG?',
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'seed-msg-2',
    conversationId: 'seed-conv-1',
    role: 'assistant',
    model: 'llama3:8b',
    content: `Here is the clean layered architecture pattern for a high-performance **Spring Boot 3** and **pgvector** RAG pipeline:\n\n### 1. Layered Architectural Decomposition\n- **Controller Layer** (\`ChatController\`, \`DocumentController\`): Handles REST endpoints, multipart uploads, and Server-Sent Events (\`SseEmitter\`).\n- **Service Layer** (\`OllamaService\`, \`RagService\`, \`DocumentProcessingService\`): Implements business logic, Apache Tika extraction, recursive sentence chunking, and embedding orchestration.\n- **Repository Layer** (\`DocumentChunkRepository\`): Leverages Spring Data JPA with native SQL cosine distance queries: \`ORDER BY embedding <=> :queryEmbedding LIMIT :limit\`.\n- **Entity Layer** (\`Conversation\`, \`Message\`, \`DocumentChunk\`, \`UploadedDocument\`): Maps JPA entities to PostgreSQL.\n\n### 2. Native pgvector Cosine Query\n\`\`\`sql\nSELECT id, content, page_number, 1 - (embedding <=> cast(:queryVector as vector)) as similarity\nFROM document_chunks\nWHERE document_id = :docId\nORDER BY embedding <=> cast(:queryVector as vector) ASC\nLIMIT 5;\n\`\`\`\n\n### 3. Key Benefits\n- **Zero Cloud Costs**: All vectors and weights live in your private PostgreSQL instance.\n- **ACID Transactions**: Relational chat sessions and vector embeddings reside in a unified database schema.`,
    timestamp: Date.now() - 3600000 * 2 + 1000,
    tokenCount: 268,
    tokensPerSec: 32.4,
    generationDurationMs: 8200,
    status: 'complete',
  },
  {
    id: 'seed-msg-3',
    conversationId: 'seed-conv-2',
    role: 'user',
    content: 'What chunking strategy provides the highest retrieval recall without overloading Ollama context limits?',
    timestamp: Date.now() - 3600000 * 24,
  },
  {
    id: 'seed-msg-4',
    conversationId: 'seed-conv-2',
    role: 'assistant',
    model: 'mistral:7b',
    content: `For local models with 4k–8k context windows (like **Mistral 7B** and **Llama 3 8B**):\n\n1. **Chunk Size**: 300 to 500 tokens (approx. 200–350 words). This preserves coherent paragraphs without diluting vector specificity.\n2. **Sliding Overlap**: 10%–15% overlap (around 40–50 tokens). This guarantees cross-boundary statements and pronoun resolutions are not severed.\n3. **Hybrid Search**: Combine dense vector cosine similarity (60% weight) with BM25 lexical term matching (40% weight). This prevents semantic drift when queries contain exact technical terms or version numbers.\n4. **Context Injection**: Feed top 3–5 chunks with structured citation tags like \`[Source: doc_name.pdf, Chunk #2]\`.`,
    timestamp: Date.now() - 3600000 * 24 + 1000,
    tokenCount: 195,
    tokensPerSec: 29.8,
    generationDurationMs: 6500,
    status: 'complete',
  },
];

export function getStoredConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(SEED_CONVERSATIONS));
      return SEED_CONVERSATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_CONVERSATIONS;
  }
}

export function saveConversations(convs: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs));
  } catch (err) {
    console.error('Failed to save conversations to localStorage', err);
  }
}

export function getStoredMessages(conversationId?: string): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const all: Message[] = raw ? JSON.parse(raw) : SEED_MESSAGES;
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(SEED_MESSAGES));
    }
    if (conversationId) {
      return all.filter((m) => m.conversationId === conversationId);
    }
    return all;
  } catch {
    return SEED_MESSAGES;
  }
}

export function saveMessages(messages: Message[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save messages to localStorage', err);
  }
}

export function getStoredDocuments(): UploadedDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDocuments(docs: UploadedDocument[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  } catch (err) {
    console.error('Failed to save documents to localStorage', err);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

export function getActiveConversationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION) || 'seed-conv-1';
  } catch {
    return 'seed-conv-1';
  }
}

export function setActiveConversationId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, id);
  } catch (err) {
    console.error('Failed to set active conversation', err);
  }
}
