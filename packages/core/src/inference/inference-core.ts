/**
 * Inference Core - Generic interface for pluggable AI backends
 * Part of the Eidolon CLI architecture refactoring
 */

/**
 * Generic interface for an Inference Core.
 * This provides the abstraction layer for pluggable inference backends.
 */
export interface InferenceCore {
  /**
   * Execute a prompt and return a response.
   * @param prompt - The input prompt/request
   * @param options - Optional configuration for the request
   * @returns Promise resolving to the response
   */
  execute(prompt: string, options?: InferenceOptions): Promise<InferenceResponse>;

  /**
   * Execute a prompt and return a streaming response.
   * @param prompt - The input prompt/request
   * @param options - Optional configuration for the request
   * @returns AsyncGenerator yielding response chunks
   */
  executeStream(prompt: string, options?: InferenceOptions): Promise<AsyncGenerator<InferenceResponse>>;

  /**
   * Get the name/identifier of this inference core.
   */
  getName(): string;

  /**
   * Check if this inference core is available/configured.
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Configuration options for inference requests.
 */
export interface InferenceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  abortSignal?: AbortSignal;
  [key: string]: any; // Allow additional provider-specific options
}

/**
 * Standard response format from inference cores.
 */
export interface InferenceResponse {
  content: string;
  finishReason?: 'completed' | 'length' | 'stop' | 'error';
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  metadata?: {
    model?: string;
    provider?: string;
    [key: string]: any;
  };
}

/**
 * Error thrown by inference cores.
 */
export class InferenceError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'InferenceError';
  }
}