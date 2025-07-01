/**
 * Ollama Inference Core - Implementation for local Ollama server
 * Part of the Eidolon CLI architecture refactoring
 */

import { Ollama } from 'ollama';
import { InferenceCore, InferenceOptions, InferenceResponse, InferenceError } from './inference-core.js';

/**
 * Ollama-specific configuration for the inference core.
 */
export interface OllamaCoreConfig {
  host?: string;
  model?: string;
  timeout?: number;
}

/**
 * Ollama implementation of the InferenceCore interface.
 * Handles all interactions with the local Ollama server.
 */
export class OllamaCore implements InferenceCore {
  private readonly ollama: Ollama;
  private readonly defaultModel: string;

  constructor(private readonly config: OllamaCoreConfig = {}) {
    this.ollama = new Ollama({
      host: config.host || process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    });
    this.defaultModel = config.model || process.env.OLLAMA_MODEL || 'qwen3:1.7b';
  }

  getName(): string {
    return 'ollama';
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test connectivity by listing models
      await this.ollama.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.ollama.list();
      return response.models.map(model => model.name);
    } catch (error) {
      throw new InferenceError(
        `Failed to list Ollama models: ${error instanceof Error ? error.message : String(error)}`,
        'ollama',
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  async execute(prompt: string, options: InferenceOptions = {}): Promise<InferenceResponse> {
    try {
      const model = options.model || this.defaultModel;
      
      const response = await this.ollama.generate({
        model,
        prompt,
        system: options.systemPrompt,
        options: {
          temperature: options.temperature,
          num_predict: options.maxTokens,
        },
        stream: false,
      });

      return this.convertResponse(response, model);
    } catch (error) {
      throw new InferenceError(
        `Ollama API error: ${error instanceof Error ? error.message : String(error)}`,
        'ollama',
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  async executeStream(prompt: string, options: InferenceOptions = {}): Promise<AsyncGenerator<InferenceResponse>> {
    try {
      const model = options.model || this.defaultModel;
      
      const stream = await this.ollama.generate({
        model,
        prompt,
        system: options.systemPrompt,
        options: {
          temperature: options.temperature,
          num_predict: options.maxTokens,
        },
        stream: true,
      });

      return this.convertStreamResponse(stream as any, model);
    } catch (error) {
      throw new InferenceError(
        `Ollama API streaming error: ${error instanceof Error ? error.message : String(error)}`,
        'ollama',
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  private convertResponse(response: any, model: string): InferenceResponse {
    return {
      content: response.response || '',
      finishReason: response.done ? 'completed' : 'stop',
      usage: {
        inputTokens: response.prompt_eval_count,
        outputTokens: response.eval_count,
        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
      },
      metadata: {
        model,
        provider: 'ollama',
        loadDuration: response.load_duration,
        promptEvalDuration: response.prompt_eval_duration,
        evalDuration: response.eval_duration,
      },
    };
  }

  private async *convertStreamResponse(stream: AsyncGenerator<any>, model: string): AsyncGenerator<InferenceResponse> {
    for await (const chunk of stream) {
      if (chunk.response) {
        yield {
          content: chunk.response,
          finishReason: chunk.done ? 'completed' : undefined,
          usage: chunk.done ? {
            inputTokens: chunk.prompt_eval_count,
            outputTokens: chunk.eval_count,
            totalTokens: (chunk.prompt_eval_count || 0) + (chunk.eval_count || 0),
          } : undefined,
          metadata: {
            model,
            provider: 'ollama',
            ...(chunk.done && {
              loadDuration: chunk.load_duration,
              promptEvalDuration: chunk.prompt_eval_duration,
              evalDuration: chunk.eval_duration,
            }),
          },
        };
      }
    }
  }
}