/**
 * Inference Core Factory - Creates appropriate inference core based on configuration
 */

import { InferenceCore } from './inference-core.js';
import { GeminiCore, GeminiCoreConfig } from './gemini-core.js';
import { OllamaCore, OllamaCoreConfig } from './ollama-core.js';
import { AuthType } from '../core/contentGenerator.js';

export interface InferenceCoreFactoryConfig {
  authType: AuthType;
  model?: string;
  apiKey?: string;
  vertexai?: boolean;
  ollamaHost?: string;
}

/**
 * Factory function to create the appropriate inference core based on auth type
 */
export function createInferenceCore(config: InferenceCoreFactoryConfig): InferenceCore {
  switch (config.authType) {
    case AuthType.USE_GEMINI:
    case AuthType.USE_VERTEX_AI:
    case AuthType.LOGIN_WITH_GOOGLE_PERSONAL: {
      if (!config.apiKey && config.authType !== AuthType.LOGIN_WITH_GOOGLE_PERSONAL) {
        throw new Error(`API key required for auth type: ${config.authType}`);
      }
      
      const geminiConfig: GeminiCoreConfig = {
        apiKey: config.apiKey || '',
        model: config.model,
        vertexai: config.vertexai,
      };
      
      return new GeminiCore(geminiConfig);
    }
    
    case AuthType.USE_OLLAMA: {
      const ollamaConfig: OllamaCoreConfig = {
        host: config.ollamaHost || process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: config.model || process.env.OLLAMA_MODEL || 'qwen3:1.7b',
      };
      
      return new OllamaCore(ollamaConfig);
    }
    
    default:
      throw new Error(`Unsupported auth type: ${config.authType}`);
  }
}

/**
 * Helper function to determine auth type from environment variables
 */
export function detectAuthType(): AuthType {
  if (process.env.USE_OLLAMA === 'true') {
    return AuthType.USE_OLLAMA;
  }
  
  if (process.env.GEMINI_API_KEY) {
    return AuthType.USE_GEMINI;
  }
  
  if (process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_LOCATION) {
    return AuthType.USE_VERTEX_AI;
  }
  
  // Default to Google Personal login if nothing else is configured
  return AuthType.LOGIN_WITH_GOOGLE_PERSONAL;
}

/**
 * Convenience function to create inference core from environment variables
 */
export function createInferenceCoreFromEnv(): InferenceCore {
  const authType = detectAuthType();
  
  const config: InferenceCoreFactoryConfig = {
    authType,
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    vertexai: authType === AuthType.USE_VERTEX_AI,
    ollamaHost: process.env.OLLAMA_BASE_URL,
    model: process.env.OLLAMA_MODEL || undefined,
  };
  
  return createInferenceCore(config);
}