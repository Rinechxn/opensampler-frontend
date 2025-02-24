import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import PadControls from './PadControls';
import { DrumPad, Sample } from './types';
import { useOSMP } from '@/hooks/useOSMP';
import { FileDialog } from '@/components/ui/file-dialog';
import * as Tone from 'tone';

const STORAGE_KEY = 'drum-machine-preset';
// const DEBOUNCE_TIME = 100; // ms

const DrumSampler = () => {
  const [pads, setPads] = useState<DrumPad[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).pads : Array.from({ length: 16 }, (_, i) => ({
      id: i,
      sample: null
    }));
  });

  const [selectedPad, setSelectedPad] = useState<number | null>(null);
  const [playingPad, setPlayingPad] = useState<number | null>(null);
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement }>({});
  // const lastPlayedTime = useRef<{ [key: number]: number }>({});
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<Blob | null>(null);
  const players = useRef<{ [key: number]: Tone.Player }>({});
  const envelopes = useRef<{ [key: number]: Tone.AmplitudeEnvelope }>({});
  const effects = useRef<{ [key: number]: { compressor: Tone.Compressor, reverb: Tone.Reverb } }>({});

  useEffect(() => {
    const handleFileOperation = async (event: CustomEvent) => {
      const { type } = event.detail;
      if (type === 'saveOSMP') {
        const osmpBlob = await prepareOSMPFile();
        setPendingSave(osmpBlob);
        setIsSaveDialogOpen(true);
      } else if (type === 'loadOSMP') {
        // Create and trigger hidden file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.osmp';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) handleLoadOSMP(file);
        };
        input.click();
      }
    };

    window.addEventListener('osmp-operation' as any, handleFileOperation);
    return () => window.removeEventListener('osmp-operation' as any, handleFileOperation);
  }, [pads]);

  useEffect(() => {
    // Initialize Tone.js
    Tone.start();
    
    return () => {
      // Cleanup players on unmount
      Object.values(players.current).forEach(player => player.dispose());
      Object.values(envelopes.current).forEach(env => env.dispose());
      Object.values(effects.current).forEach(effect => {
        effect.compressor.dispose();
        effect.reverb.dispose();
      });
    };
  }, []);

  // Save to localStorage whenever pads change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pads }));
  }, [pads]);

  const { createOSMP, loadOSMP } = useOSMP();

  const prepareOSMPFile = async () => {
    const sampleFiles: { [key: string]: Blob } = {};
    const sampleUrls: { [key: string]: string } = {};
    
    for (const pad of pads) {
      if (pad.sample?.url) {
        const response = await fetch(pad.sample.url);
        const blob = await response.blob();
        const filename = `sample_${pad.id}.wav`;
        sampleFiles[filename] = blob;
        sampleUrls[pad.id] = filename;
      }
    }

    const data = {
      pads: pads.map(pad => ({
        ...pad,
        sample: pad.sample ? {
          ...pad.sample,
          url: pad.sample.url ? sampleUrls[pad.id] : null
        } : null
      }))
    };

    return await createOSMP('drum-preset', data, sampleFiles);
  };

  const handleSaveConfirm = (fileName: string) => {
    if (!pendingSave) return;
    
    const url = URL.createObjectURL(pendingSave);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.osmp`;
    a.click();
    URL.revokeObjectURL(url);
    setPendingSave(null);
  };

  const handleLoadOSMP = async (file: File) => {
    try {
      const { data, samples } = await loadOSMP(file);
      if (data.type !== 'drum-machine') throw new Error('Invalid preset type');

      // Update pads with new sample URLs
      const newPads = data.data.pads.map((pad: DrumPad) => ({
        ...pad,
        sample: pad.sample ? {
          ...pad.sample,
          url: pad.sample.url ? samples[pad.sample.url] : null
        } : null
      }));

      setPads(newPads);

      // Recreate audio elements
      newPads.forEach((pad: { sample: { url: string | undefined; }; id: number; }) => {
        if (pad.sample?.url) {
          audioRefs.current[pad.id] = new Audio(pad.sample.url);
        }
      });
    } catch (error) {
      console.error('Error loading OSMP file:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const setupTonePlayer = (padId: number, url: string, sample: Sample) => {
    // Dispose existing player if any
    players.current[padId]?.dispose();
    envelopes.current[padId]?.dispose();
    effects.current[padId]?.compressor.dispose();
    effects.current[padId]?.reverb.dispose();

    // Create new envelope
    const envelope = new Tone.AmplitudeEnvelope({
      attack: sample.attack,
      decay: 0.1,
      sustain: 1,
      release: sample.release,
    });

    // Create effects
    const compressor = new Tone.Compressor({
      threshold: sample.compress.threshold,
      ratio: sample.compress.ratio,
      attack: sample.compress.attack,
      release: sample.compress.release
    });

    const reverb = new Tone.Reverb({
      wet: sample.reverb.wet,
      decay: sample.reverb.decay,
      preDelay: sample.reverb.preDelay
    });

    // Connect effects chain conditionally
    let chain: Tone.Signal | Tone.AmplitudeEnvelope = envelope;
    if (sample.compress.enabled !== false) {
      chain = chain.connect(compressor);
    }
    if (sample.reverb.enabled !== false) {
      chain = chain.connect(reverb);
    }
    chain.toDestination();

    // Create new player
    const player = new Tone.Player({
      url,
      onload: () => {
        player.connect(envelope);
        if (sample.start || sample.end) {
          player.setLoopPoints(sample.start || 0, sample.end || player.buffer.duration);
        }
      },
    });

    players.current[padId] = player;
    envelopes.current[padId] = envelope;
    effects.current[padId] = { compressor, reverb };
  };

  const handleDrop = (padId: number, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'audio/wav') {
      const url = URL.createObjectURL(file);
      
      const newSample = {
        url,
        name: file.name,
        midiNote: 36 + padId,
        chokeGroup: 0,
        volume: 1,
        attack: 0,
        release: 0.1,
        start: 0,
        end: 0,
        compress: {
          threshold: -20,
          ratio: 4,
          attack: 0.003,
          release: 0.25
        },
        reverb: {
          wet: 0.3,
          decay: 1.5,
          preDelay: 0.01
        }
      };

      setupTonePlayer(padId, url, newSample);
      
      setPads(prev => prev.map(pad => 
        pad.id === padId ? {
          ...pad,
          sample: newSample
        } : pad
      ));
    }
  };

  // Add smooth parameter interpolation
  const updateDSPParameters = useCallback((padId: number, property: keyof Sample, value: any, immediate = false) => {
    const envelope = envelopes.current[padId];
    const padEffects = effects.current[padId];
    
    if (!envelope || !padEffects) return;

    const rampTime = immediate ? 0 : 0.05; // 50ms ramp time for smooth changes

    if (property === 'compress') {
      Object.entries(value).forEach(([param, val]) => {
        if (param === 'attack' || param === 'release' || param === 'ratio' || param === 'threshold') {
          (padEffects.compressor as any)[param].rampTo(val as number, rampTime);
        }
      });
      return;
    }

    if (property === 'reverb') {
      Object.entries(value).forEach(([param, val]) => {
        if (param === 'wet' || param === 'decay') {
          const parameter = padEffects.reverb[param];
          if (parameter instanceof Tone.Signal) {
            parameter.rampTo(val as number, rampTime);
          }
        }
      });
      return;
    }

    switch (property) {
      case 'attack':
        envelope.attack = value;
        break;
      case 'release':
        envelope.release = value;
        break;
      case 'volume':
        envelope.output.gain.rampTo(Tone.gainToDb(value), rampTime);
        break;
      case 'start':
      case 'end':
        const player = players.current[padId];
        if (player?.loaded) {
          player.setLoopPoints(value, player.buffer.duration);
        }
        break;
    }
  }, []);

  const updatePadProperty = (
    padId: number,
    property: keyof Sample,
    value: any
  ) => {
    setPads(prev => prev.map(pad => 
      pad.id === padId && pad.sample ? {
        ...pad,
        sample: {
          ...pad.sample,
          [property]: value
        }
      } : pad
    ));

    // Apply DSP changes immediately
    updateDSPParameters(padId, property, value);
  };

  const removeSample = (padId: number) => {
    setPads(prev => prev.map(pad => 
      pad.id === padId ? {
        ...pad,
        sample: null
      } : pad
    ));
  };

  const playSound = (padId: number) => {
    const now = Tone.now();
    const pad = pads[padId];
    if (!pad.sample) return;

    // Handle choke groups
    if (pad.sample.chokeGroup > 0) {
      pads.forEach((otherPad, index) => {
        if (otherPad.sample?.chokeGroup === pad.sample?.chokeGroup && index !== padId) {
          envelopes.current[index]?.triggerRelease(now);
        }
      });
    }

    const player = players.current[padId];
    const envelope = envelopes.current[padId];
    
    if (player && envelope) {
      try {
        // Prevent double triggers
        if (player.state === 'started') {
          player.stop();
          envelope.triggerRelease(now);
        }

        // Small delay to ensure clean restart
        setTimeout(() => {
          player.start(now + 0.01);
          envelope.triggerAttack(now + 0.01);
          envelope.triggerRelease(now + 0.11); // Slightly longer release for preview
        }, 10);
        
        setPlayingPad(padId);
        setTimeout(() => setPlayingPad(null), 200);
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }
  };

  return (
    <>
      <div className="w-full h-full  bg-zinc-900 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-zinc-400 text-sm font-medium">Drum Machine</h2>
        </div>
        <div className="flex-1 p-2">
          <div className="grid grid-cols-4 gap-2">
            {pads.map(pad => (
              <div 
                key={pad.id} 
                className={`
                  relative bg-gradient-to-b from-zinc-800 to-zinc-900
                  rounded-md overflow-hidden shadow-lg cursor-pointer
                  ${selectedPad === pad.id ? 'ring-1 ring-white/20' : ''}
                  ${playingPad === pad.id ? 'animate-quick-pulse' : ''}
                  transition-all duration-150
                `}
                onClick={() => {
                  setSelectedPad(pad.id);
                  if (pad.sample) playSound(pad.id);
                }}
              >
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] font-medium tracking-wider uppercase text-zinc-400">
                    Pad {pad.id + 1}
                  </span>
                  {pad.sample && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSample(pad.id);
                      }}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div
                  className={`
                    h-20 flex items-center justify-center
                    border-t border-zinc-800/50
                    ${pad.sample 
                      ? 'bg-gradient-to-b from-zinc-800/50 to-zinc-900/50' 
                      : 'bg-gradient-to-b from-zinc-800/30 to-zinc-900/30'}
                    ${selectedPad === pad.id 
                      ? 'bg-white/[0.02]' 
                      : 'hover:bg-white/[0.02]'}
                    ${playingPad === pad.id 
                      ? 'border-l-2 border-l-white/30 transition-all duration-75' 
                      : ''}
                    transition-colors duration-150
                  `}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(pad.id, e)}
                >
                  {pad.sample ? (
                    <div className="px-3 py-2 w-full">
                      <div className="text-[11px] font-medium text-zinc-300 truncate">
                        {pad.sample.name}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">
                        Note: {pad.sample.midiNote}
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-500 text-[11px] font-medium">
                      Drop Sample
                    </div>
                  )}
                </div>

                {/* Playing indicator */}
                {playingPad === pad.id && (
                  <div className="absolute inset-0 border-2 border-white/20 rounded-md animate-border-pulse" />
                )}

                {/* Selected indicator */}
                {selectedPad === pad.id && (
                  <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/20" />
                )}
              </div>
            ))}
          </div>
        </div>

        <PadControls
          selectedPad={selectedPad}
          sample={selectedPad !== null ? pads[selectedPad].sample : null}
          onUpdateProperty={(property, value) => {
            if (selectedPad !== null) {
              updatePadProperty(selectedPad, property, value);
            }
          }}
        />
      </div>
      <FileDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        onSave={handleSaveConfirm}
        title="Save Drum Machine Preset"
        defaultName="drum-preset"
      />
    </>
  );
};

export default DrumSampler;