/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GenerateContentParameters,
  GenerateContentResponse,
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
} from '@google/genai';

/**
 * Defines the unified interface for an AI model inference provider.
 * This is the single source of truth for all AI backend abstractions.
 */
export interface InferenceProvider {
  /**
   * Makes a request to the provider to generate content and returns the response as a stream.
   * @param request The content generation request, formatted according to the Google AI SDK.
   * @returns A promise that resolves with an async generator of content responses.
   */
  generateContentStream(request: GenerateContentParameters): Promise<AsyncGenerator<GenerateContentResponse>>;

  /**
   * Makes a request to the provider to generate content and returns a single response.
   * @param request The content generation request, formatted according to the Google AI SDK.
   * @returns A promise that resolves with a single content response.
   */
  generateContent(request: GenerateContentParameters): Promise<GenerateContentResponse>;

  /**
   * Counts the tokens in the given request.
   * @param request The token counting request.
   * @returns A promise that resolves with token count information.
   */
  countTokens(request: CountTokensParameters): Promise<CountTokensResponse>;

  /**
   * Generates embeddings for the given content.
   * @param request The embedding request.
   * @returns A promise that resolves with embedding information.
   */
  embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse>;

  /**
   * Lists the models available from this provider.
   * @returns A promise that resolves with an array of model ID strings.
   */
  listModels(): Promise<string[]>;
}