/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Config, Orchestrator, OrchestratorRequest } from '@google/gemini-cli-core';
import { parseAndFormatApiError } from './ui/utils/errorParsing.js';

export async function runNonInteractive(
  orchestrator: Orchestrator,
  config: Config,
  input: string,
): Promise<void> {
  process.stdout.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EPIPE') {
      process.exit(0);
    }
  });

  try {
    const request: OrchestratorRequest = {
      prompt: input,
      sessionId: config.getSessionId(),
      options: { model: config.getModel() },
      metadata: { source: 'non-interactive-cli' },
    };

    const response = await orchestrator.execute(request);
    if (response.content) {
      process.stdout.write(response.content + '\n');
    }
  } catch (error) {
    console.error(
      parseAndFormatApiError(error, config.getContentGeneratorConfig().authType),
    );
    process.exit(1);
  }
}
