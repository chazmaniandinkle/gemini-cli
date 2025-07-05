/**
 * Gemini Inference Core - Implementation for Google's Gemini API
 * Part of the Eidolon CLI architecture refactoring
 */

import { GoogleGenAI, GenerateContentParameters } from '@google/genai';
import { InferenceCore, InferenceOptions, InferenceResponse, InferenceError } from './inference-core.js';

/**
 * Gemini-specific configuration for the inference core.
 */
export interface GeminiCoreConfig {
  apiKey: string;
  model?: string;
  vertexai?: boolean;
  httpOptions?: {
    headers?: Record<string, string>;
  };
}

/**
 * Gemini implementation of the InferenceCore interface.
 * Handles all interactions with the Gemini API.
 */
export class GeminiCore implements InferenceCore {
  private readonly googleGenAI: GoogleGenAI;
  private readonly defaultModel: string;

  constructor(private readonly config: GeminiCoreConfig) {
    this.googleGenAI = new GoogleGenAI({
      apiKey: config.apiKey,
      vertexai: config.vertexai,
      httpOptions: config.httpOptions,
    });
    this.defaultModel = config.model || 'gemini-1.5-flash';
  }

  getName(): string {
    return 'gemini';
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple test to verify API connectivity
      await this.googleGenAI.models.countTokens({
        model: this.defaultModel,
        contents: [{ role: 'user', parts: [{ text: 'test' }] }],
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async execute(prompt: string, options: InferenceOptions = {}): Promise<InferenceResponse> {
    try {
      const model = options.model || this.defaultModel;
      
      const request: GenerateContentParameters = {
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: options.temperature,
          maxOutputTokens: options.maxTokens,
          systemInstruction: options.systemPrompt ? { parts: [{ text: options.systemPrompt }] } : undefined,
          abortSignal: options.abortSignal,
        },
      };

      const response = await this.googleGenAI.models.generateContent(request);
      
      return this.convertResponse(response, model);
    } catch (error) {
      throw new InferenceError(
        `Gemini API error: ${error instanceof Error ? error.message : String(error)}`,
        'gemini',
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  async executeStream(prompt: string, options: InferenceOptions = {}): Promise<AsyncGenerator<InferenceResponse>> {
    try {
      const model = options.model || this.defaultModel;
      
      const request: GenerateContentParameters = {
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: options.temperature,
          maxOutputTokens: options.maxTokens,
          systemInstruction: options.systemPrompt ? { parts: [{ text: options.systemPrompt }] } : undefined,
          abortSignal: options.abortSignal,
        },
      };

      const stream = await this.googleGenAI.models.generateContentStream(request);
      
      return this.convertStreamResponse(stream, model);
    } catch (error) {
      throw new InferenceError(
        `Gemini API streaming error: ${error instanceof Error ? error.message : String(error)}`,
        'gemini',
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  private convertResponse(response: any, model: string): InferenceResponse {
    const candidate = response.candidates?.[0];
    const content = candidate?.content?.parts?.map((part: any) => part.text).join('') || '';
    
    return {
      content,
      finishReason: this.mapFinishReason(candidate?.finishReason),
      usage: response.usageMetadata ? {
        inputTokens: response.usageMetadata.promptTokenCount,
        outputTokens: response.usageMetadata.candidatesTokenCount,
        totalTokens: response.usageMetadata.totalTokenCount,
      } : undefined,
      metadata: {
        model,
        provider: 'gemini',
      },
    };
  }

  private async *convertStreamResponse(stream: AsyncGenerator<any>, model: string): AsyncGenerator<InferenceResponse> {
    for await (const chunk of stream) {
      const candidate = chunk.candidates?.[0];
      const content = candidate?.content?.parts?.map((part: any) => part.text).join('') || '';
      
      if (content) {
        yield {
          content,
          finishReason: this.mapFinishReason(candidate?.finishReason),
          usage: chunk.usageMetadata ? {
            inputTokens: chunk.usageMetadata.promptTokenCount,
            outputTokens: chunk.usageMetadata.candidatesTokenCount,
            totalTokens: chunk.usageMetadata.totalTokenCount,
          } : undefined,
          metadata: {
            model,
            provider: 'gemini',
          },
        };
      }
    }
  }

  private mapFinishReason(reason: string | undefined): InferenceResponse['finishReason'] {
    switch (reason) {
      case 'STOP':
        return 'completed';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
      case 'RECITATION':
        return 'stop';
      default:
        return 'completed';
    }
  }
}