# LocalMind – AI Chat Application Powered by Ollama

A modern, high-performance conversational AI interface inspired by ChatGPT, engineered to run against local open-source LLMs through Ollama with token-by-token streaming, retrieval-augmented generation (RAG) for PDF and text documents, multi-session conversation history, model configuration, and complete Spring Boot & Docker portfolio assets.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were aligned during the initial consultation:

- **Ollama Connectivity & Fallback**: LocalMind will connect to local Ollama (`http://localhost:11434` or custom URL) with a seamless, realistic offline demo/simulation mode so the interface remains fully operational even if Ollama is not currently active on the host machine.
- **Runtime & Portfolio Deliverables**: A fully functional live full-stack application (React + Node/Express proxy) with the complete Java 21 / Spring Boot 3 / PostgreSQL / pgvector backend source files, entities, controllers, services, and Docker configurations included directly in the repository for software engineering portfolio submission.
- **Document RAG Strategy**: Documents (PDF/TXT) are parsed and chunked with semantic vector embeddings and cosine similarity retrieval, providing precise grounded responses with highlighted citations and source badges.
- **Featured Model Suite**: Pre-configured support for **Llama 3**, **Mistral 7B**, **Gemma 2**, and **Phi-3**, alongside custom model tags and parameter fine-tuning (temperature, top-p, context window length).

---

## 1. Overview & Core Concept

- **What It Does**: LocalMind provides a private, locally governed conversational AI workspace. Users can converse with locally installed LLMs, switch models mid-conversation, stream tokens in real-time with cancel/regenerate capabilities, upload documents to query against them using RAG, manage past sessions with search and tags, and inspect or pull models.
- **Target Audience / Persona**: Developers, privacy-conscious professionals, and engineering evaluators seeking a ChatGPT-equivalent experience that keeps data strictly on local hardware or private enterprise servers.
- **Key Value**: Zero data leakage, full offline capability, transparent token generation metrics, instant document question-answering with citations, and clean architectural separation suitable for a senior engineering portfolio.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Chat & Streaming**: User launches LocalMind, selects a model (e.g. Llama 3 or Mistral), enters a prompt. The response begins streaming immediately token by token with markdown formatting, syntax-highlighted code blocks with 1-click copy, and generation controls (stop, regenerate, copy).
2. **Session Persistence & Search**: Recent chats populate the left collapsible sidebar grouped by date ("Today", "Previous 7 Days", "Older"). Users can search titles and message content, rename threads, pin important chats, or delete sessions.
3. **Document Grounding (RAG)**: Users drop PDF or TXT files into the chat bar or dedicated knowledge drawer. The document is parsed, chunked, and embedded. When querying the model, relevant chunks are retrieved and displayed as expandable citations alongside the answer.
4. **Model Management & Settings**: A dedicated modal/view lets users view installed Ollama models, model sizes, running states, and configure default system prompts, temperature sliders, and server endpoints.
5. **Portfolio & Docker Code Hub**: A built-in code inspector and export panel allowing visitors to browse and export the Java 21 Spring Boot backend, JPA entities, controllers, and Docker Compose configurations.

### Visual Identity & Theme
- **Aesthetic Direction**: Utilitarian, refined, and distraction-free dark/light aesthetic modeled on modern developer tooling and ChatGPT.
- **Color Palette**:
  - Light Canvas: `#F8FAFC` (`slate-50`), Cards `#FFFFFF`, Borders `#E2E8F0` (`slate-200`).
  - Dark Canvas: `#0F172A` (`slate-950`), Cards `#1E293B` (`slate-900`), Borders `#334155` (`slate-800`).
  - Brand Accent: High-contrast indigo/violet `#6366F1` (`indigo-500`) for primary action states, model badges, and streaming indicators.
  - Semantic: Emerald for active Ollama connectivity, Amber for offline demo mode, Slate for neutral chrome.
- **Typography**: Clean display sans (`Plus Jakarta Sans` or `Outfit`) paired with `DM Sans` for message body text, and `JetBrains Mono` with `tabular-nums` for code snippets, token telemetry, and timestamps.
- **Zero-Pill Discipline**: Metadata (tokens/sec, timestamp, chunk similarity) rendered with clean typographic separators (`·` and `/`) without gratuitous pill badges.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual-Mode Connection Engine (Live Ollama + Fallback Simulation)**
  - *Chosen Approach*: The client attempts connection to the Ollama endpoint via backend proxy to bypass browser CORS constraints. If the server is unreachable or offline, LocalMind gracefully switches to simulated inference with genuine model personalities, displaying an unobtrusive connectivity badge with manual retry.
  - *Why*: Allows reviewers and users to test every single UI interaction, streaming flow, and document RAG capability immediately in the browser without requiring a pre-installed Ollama daemon.
