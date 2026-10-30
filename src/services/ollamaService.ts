import { AppSettings, ConnectionStatus, Message, OllamaModel } from '../types';

export const DEFAULT_MODELS: OllamaModel[] = [
  {
    name: 'mistral:latest',
    model: 'mistral:latest',
    modified_at: '2026-03-20T10:00:00Z',
    size: 4109865188,
    digest: '61e88e884507b9a07139aa9a765766f6e37e5f61',
    details: {
      parent_model: '',
      format: 'gguf',
      family: 'mistral',
      families: ['mistral'],
      parameter_size: '7.2B',
      quantization_level: 'Q4_0',
    },
  },
  {
    name: 'llama3:8b',
    model: 'llama3:8b',
    modified_at: '2026-03-15T12:00:00Z',
    size: 4661224676,
    digest: '365c0bd3c000a4507139aa9a765766f6e37e5f60',
    details: {
      parent_model: '',
      format: 'gguf',
      family: 'llama',
      families: ['llama'],
      parameter_size: '8.0B',
      quantization_level: 'Q4_K_M',
    },
  },
  {
    name: 'gemma2:9b',
    model: 'gemma2:9b',
    modified_at: '2026-03-18T16:20:00Z',
    size: 5406734100,
    digest: 'c1b44e884507b9a07139aa9a765766f6e37e5f62',
    details: {
      parent_model: '',
      format: 'gguf',
      family: 'gemma2',
      families: ['gemma2'],
      parameter_size: '9.2B',
      quantization_level: 'Q4_K_M',
    },
  },
  {
    name: 'phi3:3.8b',
    model: 'phi3:3.8b',
    modified_at: '2026-03-10T11:15:00Z',
    size: 2176178304,
    digest: 'a89c0bd3c000a4507139aa9a765766f6e37e5f63',
    details: {
      parent_model: '',
      format: 'gguf',
      family: 'phi3',
      families: ['phi3'],
      parameter_size: '3.8B',
      quantization_level: 'Q4_K_M',
    },
  },
];

export async function checkOllamaConnection(host: string): Promise<ConnectionStatus> {
  const startTime = performance.now();
  try {
    // Check through proxy first to avoid browser CORS issues
    const proxyRes = await fetch('/api/health');
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        connected: data.status === 'connected',
        mode: data.mode === 'live' ? 'live' : 'local',
        host: data.host || host,
        latencyMs,
        lastChecked: Date.now(),
      };
    }
  } catch {
    // If proxy health fails, try direct ping
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const directRes = await fetch(`${host}/api/tags`, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const latencyMs = Math.round(performance.now() - startTime);

    if (directRes.ok) {
      return {
        connected: true,
        mode: 'live',
        host,
        latencyMs,
        lastChecked: Date.now(),
      };
    }
  } catch {
    // Expected when Ollama is not running locally
  }

  return {
    connected: false,
    mode: 'local',
    host,
    latencyMs: 12,
    lastChecked: Date.now(),
  };
}

export async function fetchInstalledModels(host: string): Promise<OllamaModel[]> {
  try {
    // Try backend proxy first
    const res = await fetch('/api/ollama/tags');
    if (res.ok) {
      const data = await res.json();
      if (data.models && Array.isArray(data.models) && data.models.length > 0) {
        return data.models;
      }
    }
  } catch {
    // Fall back to direct or default
  }

  try {
    const directRes = await fetch(`${host}/api/tags`);
    if (directRes.ok) {
      const data = await directRes.json();
      if (data.models && Array.isArray(data.models)) {
        return data.models;
      }
    }
  } catch {
    // Fallback
  }

  return DEFAULT_MODELS;
}

export interface StreamChatParams {
  model: string;
  messages: Array<{ role: string; content: string }>;
  settings: AppSettings;
  signal?: AbortSignal;
  onToken: (token: string) => void;
  onComplete: (fullText: string, metrics: { tokens: number; durationMs: number; tokensPerSec: number }) => void;
  onError: (error: string) => void;
}

export async function streamChatCompletion({
  model,
  messages,
  settings,
  signal,
  onToken,
  onComplete,
  onError,
}: StreamChatParams): Promise<void> {
  const startTime = performance.now();
  let fullResponse = '';
  let tokenCount = 0;

  try {
    // Call proxy /api/ollama/chat
    const response = await fetch('/api/ollama/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        options: {
          temperature: settings.temperature,
          top_p: settings.topP,
          num_ctx: settings.contextLength,
        },
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body stream is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const parsed = JSON.parse(trimmed);
          const chunk = parsed.message?.content || parsed.response || '';
          if (chunk) {
            fullResponse += chunk;
            tokenCount += 1;
            onToken(chunk);
          }
        } catch {
          // If plain text token
          fullResponse += trimmed;
          tokenCount += 1;
          onToken(trimmed);
        }
      }
    }

    // Flush any leftover in buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim());
        const chunk = parsed.message?.content || parsed.response || '';
        if (chunk) {
          fullResponse += chunk;
          tokenCount += 1;
          onToken(chunk);
        }
      } catch {
        fullResponse += buffer.trim();
        onToken(buffer.trim());
      }
    }

    const durationMs = Math.round(performance.now() - startTime);
    const tokensPerSec = durationMs > 0 ? Math.round((tokenCount / (durationMs / 1000)) * 10) / 10 : 25;

    onComplete(fullResponse, {
      tokens: tokenCount,
      durationMs,
      tokensPerSec,
    });
  } catch (err: any) {
    if (signal?.aborted) {
      const durationMs = Math.round(performance.now() - startTime);
      const tokensPerSec = durationMs > 0 ? Math.round((tokenCount / (durationMs / 1000)) * 10) / 10 : 20;
      onComplete(fullResponse, {
        tokens: tokenCount,
        durationMs,
        tokensPerSec,
      });
      return;
    }
    onError(err.message || 'Error communicating with Ollama inference engine');
  }
}

/**
 * Format raw bytes into human readable size
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
