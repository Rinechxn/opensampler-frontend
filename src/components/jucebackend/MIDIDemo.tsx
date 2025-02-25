import React, { useState } from 'react';
import JUCEMIDIMonitor from './JUCEMIDIMonitor';
import MIDIKeyboard from './MIDIKeyboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useJUCEMIDI } from './useJUCEMIDI';

const MIDIDemo: React.FC = () => {
  const { isAvailable, sendMIDIMessage } = useJUCEMIDI();
  const [modulationValue, setModulationValue] = useState(0);
  const [pitchBendValue, setPitchBendValue] = useState(0.5);
  
  const handleModulationChange = (value: number[]) => {
    const newValue = value[0];
    setModulationValue(newValue);
    if (isAvailable) {
      sendMIDIMessage('controlChange', { 
        controller: 1, // CC#1 is Modulation
        value: Math.round(newValue * 127),
        channel: 0
      });
    }
  };
  
  const handlePitchBendChange = (value: number[]) => {
    const newValue = value[0];
    setPitchBendValue(newValue);
    if (isAvailable) {
      sendMIDIMessage('controlChange', { 
        controller: 128, // Special value for pitch bend
        value: Math.round(newValue * 127),
        channel: 0
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>MIDI Input Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <JUCEMIDIMonitor maxEvents={10} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>MIDI Keyboard</CardTitle>
        </CardHeader>
        <CardContent>
          <MIDIKeyboard 
            startNote={48} // C3
            numKeys={24}
          />
          
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Modulation</Label>
                <span className="text-sm text-zinc-500">
                  {Math.round(modulationValue * 127)}
                </span>
              </div>
              <Slider 
                value={[modulationValue]} 
                min={0} 
                max={1} 
                step={0.01} 
                onValueChange={handleModulationChange} 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Pitch Bend</Label>
                <span className="text-sm text-zinc-500">
                  {Math.round((pitchBendValue - 0.5) * 200)}%
                </span>
              </div>
              <Slider 
                value={[pitchBendValue]} 
                min={0} 
                max={1} 
                step={0.01} 
                onValueChange={handlePitchBendChange} 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MIDIDemo;
