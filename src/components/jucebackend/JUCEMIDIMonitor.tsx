import React, { useEffect, useRef } from 'react';
import { useJUCEMIDI } from './useJUCEMIDI';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MIDIMonitorProps {
  maxEvents?: number;
  showControls?: boolean;
  onMIDIEvent?: (event: any) => void;
  className?: string;
}

const JUCEMIDIMonitor: React.FC<MIDIMonitorProps> = ({ 
  maxEvents = 10, 
  showControls = true, 
  onMIDIEvent,
  className = ""
}) => {
  const { 
    midiEvents, 
    midiInputs, 
    selectedInput, 
    selectMIDIInput, 
    isAvailable,
    clearMIDIEvents 
  } = useJUCEMIDI();
  
  const eventsContainerRef = useRef<HTMLDivElement>(null);
  
  // Pass MIDI events to parent component if needed
  useEffect(() => {
    if (onMIDIEvent && midiEvents.length > 0) {
      onMIDIEvent(midiEvents[midiEvents.length - 1]);
    }
  }, [midiEvents, onMIDIEvent]);
  
  // Auto-scroll to bottom of events list
  useEffect(() => {
    if (eventsContainerRef.current) {
      eventsContainerRef.current.scrollTop = eventsContainerRef.current.scrollHeight;
    }
  }, [midiEvents]);
  
  if (!isAvailable) {
    return (
      <div className={`bg-zinc-900 border border-zinc-800 rounded-md p-4 ${className}`}>
        <div className="text-zinc-400 text-sm">JUCE MIDI is not available</div>
      </div>
    );
  }
  
  const getEventColor = (type: string) => {
    switch (type) {
      case 'noteOn': return 'text-green-400';
      case 'noteOff': return 'text-red-400';
      case 'controlChange': return 'text-blue-400';
      default: return 'text-zinc-400';
    }
  };
  
  const formatMIDIValue = (event: any) => {
    if (event.type === 'noteOn' || event.type === 'noteOff') {
      // Calculate note name
      const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      const octave = Math.floor(event.note / 12) - 1;
      const noteIndex = event.note % 12;
      const noteName = `${noteNames[noteIndex]}${octave}`;
      
      return `${noteName} (${event.note}) ${event.type === 'noteOn' ? `vel:${event.velocity}` : ''}`;
    } else if (event.type === 'controlChange') {
      return `CC${event.controller}: ${event.value}`;
    }
    return JSON.stringify(event);
  };
  
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-md flex flex-col ${className}`}>
      {showControls && (
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select
              value={selectedInput || ""}
              onValueChange={(value) => selectMIDIInput(value || null)}
            >
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Select MIDI input" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {midiInputs.map((input) => (
                  <SelectItem key={input} value={input}>
                    {input}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearMIDIEvents}
            className="h-7 text-xs"
          >
            Clear
          </Button>
        </div>
      )}
      
      <div 
        ref={eventsContainerRef}
        className="flex-1 overflow-y-auto p-2 text-xs font-mono"
        style={{ maxHeight: showControls ? '300px' : '100%' }}
      >
        {midiEvents.slice(-maxEvents).map((event, index) => (
          <div key={index} className="py-1 border-b border-zinc-800/50 last:border-0">
            <span className="text-zinc-500">
              {new Date(event.timestamp).toISOString().substr(11, 8)}
            </span>
            <span className="mx-2 text-zinc-400">
              Ch:{event.channel + 1}
            </span>
            <span className={getEventColor(event.type)}>
              {event.type}
            </span>
            <span className="ml-2 text-zinc-300">
              {formatMIDIValue(event)}
            </span>
          </div>
        ))}
        
        {midiEvents.length === 0 && (
          <div className="text-zinc-500 p-2 text-center">
            No MIDI events received
          </div>
        )}
      </div>
    </div>
  );
};

export default JUCEMIDIMonitor;
