import { useState, useCallback } from 'react';
import { Orchestrator, OrchestratorRequest } from '@google-gemini/core';
import { StreamingState, HistoryItem, MessageType } from '../types.js';

export const useOrchestratorStream = (
  orchestrator: Orchestrator,
  _history: HistoryItem[],
  addItem: (item: HistoryItem, timestamp: number) => void,
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const [streamingState, setStreamingState] = useState<StreamingState>(StreamingState.Idle);
  const [initError, setInitError] = useState<string | null>(null);

  const submitQuery = useCallback(async (prompt: string) => {
    setShowHelp(false);
    setStreamingState(StreamingState.Responding);
    const timestamp = Date.now();
    try {
      const request: OrchestratorRequest = { prompt };
      const stream = orchestrator.executeStream(request);
      let buffer = '';
      for await (const chunk of stream) {
        buffer += chunk.content;
        addItem({ type: 'gemini', text: buffer }, timestamp);
      }
    } catch (e) {
      const msg = (e as Error).message;
      setInitError(msg);
      addItem({ type: MessageType.ERROR, text: msg }, timestamp);
    } finally {
      setStreamingState(StreamingState.Idle);
    }
  }, [orchestrator, addItem, setShowHelp]);

  return {
    streamingState,
    submitQuery,
    initError,
    pendingHistoryItems: [],
    thought: null,
  };
};
