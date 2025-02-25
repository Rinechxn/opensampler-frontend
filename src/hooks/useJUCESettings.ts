import { useState, useEffect, useCallback } from 'react';
import { JUCEBridge, JUCEAudioEngineSettings } from '@/lib/juce-bridge';
import { useJUCEBridge } from './useJUCEBridge';

const STORAGE_KEY = 'juce-audio-settings';

export function useJUCESettings() {
  const { isAvailable } = useJUCEBridge();
  const bridge = JUCEBridge.getInstance();

  const [settings, setSettings] = useState<JUCEAudioEngineSettings>(() => {
    // Try to get from localStorage first
    const savedSettings = typeof window !== 'undefined' ? 
      localStorage.getItem(STORAGE_KEY) : null;
    
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        // If parsing fails, use default settings
        return bridge.getEngineSettings();
      }
    }
    return bridge.getEngineSettings();
  });

  useEffect(() => {
    if (isAvailable) {
      // Apply settings when JUCE becomes available
      bridge.updateEngineSettings(settings);
    }
  }, [isAvailable]);

  useEffect(() => {
    // Save settings to localStorage when they change
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings]);

  const updateSetting = useCallback((key: keyof JUCEAudioEngineSettings, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      bridge.updateEngineSettings({ [key]: value });
      return newSettings;
    });
  }, [bridge]);

  const resetSettings = useCallback(() => {
    const defaultSettings = {
      bufferSize: 512,
      sampleRate: 48000,
      useLowLatency: true,
      enableMultithreading: true,
      realtimePriority: true,
      dithering: true
    };
    
    setSettings(defaultSettings);
    bridge.updateEngineSettings(defaultSettings);
  }, [bridge]);

  return {
    settings,
    updateSetting,
    resetSettings
  };
}
