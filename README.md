# Zyron – AI Chat Application

Zyron is an AI-powered chat application that uses Ollama to run open-source Large Language Models (LLMs) locally. It provides an interactive conversational experience with multiple AI model support, real-time response streaming, and chat history management through a clean, responsive interface.

## Features

- **AI-Powered Conversations:** Interact with locally hosted open-source language models.
- **Multiple Model Support:** Switch between different Ollama models.
- **Real-Time Streaming:** Receive AI responses as they are generated.
- **Chat History:** Maintain and manage previous conversations.
- **Responsive Interface:** Clean, modern interface for a seamless chat experience.
- **Local AI Execution:** Run models locally using Ollama.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** TypeScript, Node.js
- **AI Integration:** Ollama
- **Communication:** REST APIs

## Prerequisites

Make sure you have the following installed:

- Node.js and npm
- Git
- Ollama

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/zyron-ai-chat.git
cd zyron-ai-chat
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install and Run Ollama

Download Ollama from [ollama.com](https://ollama.com).

Pull a model:

```bash
ollama pull llama3.2:3b
```

Start Ollama:

```bash
ollama serve
```

### 4. Configure Environment Variables

Create your `.env` file using the provided `.env.example` and configure the required environment variables.

### 5. Run the Application

Use the development command configured in `package.json`:

```bash
npm run dev
```

## Project Goals

Zyron aims to make AI conversations more accessible by combining locally hosted language models with a modern web interface, offering greater control over model usage and reducing dependence on external AI services.

## Future Improvements

- Document-based conversations and RAG integration.
- User authentication and personalized chat sessions.
- Additional model configuration options.
- Improved conversation search and organization.

## License

This project is open-source and available for learning and development purposes.
<img width="1210" height="692" alt="image" src="https://github.com/user-attachments/assets/b375f0a0-f8d2-47eb-8df3-e3b9045c362f" />
<img width="367" height="703" alt="image" src="https://github.com/user-attachments/assets/60ebfeb3-882f-44d9-8c21-aadb9b99abd8" />

