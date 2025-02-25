import React, { useState, useEffect } from 'react';
import { useJUCEMIDI } from './useJUCEMIDI';

interface MIDIKeyboardProps {
  startNote?: number;
  numKeys?: number;
  className?: string;
  onNoteTriggered?: (note: number, velocity: number) => void;
  onNoteReleased?: (note: number) => void;
}

const MIDIKeyboard: React.FC<MIDIKeyboardProps> = ({
  startNote = 48, // C3
  numKeys = 24,
  className = '',
  onNoteTriggered,
  onNoteReleased
}) => {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const { isAvailable, sendMIDIMessage, midiEvents } = useJUCEMIDI();
  
  // Map keyboard keys to MIDI notes
  const keyboardMap: { [key: string]: number } = {
    'z': 0, 's': 1, 'x': 2, 'd': 3, 'c': 4, 
    'v': 5, 'g': 6, 'b': 7, 'h': 8, 'n': 9, 
    'j': 10, 'm': 11, ',': 12, 'l': 13, '.': 14, ';': 15, '/': 16
  };
  
  // Listen for keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (keyboardMap[e.key] !== undefined && !e.repeat) {
        const note = startNote + keyboardMap[e.key];
        triggerNote(note);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (keyboardMap[e.key] !== undefined) {
        const note = startNote + keyboardMap[e.key];
        releaseNote(note);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startNote, isAvailable]);
  
  // Listen for MIDI events
  useEffect(() => {
    if (midiEvents.length > 0) {
      const event = midiEvents[midiEvents.length - 1];
      
      if (event.type === 'noteOn' && event.note !== undefined) {
        setActiveNotes(prev => {
          const newSet = new Set(prev);
          newSet.add(event.note!);
          return newSet;
        });
        
        if (onNoteTriggered && event.velocity !== undefined) {
          onNoteTriggered(event.note, event.velocity);
        }
      }
      
      if (event.type === 'noteOff' && event.note !== undefined) {
        setActiveNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(event.note!);
          return newSet;
        });
        
        if (onNoteReleased) {
          onNoteReleased(event.note);
        }
      }
    }
  }, [midiEvents, onNoteTriggered, onNoteReleased]);
  
  const triggerNote = (note: number) => {
    if (!activeNotes.has(note)) {
      const velocity = 100;
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.add(note);
        return newSet;
      });
      
      if (isAvailable) {
        sendMIDIMessage('noteOn', { note, velocity, channel: 0 });
      }
      
      if (onNoteTriggered) {
        onNoteTriggered(note, velocity);
      }
    }
  };
  
  const releaseNote = (note: number) => {
    if (activeNotes.has(note)) {
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(note);
        return newSet;
      });
      
      if (isAvailable) {
        sendMIDIMessage('noteOff', { note, channel: 0 });
      }
      
      if (onNoteReleased) {
        onNoteReleased(note);
      }
    }
  };
  
  // Generate keys
  const keys = [];
  for (let i = 0; i < numKeys; i++) {
    const note = startNote + i;
    const isBlackKey = [1, 3, 6, 8, 10].includes(note % 12);
    
    keys.push(
      <div
        key={i}
        className={`
          ${isBlackKey ? 
            'bg-zinc-900 border-zinc-800 h-24 -mx-3 z-10 w-6' : 
            'bg-white border-zinc-300 h-36 w-10'}
          border
          ${activeNotes.has(note) ? 
            (isBlackKey ? 'bg-blue-800' : 'bg-blue-200') : ''}
          rounded-b-sm
          transition-colors
          cursor-pointer
        `}
        onMouseDown={() => triggerNote(note)}
        onMouseUp={() => releaseNote(note)}
        onMouseLeave={() => activeNotes.has(note) && releaseNote(note)}
        onTouchStart={(e) => {
          e.preventDefault();
          triggerNote(note);
        }}
        onTouchEnd={() => releaseNote(note)}
      />
    );
  }
  
  return (
    <div className={`${className}`}>
      <div className="flex items-end justify-center space-x-1 relative">
        {keys}
      </div>
      <div className="mt-2 text-xs text-center text-zinc-500">
        {isAvailable ? 'JUCE MIDI Available' : 'Fallback to Web MIDI'} 
        {!isAvailable && 
          <span className="ml-1">
            (Use keyboard keys Z-M to play)
          </span>
        }
      </div>
    </div>
  );
};

export default MIDIKeyboard;
