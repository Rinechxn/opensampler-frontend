import  { useRef, useEffect } from 'react';
import { useJUCEAnalysis } from './useJUCEAnalysis';

interface JUCEVisualizerProps {
  padId: number | null;
  type?: 'spectrum' | 'waveform' | 'both';
  className?: string;
}

export function JUCEVisualizer({ padId, type = 'waveform', className = '' }: JUCEVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { analysisData, isAnalysisAvailable } = useJUCEAnalysis(padId, type);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isAnalysisAvailable) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const drawWaveform = (data: Float32Array) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      
      // Set up styling
      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = 2;
      
      // Start drawing
      ctx.beginPath();
      
      const sliceWidth = width / data.length;
      let x = 0;
      
      for (let i = 0; i < data.length; i++) {
        const y = (height / 2) * (1 - data[i]);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.stroke();
    };
    
    const drawSpectrum = (data: Float32Array) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      
      // Set up styling
      ctx.fillStyle = '#a1a1aa';
      
      const barWidth = width / data.length;
      let x = 0;
      
      for (let i = 0; i < data.length; i++) {
        // Convert dB value to a height - typically spectrum is in dB from -100 to 0
        const dbValue = data[i];
        const normalized = Math.max(0, (dbValue + 100) / 100); // Map -100..0 to 0..1
        const barHeight = normalized * height;
        
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };
    
    if (type === 'waveform' && analysisData.waveform) {
      drawWaveform(analysisData.waveform);
    } else if (type === 'spectrum' && analysisData.spectrum) {
      drawSpectrum(analysisData.spectrum);
    } else if (type === 'both') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw spectrum in background
      if (analysisData.spectrum) {
        // Make spectrum more subtle
        ctx.globalAlpha = 0.3;
        drawSpectrum(analysisData.spectrum);
        ctx.globalAlpha = 1.0;
      }
      
      // Draw waveform on top
      if (analysisData.waveform) {
        drawWaveform(analysisData.waveform);
      }
    }
  }, [analysisData, type, isAnalysisAvailable]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={150} 
      className={`bg-zinc-800/50 rounded-md ${className}`}
    />
  );
}
