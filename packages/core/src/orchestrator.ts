/**
 * Orchestrator - Central nervous system for Eidolon CLI
 * Coordinates between inference cores and data oasis
 */

import { InferenceCore, InferenceOptions, InferenceResponse } from './inference/index.js';
import { DataOasis, LogEntry } from './data-oasis/index.js';
import { randomUUID } from 'node:crypto';

/**
 * Request interface for the orchestrator.
 */
export interface OrchestratorRequest {
  prompt: string;
  sessionId?: string;
  options?: InferenceOptions;
  metadata?: Record<string, any>;
}

/**
 * Response interface from the orchestrator.
 */
export interface OrchestratorResponse {
  content: string;
  sessionId: string;
  finishReason?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Configuration for the orchestrator.
 */
export interface OrchestratorConfig {
  inferenceCore: InferenceCore;
  dataOasis: DataOasis;
  defaultSessionId?: string;
  enableLogging?: boolean;
}

/**
 * The Orchestrator class - central coordination point for all AI interactions.
 * 
 * This class acts as the "nervous system" of the Eidolon CLI, coordinating
 * between different inference cores and managing data through the Data Oasis.
 */
export class Orchestrator {
  private readonly config: OrchestratorConfig;

  constructor(config: OrchestratorConfig) {
    this.config = {
      enableLogging: true,
      ...config,
    };
  }

  /**
   * Execute a request through the orchestrator.
   * This is the main entry point for AI interactions.
   */
  async execute(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const sessionId = request.sessionId || this.config.defaultSessionId || randomUUID();
    const startTime = Date.now();

    try {
      // Log the incoming request if logging is enabled
      if (this.config.enableLogging) {
        await this.logInteraction({
          id: randomUUID(),
          timestamp: new Date(),
          type: 'interaction',
          sessionId,
          data: {
            type: 'request',
            prompt: request.prompt,
            options: request.options,
            metadata: request.metadata,
          },
          tags: ['request', 'orchestrator'],
        });
      }

      // Execute the request through the inference core
      const inferenceResponse = await this.config.inferenceCore.execute(
        request.prompt,
        request.options
      );

      // Prepare the orchestrator response
      const response: OrchestratorResponse = {
        content: inferenceResponse.content,
        sessionId,
        finishReason: inferenceResponse.finishReason,
        usage: inferenceResponse.usage,
        metadata: {
          ...inferenceResponse.metadata,
          ...request.metadata,
          processingTimeMs: Date.now() - startTime,
        },
      };

      // Log the response if logging is enabled
      if (this.config.enableLogging) {
        await this.logInteraction({
          id: randomUUID(),
          timestamp: new Date(),
          type: 'interaction',
          sessionId,
          data: {
            type: 'response',
            content: response.content,
            finishReason: response.finishReason,
            usage: response.usage,
            processingTimeMs: response.metadata?.processingTimeMs,
          },
          tags: ['response', 'orchestrator'],
        });
      }

      return response;
    } catch (error) {
      // Log errors if logging is enabled
      if (this.config.enableLogging) {
        await this.logInteraction({
          id: randomUUID(),
          timestamp: new Date(),
          type: 'error',
          sessionId,
          data: {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            request: {
              prompt: request.prompt,
              options: request.options,
            },
          },
          tags: ['error', 'orchestrator'],
        });
      }

      throw error;
    }
  }

  /**
   * Execute a streaming request through the orchestrator.
   */
  async *executeStream(request: OrchestratorRequest): AsyncGenerator<OrchestratorResponse> {
    const sessionId = request.sessionId || this.config.defaultSessionId || randomUUID();
    const startTime = Date.now();

    try {
      // Log the incoming streaming request
      if (this.config.enableLogging) {
        await this.logInteraction({
          id: randomUUID(),
          timestamp: new Date(),
          type: 'interaction',
          sessionId,
          data: {
            type: 'stream_request',
            prompt: request.prompt,
            options: request.options,
            metadata: request.metadata,
          },
          tags: ['stream_request', 'orchestrator'],
        });
      }

      // Execute the streaming request through the inference core
      const inferenceStream = await this.config.inferenceCore.executeStream(
        request.prompt,
        request.options
      );

      let chunkCount = 0;
      for await (const inferenceResponse of inferenceStream) {
        chunkCount++;
        
        const response: OrchestratorResponse = {
          content: inferenceResponse.content,
          sessionId,
          finishReason: inferenceResponse.finishReason,
          usage: inferenceResponse.usage,
          metadata: {
            ...inferenceResponse.metadata,
            ...request.metadata,
            chunkIndex: chunkCount,
            streamStartTimeMs: startTime,
          },
        };

        yield response;
      }

      // Log the completion of the stream
      if (this.config.enableLogging) {
        await this.logInteraction({
          id: randomUUID(),
          timestamp: new Date(),
          type: 'interaction',
          sessionId,
          data: {
            type: 'stream_complete',
            chunkCount,
            totalTimeMs: Date.now() - startTime,
          },
          tags: ['stream_complete', 'orchestrator'],
        });
      }
    } catch (error) {
      // Log streaming errors
      if (this.config.enableLogging) {
        await this.logInteraction({
          id: randomUUID(),
          timestamp: new Date(),
          type: 'error',
          sessionId,
          data: {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            streamRequest: {
              prompt: request.prompt,
              options: request.options,
            },
          },
          tags: ['stream_error', 'orchestrator'],
        });
      }

      throw error;
    }
  }

  /**
   * Get the current inference core.
   */
  getInferenceCore(): InferenceCore {
    return this.config.inferenceCore;
  }

  /**
   * Get the data oasis instance.
   */
  getDataOasis(): DataOasis {
    return this.config.dataOasis;
  }

  /**
   * Get session logs for a specific session.
   */
  async getSessionLogs(sessionId: string): Promise<LogEntry[]> {
    return this.config.dataOasis.getLogs({ sessionId });
  }

  /**
   * Get recent interactions across all sessions.
   */
  async getRecentInteractions(limit: number = 50): Promise<LogEntry[]> {
    return this.config.dataOasis.getLogs({ 
      type: 'interaction',
      limit,
    });
  }

  private async logInteraction(entry: LogEntry): Promise<void> {
    try {
      await this.config.dataOasis.log(entry);
    } catch (error) {
      // Don't fail the main operation if logging fails
      console.warn('Failed to log interaction:', error);
    }
  }
}