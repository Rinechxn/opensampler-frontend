import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sample } from './types';

interface SampleEditorProps {
  sample: Sample;
  onUpdateSample: (updates: Partial<Sample>) => void;
}

type WaveSurferWithRegions = WaveSurfer & {
  addRegion: (params: any) => any;
};

export function SampleEditor({ sample, onUpdateSample }: SampleEditorProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const activeRegion = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!waveformRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#525252',
      progressColor: '#a1a1aa',
      cursorColor: '#ffffff',
      height: 80,
      normalize: true,
    //   splitChannels: false,
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
  }, [sample.url]);

  const togglePlayback = () => {
    if (!wavesurfer.current) return;
    
    if (isPlaying) {
      wavesurfer.current.pause();
    } else {
      wavesurfer.current.play();
    }
    setIsPlaying(!isPlaying);
  };

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
      <div ref={waveformRef} className="w-full bg-zinc-800/50 rounded" />
    </div>
  );
}
