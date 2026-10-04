import { getSetting, setSetting } from "../utils/db.js";

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

// NVIDIA models available (free tier)
export const AVAILABLE_MODELS = [
  {
    id: "nvidia/nemotron-3.5-lightning-30b-a3b",
    name: "Nemotron 3.5 Lightning",
    provider: "NVIDIA",
    context: 128000,
    speed: "fast"
  },
  {
    id: "meta/llama-3.1-405b-instruct",
    name: "Llama 3.1 405B",
    provider: "NVIDIA",
    context: 128000,
    speed: "slow"
  },
  {
    id: "meta/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    provider: "NVIDIA",
    context: 128000,
    speed: "medium"
  },
  {
    id: "meta/llama-3.1-8b-instruct",
    name: "Llama 3.1 8B",
    provider: "NVIDIA",
    context: 128000,
    speed: "fast"
  },
  {
    id: "mistralai/mistral-large-2-instruct",
    name: "Mistral Large 2",
    provider: "NVIDIA",
    context: 128000,
    speed: "medium"
  },
  {
    id: "mistralai/mistral-nemo-12b-instruct",
    name: "Mistral NeMo 12B",
    provider: "NVIDIA",
    context: 128000,
    speed: "fast"
  },
  {
    id: "google/gemma-2-9b-it",
    name: "Gemma 2 9B",
    provider: "NVIDIA",
    context: 8192,
    speed: "fast"
  },
  {
    id: "microsoft/phi-3.5-mini-instruct",
    name: "Phi 3.5 Mini",
    provider: "NVIDIA",
    context: 128000,
    speed: "fast"
  },
];

const DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";

export function getSelectedModel(): string {
  return getSetting("selected_model") || DEFAULT_MODEL;
}

export function setSelectedModel(model: string): void {
  setSetting("selected_model", model);
}

export function getAvailableModels() {
  return AVAILABLE_MODELS;
}

export function setNvidiaApiKey(key: string): void {
  setSetting("nvidia_api_key", key);
}

export function getNvidiaApiKey(): string | undefined {
  return getSetting("nvidia_api_key");
}

export function hasApiKey(): boolean {
  return !!getSetting("nvidia_api_key");
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 60000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function chat(messages: LLMMessage[], model?: string): Promise<LLMResponse> {
  const apiKey = getNvidiaApiKey();
  if (!apiKey) throw new Error("No NVIDIA API key configured. Run setup first.");

  const selectedModel = model || getSelectedModel();

  const response = await fetchWithTimeout(NVIDIA_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error (${response.status}): ${error}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }>; usage?: { total_tokens: number } };
  return {
    content: data.choices[0]?.message?.content || "",
    tokensUsed: data.usage?.total_tokens || 0,
    model: selectedModel,
  };
}

export async function* chatStream(messages: LLMMessage[], model?: string): AsyncGenerator<StreamChunk> {
  const apiKey = getNvidiaApiKey();
  if (!apiKey) throw new Error("No NVIDIA API key configured. Run setup first.");

  const selectedModel = model || getSelectedModel();

  const response = await fetchWithTimeout(NVIDIA_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error (${response.status}): ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            yield { content: "", done: true };
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || "";
            if (content) {
              yield { content, done: false };
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  yield { content: "", done: true };
}

export async function testConnection(): Promise<boolean> {
  try {
    await chat([{ role: "user", content: "Hi" }]);
    return true;
  } catch {
    return false;
  }
}