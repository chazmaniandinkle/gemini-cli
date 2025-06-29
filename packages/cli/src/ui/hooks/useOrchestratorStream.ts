import { useState, useCallback } from 'react';
import {
  Orchestrator,
  OrchestratorRequest,
  getErrorMessage,
  type Config,
} from '@google/gemini-cli-core';
import { StreamingState, MessageType, HistoryItemWithoutId } from '../types.js';
import { UseHistoryManagerReturn } from './useHistoryManager.js';

export const useOrchestratorStream = (
  orchestrator: Orchestrator,
  _history: HistoryItemWithoutId[],
  addItem: UseHistoryManagerReturn['addItem'],
  _setShowHelp: React.Dispatch<React.SetStateAction<boolean>>,
  config: Config,
) => {
  const [streamingState, setStreamingState] = useState<StreamingState>(
    StreamingState.Idle,
  );
  const [initError, setInitError] = useState<string | null>(null);
  const [pendingHistoryItems, setPendingHistoryItems] = useState<HistoryItemWithoutId[]>([]);
  const thought = null;

  const submitQuery = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) {
        return;
      }
      const timestamp = Date.now();
      addItem({ type: MessageType.USER, text: trimmed }, timestamp);
      setStreamingState(StreamingState.Responding);
      try {
        const request: OrchestratorRequest = {
          prompt: trimmed,
          sessionId: config.getSessionId(),
        };
        let buffer = '';
        for await (const chunk of orchestrator.executeStream(request)) {
          buffer += chunk.content;
          setPendingHistoryItems([{ type: 'gemini', text: buffer }]);
        }
        addItem({ type: MessageType.GEMINI, text: buffer }, Date.now());
      } catch (error) {
        const msg = getErrorMessage(error);
        setInitError(msg);
        addItem({ type: MessageType.ERROR, text: msg }, Date.now());
      } finally {
        setStreamingState(StreamingState.Idle);
        setPendingHistoryItems([]);
      }
    },
    [orchestrator, config, addItem],
  );

  return { streamingState, submitQuery, initError, pendingHistoryItems, thought };
};
