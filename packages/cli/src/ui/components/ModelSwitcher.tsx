/**
 * Model Switcher Component - Allows switching between available models
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { OllamaCore } from '@google/gemini-cli-core';

interface ModelSwitcherProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  onClose: () => void;
  inferenceCore?: any;
}

export const ModelSwitcher: React.FC<ModelSwitcherProps> = ({
  currentModel,
  onModelChange,
  onClose,
  inferenceCore,
}) => {
  const [models, setModels] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        if (inferenceCore && inferenceCore instanceof OllamaCore) {
          const availableModels = await inferenceCore.getAvailableModels();
          setModels(availableModels);
          const currentIndex = availableModels.indexOf(currentModel);
          if (currentIndex >= 0) {
            setSelectedIndex(currentIndex);
          }
        } else {
          // Default Gemini models
          setModels(['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro']);
          const currentIndex = models.indexOf(currentModel);
          if (currentIndex >= 0) {
            setSelectedIndex(currentIndex);
          }
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load models');
        setLoading(false);
      }
    };

    loadModels();
  }, [inferenceCore, currentModel]);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(models.length - 1, prev + 1));
    } else if (key.return) {
      onModelChange(models[selectedIndex]);
      onClose();
    } else if (key.escape) {
      onClose();
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" padding={1} borderStyle="round">
        <Text>Loading available models...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1} borderStyle="round">
        <Text color="red">Error: {error}</Text>
        <Text dimColor>Press ESC to close</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1} borderStyle="round">
      <Text bold>Select Model</Text>
      <Text dimColor>Use ↑/↓ to navigate, Enter to select, ESC to cancel</Text>
      <Box flexDirection="column" marginTop={1}>
        {models.map((model, index) => (
          <Box key={model}>
            <Text
              color={index === selectedIndex ? 'blue' : undefined}
              bold={index === selectedIndex}
            >
              {index === selectedIndex ? '► ' : '  '}
              {model}
              {model === currentModel ? ' (current)' : ''}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};