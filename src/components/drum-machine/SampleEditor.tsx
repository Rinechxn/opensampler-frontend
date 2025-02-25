import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sample } from './types';
import { JUCEVisualizer } from '../jucebackend/guicomponents/JUCEVisualizer';
import { useJUCEBridge } from '@/hooks/useJUCEBridge';

interface SampleEditorProps {
  sample: Sample;
  onUpdateSample: (updates: Partial<Sample>) => void;
  padId?: number;
}

type WaveSurferWithRegions = WaveSurfer & {
  addRegion: (params: any) => any;
};

export function SampleEditor({ sample, onUpdateSample, padId = 0 }: SampleEditorProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const activeRegion = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { isAvailable: isJUCEAvailable } = useJUCEBridge();

  useEffect(() => {
    // Only initialize WaveSurfer if JUCE is not available
    if (!waveformRef.current || isJUCEAvailable) return;

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#525252',
      progressColor: '#a1a1aa',
      cursorColor: '#ffffff',
      height: 80,
      normalize: true,
      interact: true,
      plugins: [
        RegionsPlugin.create()
      ]
    });

    wavesurfer.current.load(sample.url);

    wavesurfer.current.on('ready', () => {
      const duration = wavesurfer.current!.getDuration();
      
      // Create or update region
      if (activeRegion.current) {
        activeRegion.current.remove();
      }

      activeRegion.current = (wavesurfer.current as WaveSurferWithRegions).addRegion({
        start: sample.start || 0,
        end: sample.end || duration,
        color: 'rgba(255, 255, 255, 0.1)',
        drag: true,
        resize: true
      });

      // Handle region updates
      activeRegion.current.on('update', () => {
        onUpdateSample({
          start: activeRegion.current.start,
          end: activeRegion.current.end
        });
      });
    });

    wavesurfer.current.on('finish', () => setIsPlaying(false));

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [sample.url, isJUCEAvailable, onUpdateSample]);

  const togglePlayback = () => {
    if (isJUCEAvailable) {
      // Use JUCE for playback (handled by parent component through events)
      // Just toggle the playing state
      const event = new CustomEvent('juce-play-sample', {
        detail: {
          padId,
          play: !isPlaying
        }
      });
      window.dispatchEvent(event);
      setIsPlaying(!isPlaying);
      return;
    }
    
    if (!wavesurfer.current) return;
    
    if (isPlaying) {
      wavesurfer.current.pause();
    } else {
      wavesurfer.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Stop playback when unmounted
  useEffect(() => {
    return () => {
      if (isPlaying && isJUCEAvailable) {
        const event = new CustomEvent('juce-play-sample', {
          detail: {
            padId,
            play: false
          }
        });
        window.dispatchEvent(event);
      }
    };
  }, [isPlaying, isJUCEAvailable, padId]);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <Button
          size="sm"
          variant="ghost"
          onClick={togglePlayback}
          className="text-zinc-400 hover:text-zinc-100"
        >
          {isPlaying ? <Square size={14} /> : <Play size={14} />}
        </Button>
      </div>
      
      {isJUCEAvailable ? (
        // Use JUCE visualizer when available
        <JUCEVisualizer 
          padId={padId} 
          type="both" 
          className="w-full h-[80px]" 
        />
      ) : (
        // Fall back to WaveSurfer
        <div ref={waveformRef} className="w-full bg-zinc-800/50 rounded" />
      )}
    </div>
  );
}
