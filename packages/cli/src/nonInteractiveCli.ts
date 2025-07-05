/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Orchestrator, OrchestratorRequest } from '@google/gemini-cli-core';

export async function runNonInteractive(
  orchestrator: Orchestrator,
  input: string,
): Promise<void> {
  // Handle EPIPE errors when the output is piped to a command that closes early.
  process.stdout.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EPIPE') {
      // Exit gracefully if the pipe is closed.
      process.exit(0);
    }
  });

  try {
    const request: OrchestratorRequest = {
      prompt: input,
      metadata: { source: 'non-interactive-cli' },
    };
    const response = await orchestrator.execute(request);
    process.stdout.write(response.content + '\n');
  } catch (e) {
    console.error('An error occurred:', (e as Error).message);
    process.exit(1);
  }
}
