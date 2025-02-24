import { Sample } from './types';
import KnobDrawer from '../sphui/knob';

interface EffectsControlsProps {
  sample: Sample;
  onUpdateProperty: (property: keyof Sample, value: any) => void;
}

export function EffectsControls({ sample, onUpdateProperty }: EffectsControlsProps) {
  const updateCompressor = (param: keyof Sample['compress'], value: number) => {
    onUpdateProperty('compress', { ...sample.compress, [param]: value });
  };

  const updateReverb = (param: keyof Sample['reverb'], value: number) => {
    onUpdateProperty('reverb', { ...sample.reverb, [param]: value });
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={sample.compress.enabled ?? true}
            onChange={(e) =>
              onUpdateProperty('compress', {
                ...sample.compress,
                enabled: e.target.checked,
              })
            }
          />
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
            Compressor
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <KnobDrawer
              id="comp-threshold"
              size={40}
              min={-60}
              max={0}
              value={sample.compress.threshold}
              unit="dB"
              colors={['transparent', '#262626', '#404040', '#FFFFFF']}
              onChange={(value) => updateCompressor('threshold', value)}
              smoothing={true}
              rampTime={0.05}
            />
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-2">Thresh</div>
          </div>
          <div className="text-center">
            <KnobDrawer
              id="comp-ratio"
              size={40}
              min={1}
              max={20}
              value={sample.compress.ratio}
              unit="dB"
              colors={['transparent', '#262626', '#404040', '#FFFFFF']}
              onChange={(value) => updateCompressor('ratio', value)}
              smoothing={true}
              rampTime={0.05}
            />
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-2">Ratio</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={sample.reverb.enabled ?? true}
            onChange={(e) =>
              onUpdateProperty('reverb', {
                ...sample.reverb,
                enabled: e.target.checked,
              })
            }
          />
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
            Reverb
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <KnobDrawer
              id="reverb-wet"
              size={40}
              min={0}
              max={1}
              value={sample.reverb.wet}
              unit="percent"
              colors={['transparent', '#262626', '#404040', '#FFFFFF']}
              onChange={(value) => updateReverb('wet', value)}
              smoothing={true}
              rampTime={0.05}
            />
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-2">Mix</div>
          </div>
          <div className="text-center">
            <KnobDrawer
              id="reverb-decay"
              size={40}
              min={0.1}
              max={10}
              value={sample.reverb.decay}
              unit="s"
              colors={['transparent', '#262626', '#404040', '#FFFFFF']}
              onChange={(value) => updateReverb('decay', value)}
              smoothing={true}
              rampTime={0.05}
            />
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-2">Decay</div>
          </div>
        </div>
      </div>
    </div>
  );
}
