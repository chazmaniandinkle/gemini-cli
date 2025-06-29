/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { InferenceProvider } from './inferenceProvider.js';
import {
  GenerateContentParameters,
  GenerateContentResponse,
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  GoogleGenAI,
} from '@google/genai';
import { ContentGeneratorConfig } from './contentGenerator.js';

export class GoogleAIProvider implements InferenceProvider {
  private readonly googleGenAI: GoogleGenAI;

  constructor(config: ContentGeneratorConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required for Google AI provider');
    }

    const version = process.env.CLI_VERSION || process.version;
    const httpOptions = {
      headers: {
        'User-Agent': `GeminiCLI/${version} (${process.platform}; ${process.arch})`,
      },
    };

    this.googleGenAI = new GoogleGenAI({
      apiKey: config.apiKey,
      vertexai: config.vertexai,
      httpOptions,
    });
  }

  async generateContent(request: GenerateContentParameters): Promise<GenerateContentResponse> {
    return this.googleGenAI.models.generateContent(request);
  }

  async generateContentStream(request: GenerateContentParameters): Promise<AsyncGenerator<GenerateContentResponse>> {
    return this.googleGenAI.models.generateContentStream(request);
  }

  async countTokens(request: CountTokensParameters): Promise<CountTokensResponse> {
    return this.googleGenAI.models.countTokens(request);
  }

  async embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse> {
    return this.googleGenAI.models.embedContent(request);
  }

  async listModels(): Promise<string[]> {
    try {
      const result = await this.googleGenAI.models.list();
      // Handle the pager result structure
      const models: any[] = [];
      for await (const model of result) {
        models.push(model);
      }
      return models.map((model: any) => model.name);
    } catch (error) {
      // Fallback to a basic list if the API doesn't support listing
      return ['gemini-1.5-pro', 'gemini-1.5-flash'];
    }
  }
}