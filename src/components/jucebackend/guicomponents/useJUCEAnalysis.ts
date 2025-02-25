import { useEffect, useState, useRef } from 'react';
import { useJUCEBridge } from '@/hooks/useJUCEBridge';

interface AnalysisData {
  spectrum?: Float32Array;
  waveform?: Float32Array;
  timestamp: number;
}

export function useJUCEAnalysis(padId: number | null, analysisType: 'spectrum' | 'waveform' | 'both' = 'both') {
  const { bridge, isAvailable, isReady } = useJUCEBridge();
  const [analysisData, setAnalysisData] = useState<AnalysisData>({
    spectrum: new Float32Array(1024),
    waveform: new Float32Array(1024),
    timestamp: 0
  });
  const frameRef = useRef<number | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isReady || !isAvailable) return;

    // Setup event listener for analysis data from JUCE
    const removeListener = bridge.on('analysis', (message) => {
      const { data, analysisType } = message;
      
      // Only update if it's for the current pad
      if (padId === null || padId === message.padId) {
        setAnalysisData(prev => ({
          ...prev,
          [analysisType]: new Float32Array(data),
          timestamp: Date.now()
        }));
      }
    });

    // Request analysis data periodically
    if (padId !== null) {
      if (analysisType === 'spectrum' || analysisType === 'both') {
        bridge.requestAnalysis('spectrum', padId);
      }
      
      if (analysisType === 'waveform' || analysisType === 'both') {
        bridge.requestAnalysis('waveform', padId);
      }
      
      analysisIntervalRef.current = setInterval(() => {
        if (analysisType === 'spectrum' || analysisType === 'both') {
          bridge.requestAnalysis('spectrum', padId);
        }
        
        if (analysisType === 'waveform' || analysisType === 'both') {
          bridge.requestAnalysis('waveform', padId);
        }
      }, 50); // Request every 50ms
    }

    return () => {
      removeListener();
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [isReady, isAvailable, padId, analysisType, bridge]);

  return {
    analysisData,
    isAnalysisAvailable: isReady && isAvailable
  };
}
