/* global fetch, console, localStorage */

interface OpenRouterSettings {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  temperature: number;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenRouterService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = "https://openrouter.ai/api/v1";
    this.apiKey = "";
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private getSettings(): OpenRouterSettings {
    const defaultSettings: OpenRouterSettings = {
      apiKey: "",
      baseUrl: "https://openrouter.ai/api/v1",
      defaultModel: "openai/gpt-3.5-turbo",
      temperature: 0.7,
    };
    const savedSettings = localStorage.getItem("providerSettings");
    if (savedSettings) {
      const { openRouterSettings } = JSON.parse(savedSettings);
      return openRouterSettings || defaultSettings;
    }
    return defaultSettings;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const settings = this.getSettings();
    const response = await fetch(`${settings.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
        "HTTP-Referer": "https://word-addin.com",
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
      const response = await this.makeRequest("/models");
      return response.data.map((model: any) => model.id);
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
      const response = await this.makeRequest("/chat/completions", {
        method: "POST",
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            ...(stylePrompt ? [{ role: "system", content: stylePrompt }] : []),
            { role: "user", content: prompt },
          ],
          temperature: temperature ?? settings.temperature,
        }),
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error("No response from OpenRouter");
      }

      return response.choices[0].message.content;
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

  async generate(text: string, model?: string, stylePrompt?: string, temperature?: number): Promise<string> {
    const prompt = `Generate new content based on the following text: ${text}`;
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
      const response = await this.makeRequest("/chat/completions", {
        method: "POST",
        body: JSON.stringify({
          model: modelToUse,
          messages: messages,
          temperature: temperature ?? settings.temperature,
          stream: stream,
        }),
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error("No response from OpenRouter");
      }

      const content = response.choices[0].message.content;
      if (onChunk) {
        onChunk(content);
      }
      return content;
    } catch (error) {
      console.error("Error in chat:", error);
      throw error;
    }
  }
}
