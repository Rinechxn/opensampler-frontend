import { useRef } from 'react';
import { Sample } from '../../drum-machine/types';
import { useJUCEBridge } from '@/hooks/useJUCEBridge';

export function useJUCEAudio() {
  const { bridge, isAvailable, isReady } = useJUCEBridge();
  const loadedSamples = useRef(new Set<number>());

  // Load a sample into JUCE
  const loadSample = async (padId: number, url: string, sample: Sample) => {
    if (!isReady || !isAvailable) return false;
    
    try {
      // Fetch the audio data
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      
      // Send to JUCE
      bridge.loadSample(padId, arrayBuffer, {
        name: sample.name,
        midiNote: sample.midiNote,
        chokeGroup: sample.chokeGroup,
        volume: sample.volume,
        attack: sample.attack,
        release: sample.release,
        start: sample.start,
        end: sample.end,
        compress: sample.compress,
        reverb: sample.reverb
      });
      
      loadedSamples.current.add(padId);
      return true;
    } catch (error) {
      console.error('Error loading sample into JUCE:', error);
      return false;
    }
  };

  // Play a sample using JUCE
  const playSample = (padId: number) => {
    if (!isReady || !isAvailable || !loadedSamples.current.has(padId)) return false;
    
    bridge.playSample(padId);
    return true;
  };

  // Stop a sample using JUCE
  const stopSample = (padId: number) => {
    if (!isReady || !isAvailable) return false;
    
    bridge.stopSample(padId);
    return true;
  };

  // Update sample parameters in JUCE
  const updateParameter = (padId: number, parameter: keyof Sample, value: any) => {
    if (!isReady || !isAvailable || !loadedSamples.current.has(padId)) return false;

    // Handle effects separately
    if (parameter === 'compress') {
      Object.entries(value).forEach(([param, val]) => {
        if (param === 'enabled') {
          bridge.setEffectParameter(padId, 'compressor', 'bypass', 0, val as boolean);
        } else {
          bridge.setEffectParameter(padId, 'compressor', param, val as number);
        }
      });
      return true;
    }
    
    if (parameter === 'reverb') {
      Object.entries(value).forEach(([param, val]) => {
        if (param === 'enabled') {
          bridge.setEffectParameter(padId, 'reverb', 'bypass', 0, val as boolean);
        } else {
          bridge.setEffectParameter(padId, 'reverb', param, val as number);
        }
      });
      return true;
    }

    // Handle regular parameters
    bridge.setSampleParameter(padId, parameter as string, value as number);
    return true;
  };

  // Clear a pad
  const clearPad = (padId: number) => {
    if (!isReady || !isAvailable) return false;
    
    // Send unload message to JUCE
    bridge.sendMessage({
      type: 'audio',
      action: 'unload',
      padId,
      data: {}
    });
    
    loadedSamples.current.delete(padId);
    return true;
  };

  return {
    isJUCEAvailable: isAvailable && isReady,
    loadSample,
    playSample,
    stopSample,
    updateParameter,
    clearPad
  };
}
