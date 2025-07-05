/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runNonInteractive } from './nonInteractiveCli.js';
import { Orchestrator } from '@google-gemini/core';

describe('runNonInteractive', () => {
  let orchestrator: Orchestrator;
  const writeSpy = vi.spyOn(process.stdout, 'write');
  const exitSpy = vi.spyOn(process, 'exit');

  beforeEach(() => {
    writeSpy.mockClear();
    exitSpy.mockImplementation(() => { throw new Error('exit'); }) as any;
    orchestrator = {
      execute: vi.fn().mockResolvedValue({ content: 'ok' })
    } as unknown as Orchestrator;
  });

  afterEach(() => {
    exitSpy.mockReset();
  });

  it('should call orchestrator and print response', async () => {
    try { await runNonInteractive(orchestrator, 'hello'); } catch {}
    expect((orchestrator.execute as any).mock.calls[0][0].prompt).toBe('hello');
    expect(writeSpy).toHaveBeenCalledWith('ok\n');
  });
});
