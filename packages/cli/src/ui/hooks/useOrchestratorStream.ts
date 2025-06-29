import { useState, useCallback } from 'react';
import {
  Orchestrator,
  OrchestratorRequest,
  getErrorMessage,
} from '@google-gemini/core';
import { Config } from '@google/gemini-cli-core';
import {
  StreamingState,
  MessageType,
  HistoryItemWithoutId,
  HistoryItem,
} from '../types.js';
import { UseHistoryManagerReturn } from './useHistoryManager.js';

export const useOrchestratorStream = (
  orchestrator: Orchestrator,
  _history: HistoryItem[], // kept for API consistency
  addItem: UseHistoryManagerReturn['addItem'],
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>,
  config: Config,
) => {
  const [streamingState, setStreamingState] = useState<StreamingState>(
    StreamingState.Idle,
  );
  const [initError, setInitError] = useState<string | null>(null);
  const [pendingHistoryItems, setPendingHistoryItems] = useState<
    HistoryItemWithoutId[]
  >([]);
  const thought = null;

  const submitQuery = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) {
        return;
      }
      setShowHelp(false);
      const userMessageTimestamp = Date.now();
      // Add the user prompt immediately
      addItem({ type: MessageType.USER, text: trimmed }, userMessageTimestamp);
      setStreamingState(StreamingState.Responding);

      try {
        const request: OrchestratorRequest = {
          prompt: trimmed,
          sessionId: config.getSessionId(),
        };

        let buffer = '';
        const stream = await orchestrator.executeStream(request);
        for await (const chunk of stream) {
          buffer += chunk.content;
          setPendingHistoryItems([{ type: MessageType.GEMINI, text: buffer }]);
        }

        if (buffer) {
          addItem({ type: MessageType.GEMINI, text: buffer }, Date.now());
        }
      } catch (error) {
        const msg = getErrorMessage(error);
        setInitError(msg);
        addItem({ type: MessageType.ERROR, text: msg }, Date.now());
      } finally {
        setStreamingState(StreamingState.Idle);
        setPendingHistoryItems([]);
      }
    },
    [orchestrator, config, addItem, setShowHelp],
  );

  return {
    streamingState,
    submitQuery,
    initError,
    pendingHistoryItems,
    thought,
  };
};
