/**
 * Ollama ContentGenerator - Wrapper to make Ollama compatible with ContentGenerator interface
 */

import { Ollama } from 'ollama';
import { ContentGenerator } from './contentGenerator.js';
import {
  GenerateContentResponse,
  GenerateContentParameters,
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
} from '@google/genai';

/**
 * Wrapper class to make Ollama compatible with the ContentGenerator interface
 */
export class OllamaContentGenerator implements ContentGenerator {
  private readonly ollama: Ollama;
  private readonly defaultModel: string;

  constructor(host: string, defaultModel: string = 'deepseek-r1:8b') {
    this.ollama = new Ollama({ host });
    this.defaultModel = defaultModel;
  }

  async generateContent(request: GenerateContentParameters): Promise<GenerateContentResponse> {
    try {
      const model = request.model || this.defaultModel;
      const prompt = this.extractPromptFromRequest(request);
      const systemPrompt = this.extractSystemPromptFromRequest(request);

      const response = await this.ollama.generate({
        model,
        prompt,
        system: systemPrompt,
        options: {
          temperature: request.config?.temperature,
          num_predict: request.config?.maxOutputTokens,
        },
        stream: false,
      });

      return this.convertToGeminiResponse(response, model);
    } catch (error) {
      throw new Error(`Ollama generate error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateContentStream(request: GenerateContentParameters): Promise<AsyncGenerator<GenerateContentResponse>> {
    try {
      const model = request.model || this.defaultModel;
      const prompt = this.extractPromptFromRequest(request);
      const systemPrompt = this.extractSystemPromptFromRequest(request);

      const stream = await this.ollama.generate({
        model,
        prompt,
        system: systemPrompt,
        options: {
          temperature: request.config?.temperature,
          num_predict: request.config?.maxOutputTokens,
        },
        stream: true,
      });

      return this.convertStreamToGeminiResponse(stream as any, model);
    } catch (error) {
      throw new Error(`Ollama stream error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async countTokens(request: CountTokensParameters): Promise<CountTokensResponse> {
    // Ollama doesn't have a direct token counting API, so we estimate
    const prompt = this.extractPromptFromRequest(request);
    const estimatedTokens = Math.ceil(prompt.length / 4); // Rough estimation: 1 token per 4 characters
    
    return {
      totalTokens: estimatedTokens,
    };
  }

  async embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse> {
    try {
      const model = request.model || this.defaultModel;
      const content = request.contents || '';

      // Try to use embedding model if available, otherwise fall back to generate
      const response = await this.ollama.embeddings({
        model: model.includes('embed') ? model : 'nomic-embed-text', // Common embedding model
        prompt: Array.isArray(content) ? content.join(' ') : String(content),
      });

      return {
        embeddings: [{ values: response.embedding }],
      };
    } catch (error) {
      // If embedding fails, return a mock response
      console.warn('Ollama embedding failed, returning mock response:', error);
      return {
        embeddings: [{ values: new Array(768).fill(0) }], // Mock 768-dimensional embedding
      };
    }
  }

  private extractPromptFromRequest(request: GenerateContentParameters | CountTokensParameters): string {
    if (!request.contents || !Array.isArray(request.contents) || request.contents.length === 0) {
      return '';
    }

    return request.contents
      .map((content: any) => 
        content.parts
          ?.map((part: any) => 'text' in part ? part.text : '')
          .join('') || ''
      )
      .join('\n');
  }

  private extractSystemPromptFromRequest(request: GenerateContentParameters): string | undefined {
    if (request.config?.systemInstruction) {
      return (request.config.systemInstruction as any).parts
        ?.map((part: any) => 'text' in part ? part.text : '')
        .join('') || undefined;
    }
    return undefined;
  }

  private convertToGeminiResponse(ollamaResponse: any, model: string): GenerateContentResponse {
    const response = ollamaResponse.response || '';
    return {
      candidates: [{
        content: {
          parts: [{ text: response }],
          role: 'model',
        },
        finishReason: ollamaResponse.done ? 'STOP' as any : 'OTHER' as any,
        index: 0,
      }],
      usageMetadata: {
        promptTokenCount: ollamaResponse.prompt_eval_count || 0,
        candidatesTokenCount: ollamaResponse.eval_count || 0,
        totalTokenCount: (ollamaResponse.prompt_eval_count || 0) + (ollamaResponse.eval_count || 0),
      },
      modelVersion: model,
      text: response,
      data: response,
      functionCalls: [],
      executableCode: '',
      codeExecutionResult: undefined,
    } as GenerateContentResponse;
  }

  private async *convertStreamToGeminiResponse(
    stream: AsyncGenerator<any>, 
    model: string
  ): AsyncGenerator<GenerateContentResponse> {
    for await (const chunk of stream) {
      if (chunk.response) {
        yield {
          candidates: [{
            content: {
              parts: [{ text: chunk.response }],
              role: 'model',
            },
            finishReason: chunk.done ? 'STOP' as any : undefined,
            index: 0,
          }],
          usageMetadata: chunk.done ? {
            promptTokenCount: chunk.prompt_eval_count || 0,
            candidatesTokenCount: chunk.eval_count || 0,
            totalTokenCount: (chunk.prompt_eval_count || 0) + (chunk.eval_count || 0),
          } : undefined,
          modelVersion: model,
          text: chunk.response,
          data: chunk.response,
          functionCalls: [],
          executableCode: '',
          codeExecutionResult: undefined,
        } as GenerateContentResponse;
      }
    }
  }
}