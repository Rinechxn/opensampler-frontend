import { Music, Square } from 'lucide-react';
import { Sample } from './types';
import KnobDrawer from '../sphui/knob';
import { SampleEditor } from './SampleEditor';
import { EffectsControls } from './EffectsControls';
import { useCallback } from 'react';
import debounce from 'lodash.debounce';

interface PadControlsProps {
  selectedPad: number | null;
  sample: Sample | null;
  onUpdateProperty: (property: keyof Sample, value: any) => void;
}

const PadControls = ({ selectedPad, sample, onUpdateProperty }: PadControlsProps) => {
  // Debounce parameter updates to avoid overwhelming the audio engine
  const debouncedUpdate = useCallback(
    debounce((property: keyof Sample, value: any) => {
      onUpdateProperty(property, value);
    }, 50),
    [onUpdateProperty]
  );

  if (!sample || selectedPad === null) {
    return (
      <div className="h-48 bg-zinc-800/50 border-t border-zinc-700 p-4 text-center text-zinc-500">
        Select a pad to edit its parameters
      </div>
    );
  }

  const getMIDINoteName = (noteNumber: number): string => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteName = notes[noteNumber % 12];
    return `${noteName}${octave}`;
  };

  return (
    <div className="bg-zinc-900 border-t border-zinc-800 p-4">
      <div className="text-[11px] uppercase tracking-wider text-zinc-400 mb-4 font-medium">
        Pad {selectedPad! + 1}: {sample!.name}
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Left Column - Controls */}
          <div className="grid grid-cols-3 gap-6">
            {/* Existing control groups */}
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Trigger</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Music size={12} className="text-zinc-500" />
                  <select
                    value={sample.midiNote}
                    onChange={(e) => onUpdateProperty('midiNote', parseInt(e.target.value))}
                    className="bg-zinc-800 border border-zinc-700 rounded-sm px-2 py-1 text-[11px] w-full focus:outline-none focus:border-white text-zinc-300"
                  >
                    {Array.from({ length: 127 }, (_, i) => (
                      <option key={i} value={i}>{getMIDINoteName(i)} ({i})</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Square size={12} className="text-zinc-500" />
                  <select
                    value={sample.chokeGroup}
                    onChange={(e) => onUpdateProperty('chokeGroup', parseInt(e.target.value))}
                    className="bg-zinc-800 border border-zinc-700 rounded-sm px-2 py-1 text-[11px] w-full focus:outline-none focus:border-white text-zinc-300"
                  >
                    <option value={0}>No Choke</option>
                    {Array.from({ length: 8 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Group {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">ADSR</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <KnobDrawer
                    id="attack-knob"
                    size={40}
                    min={0}
                    max={2}
                    value={sample.attack || 0}
                    unit="s"
                    colors={['transparent', '#262626', '#404040', '#FFFFFF']}
                    onChange={(value) => debouncedUpdate('attack', value)}
                  />
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-2">A</div>
                </div>
                <div className="text-center">
                  <KnobDrawer
                    id="release-knob"
                    size={40}
                    min={0}
                    max={5}
                    value={sample.release || 0}
                    unit="s"
                    colors={['transparent', '#262626', '#404040', '#FFFFFF']}
                    onChange={(value) => debouncedUpdate('release', value)}
                  />
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-2">R</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Output</h3>
              <div className="flex justify-center">
                <div className="text-center">
                  <KnobDrawer
                    id="volume-knob"
                    size={48}
                    min={0}
                    max={1}
                    value={sample.volume}
                    unit="percent"
                    colors={['transparent', '#262626', '#404040', '#FFFFFF']}
                    onChange={(value) => debouncedUpdate('volume', value)}
                  />
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-2">Vol</div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Effects Controls */}
          <EffectsControls 
            sample={sample}
            onUpdateProperty={debouncedUpdate}
          />
        </div>

        {/* Right Column - Sample Editor */}
        <div className="space-y-4">
          <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Sample Editor</h3>
          <SampleEditor
            sample={sample!}
            onUpdateSample={(updates) => {
              Object.entries(updates).forEach(([key, value]) => {
                onUpdateProperty(key as keyof Sample, value);
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PadControls;
