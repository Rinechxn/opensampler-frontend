import { useState, useEffect } from 'react';
import { JUCEBridge } from './juce-bridge';

interface MIDIEvent { 
  type: 'noteOn' | 'noteOff' | 'controlChange'; 
  timestamp: number; 
  note?: number; 
  velocity?: number; 
  controller?: number; 
  value?: number; 
  channel: number; 
}

export function useJUCEMIDI() { 
  const [midiEvents, setMidiEvents] = useState<MIDIEvent[]>([]);
  const [midiInputs, setMidiInputs] = useState<string[]>([]);
  const [selectedInput, setSelectedInput] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const bridge = JUCEBridge.getInstance();
    
    // Initialize the bridge
    bridge.initialize().then((success) => {
      setIsAvailable(success);
      
      if (success) {
        // Request list of MIDI devices
        bridge.sendMessage({
          type: 'midi',
          action: 'getInputs',
          data: {}
        });
        
        // Listen for MIDI device list
        const deviceUnsubscribe = bridge.on('midiDeviceList', (message) => {
          setMidiInputs(message.data.inputs || []);
        });
        
        // Listen for MIDI events
        const midiUnsubscribe = bridge.on('midi', (message) => {
          const midiEvent: MIDIEvent = {
            type: message.data.type,
            timestamp: Date.now(),
            channel: message.data.channel || 0,
            ...message.data
          };
          
          setMidiEvents(prev => [...prev.slice(-99), midiEvent]);
        });
        
        return () => {
          deviceUnsubscribe();
          midiUnsubscribe();
        };
      }
    });
  }, []);
  
  // Update selected MIDI input when changed
  useEffect(() => {
    if (!isAvailable || selectedInput === null) return;
    
    const bridge = JUCEBridge.getInstance();
    bridge.sendMessage({
      type: 'midi',
      action: 'selectInput',
      data: {
        deviceName: selectedInput
      }
    });
  }, [selectedInput, isAvailable]);

  const selectMIDIInput = (input: string | null) => {
    setSelectedInput(input);
  };
  
  const clearMIDIEvents = () => {
    setMidiEvents([]);
  };
  
  const sendMIDIMessage = (type: 'noteOn' | 'noteOff' | 'controlChange', data: {
    note?: number;
    velocity?: number;
    controller?: number;
    value?: number;
    channel: number;
  }) => {
    if (!isAvailable) return;
    
    const bridge = JUCEBridge.getInstance();
    bridge.sendMessage({
      type: 'midi',
      action: type,
      data
    });
  };

  return { 
    midiEvents, 
    midiInputs, 
    selectedInput, 
    selectMIDIInput, 
    isAvailable,
    clearMIDIEvents,
    sendMIDIMessage
  }; 
}