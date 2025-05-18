export interface APIError {
  code: number;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorState {
  hasError: boolean;
  error?: APIError | ValidationError;
} 