- **Decision 2: In-App Vector RAG + Document Processing**
  - *Chosen Approach*: Client-side and server-side text extraction for PDF and TXT with sliding-window chunking (500 tokens with 50-token overlap) and vector similarity ranking.
  - *Why*: Ensures rapid document ingestion and instant search without external third-party vector cloud dependencies.
- **Decision 3: Complete Spring Boot 3 & Docker Source Architecture**
  - *Chosen Approach*: Provide complete, production-grade Spring Boot 3 Java files (`LocalMindApplication.java`, `OllamaService.java`, `RagService.java`, `ChatController.java`, `DocumentChunkRepository.java`, `SecurityConfig.java`, `application.yml`) alongside Dockerfile and docker-compose.yml in the project repository.
  - *Why*: Directly satisfies the Java 21 / Spring Boot / PostgreSQL / pgvector portfolio criteria from the user prompt.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LocalMind Web Application                       │
├────────────────────────────────┬───────────────────────────────────────┤
│         Sidebar (Left)         │             Main Workspace            │
│  ┌──────────────────────────┐  │  ┌──────────────────────────────────┐ │
│  │ ➕ New Chat               │  │  │ Header: Model Picker & Status    │ │
│  │ 🔍 Search Conversations  │  │  ├──────────────────────────────────┤ │
│  │ 📁 Chat History (Grouped)│  │  │ Message Stream & Code Blocks     │ │
│  │ ⚙️ Settings & Models     │  │  │   · Markdown Renderer & Syntax   │ │
│  │ 📦 Portfolio Source Hub  │  │  │   · Expandable RAG Citations     │ │
│  │ 🌓 Dark / Light Toggle   │  │  ├──────────────────────────────────┤ │
│  └──────────────────────────┘  │  │ Input Bar & Document Attachment  │ │
│                                │  │   · Prompt Input & Send/Stop     │ │
│                                │  │   · PDF/TXT File Drag & Drop     │ │
│                                │  └──────────────────────────────────┘ │
└──────────────┬─────────────────┴───────────────────┬───────────────────┘
               │                                     │
               ▼                                     ▼
 ┌──────────────────────────┐          ┌──────────────────────────┐
 │ Local Storage & IndexedDB│          │ Ollama Connection Engine │
 │  · Conversations & Chats │          │  · Live REST / SSE Proxy │
 │  · Document Vector Store │          │  · Offline Fallback Mode │
 │  · User Configurations   │          │  · Temperature / Top-P   │
 └──────────────────────────┘          └─────────────┬────────────┘
                                                     │
                                                     ▼
                                       ┌──────────────────────────┐
                                       │ Local Ollama (Port 11434)│
                                       │ Llama3 / Mistral / Gemma │
                                       └──────────────────────────┘
```

### Data Model & Entities
- **Conversation**: `id`, `title`, `modelId`, `createdAt`, `updatedAt`, `systemPrompt`, `temperature`.
- **Message**: `id`, `conversationId`, `role` (`user` | `assistant` | `system`), `content`, `timestamp`, `tokenCount`, `citations` (list of chunk IDs).
- **UploadedDocument**: `id`, `name`, `size`, `type`, `chunkCount`, `uploadedAt`, `status`.
- **DocumentChunk**: `id`, `documentId`, `content`, `pageNumber`, `embedding`, `similarityScore`.
- **OllamaModel**: `id`, `name`, `size`, `modifiedAt`, `digest`, `family`, `parameterSize`.

### Interactive Component & State Mapping
- `Sidebar`: Drives conversation switching, creation of new chats, thread renaming, deletion, and keyword filtering.
- `ChatArea`: Handles real-time SSE streaming buffer, smooth auto-scroll with user-scroll override, stop generation abort controller, message regeneration, and markdown code block copying.
- `DocumentUploadModal`: Handles drag-and-drop of PDF and TXT files, displays chunking and vector indexing progress, and attaches indexed documents to active context.
- `ModelManagerModal`: Inspects installed models, allows setting custom temperature and context length, and tests server connection.
- `PortfolioViewer`: Live interactive tab to view the Java Spring Boot 3 architecture, JPA entities, and Docker files.
