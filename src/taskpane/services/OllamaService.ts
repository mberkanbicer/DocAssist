/* global fetch, console, localStorage */

interface OllamaSettings {
  baseUrl: string;
  defaultModel: string;
  temperature: number;
}

export interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export class OllamaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "http://localhost:11434";
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private getSettings(): OllamaSettings {
    const defaultSettings: OllamaSettings = {
      baseUrl: "http://localhost:11434",
      defaultModel: "",
      temperature: 0.7,
    };
    const savedSettings = localStorage.getItem("ollamaSettings");
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const settings = this.getSettings();
    const response = await fetch(`${settings.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.makeRequest("/api/tags");
      return response.models.map((model: OllamaModel) => model.name);
    } catch (error) {
      console.error("Error listing models:", error);
      throw error;
    }
  }

  async generateText(prompt: string, model?: string, stylePrompt?: string, temperature?: number): Promise<string> {
    const settings = this.getSettings();
    const modelToUse = model || settings.defaultModel;
    if (!modelToUse) {
      throw new Error("No model specified");
    }

    try {
      const response = await fetch(`${settings.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelToUse,
          prompt: stylePrompt ? `${stylePrompt}\n\n${prompt}` : prompt,
          temperature: temperature ?? settings.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let fullResponse = "";
      const decoder = new TextDecoder();
      let isStreaming = true;

      while (isStreaming) {
        const { done, value } = await reader.read();
        if (done) {
          isStreaming = false;
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullResponse += data.response;
            }
            if (data.done) {
              return fullResponse;
            }
          } catch (e) {
            console.error("Error parsing JSON:", e);
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error("Error generating text:", error);
      throw error;
    }
  }

  async paraphrase(text: string, model?: string, stylePrompt?: string, temperature?: number): Promise<string> {
    const prompt = `Paraphrase the following text while maintaining its meaning: ${text}`;
    return this.generateText(prompt, model, stylePrompt, temperature);
  }

  async summarize(text: string, model?: string, stylePrompt?: string, temperature?: number): Promise<string> {
    const prompt = `Summarize the following text concisely: ${text}`;
    return this.generateText(prompt, model, stylePrompt, temperature);
  }

  async extend(text: string, model?: string, stylePrompt?: string, temperature?: number): Promise<string> {
    const prompt = `Extend and elaborate on the following text while maintaining its main ideas: ${text}`;
    return this.generateText(prompt, model, stylePrompt, temperature);
  }

  async translate(
    text: string,
    targetLanguage: string,
    model?: string,
    stylePrompt?: string,
    temperature?: number
  ): Promise<string> {
    const prompt = `Translate the following text to ${targetLanguage}: ${text}`;
    return this.generateText(prompt, model, stylePrompt, temperature);
  }

  async generateWithCustomPrompt(
    text: string,
    customPrompt: string,
    model?: string,
    stylePrompt?: string,
    temperature?: number
  ): Promise<string> {
    const prompt = `${customPrompt}: ${text}`;
    return this.generateText(prompt, model, stylePrompt, temperature);
  }

  async generate(text: string, model?: string, stylePrompt?: string, temperature?: number): Promise<string> {
    const prompt = `Generate new content based on the following text: ${text}`;
    return this.generateText(prompt, model, stylePrompt, temperature);
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    model?: string,
    stream: boolean = false,
    onChunk?: (chunk: string) => void,
    temperature?: number
  ): Promise<string> {
    const settings = this.getSettings();
    const modelToUse = model || settings.defaultModel;
    if (!modelToUse) {
      throw new Error("No model specified");
    }

    try {
      const response = await fetch(`${settings.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: messages,
          temperature: temperature ?? settings.temperature,
          stream: stream,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let fullResponse = "";
      const decoder = new TextDecoder();
      let isStreaming = true;

      while (isStreaming) {
        const { done, value } = await reader.read();
        if (done) {
          isStreaming = false;
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              const content = data.message.content;
              fullResponse += content;
              if (onChunk) {
                onChunk(content);
              }
            }
            if (data.done) {
              return fullResponse;
            }
          } catch (e) {
            console.error("Error parsing JSON:", e);
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error("Error in chat:", error);
      throw error;
    }
  }
}
