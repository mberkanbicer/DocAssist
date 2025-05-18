/* global process, fetch */
import { APIError } from "../types/errors";

export interface APIResponse<T> {
  data: T;
  error?: APIError;
}

export class APIService {
  private static instance: APIService;
  private baseUrl: string;
  private apiKey: string;

  private constructor() {
    this.baseUrl = process.env.API_BASE_URL || "";
    this.apiKey = process.env.API_KEY || "";
  }

  public static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    if (!response.ok) {
      const error: APIError = {
        code: response.status,
        message: response.statusText,
        details: await response.json().catch(() => null),
      };
      throw error;
    }

    const data = await response.json();
    return { data };
  }

  public async get<T>(endpoint: string): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async post<T>(endpoint: string, data: any): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): APIError {
    if (error instanceof Error) {
      return {
        code: 500,
        message: error.message,
        details: error.stack,
      };
    }
    return {
      code: 500,
      message: "An unexpected error occurred",
      details: error,
    };
  }
}
