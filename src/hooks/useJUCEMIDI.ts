import { useState, useEffect, useCallback } from 'react';
import { useJUCEBridge } from './useJUCEBridge';

interface MIDIEvent {
  type: 'noteOn' | 'noteOff' | 'controlChange';
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
  channel: number;
  timestamp: number;
}

export function useJUCEMIDI() {
  const { bridge, isAvailable, isReady } = useJUCEBridge();
  const [midiEvents, setMidiEvents] = useState<MIDIEvent[]>([]);
  const [midiInputs, setMidiInputs] = useState<string[]>([]);
  const [selectedInput, setSelectedInput] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !isAvailable) return;

    // Setup MIDI event listener
    const removeListener = bridge.on('midi', (message) => {
      const { type, data } = message;
      
      if (type === 'midiEvent') {
        setMidiEvents(prev => {
          // Keep last 100 events
          const newEvents = [...prev, {
            ...data,
            timestamp: Date.now()
          }];
          
          if (newEvents.length > 100) {
            return newEvents.slice(newEvents.length - 100);
          }
          return newEvents;
        });
      } else if (type === 'midiDeviceList') {
        setMidiInputs(data.inputs || []);
        
        // Restore selected input if still available
        if (selectedInput && !data.inputs.includes(selectedInput)) {
          setSelectedInput(null);
        }
      }
    });

    // Request MIDI devices list
    bridge.sendMessage({
      type: 'midi',
      action: 'getDevices',
      data: {}
    });

    return removeListener;
  }, [isReady, isAvailable, bridge, selectedInput]);

  const selectMIDIInput = useCallback((inputName: string | null) => {
    if (!isReady || !isAvailable) return;
    
    bridge.sendMessage({
      type: 'midi',
      action: 'selectInput',
      data: { inputName }
    });
    
    setSelectedInput(inputName);
  }, [isReady, isAvailable, bridge]);

  const sendMIDINote = useCallback((note: number, velocity: number, channel: number = 0) => {
    if (!isReady || !isAvailable) return;
    bridge.sendMIDINote(note, velocity, channel);
  }, [isReady, isAvailable, bridge]);

  const releaseMIDINote = useCallback((note: number, channel: number = 0) => {
    if (!isReady || !isAvailable) return;
    bridge.releaseMIDINote(note, channel);
  }, [isReady, isAvailable, bridge]);

  return {
    midiEvents,
    midiInputs,
    selectedInput,
    selectMIDIInput,
    sendMIDINote,
    releaseMIDINote,
    isAvailable: isReady && isAvailable
  };
}
