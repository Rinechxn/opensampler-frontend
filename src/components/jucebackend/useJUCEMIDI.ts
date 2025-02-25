import { useJUCEMIDI as useJUCEMIDIBase } from '@/lib/useJUCEMIDI';

// Re-export the hook for consistency with other jucebackend hooks
export const useJUCEMIDI = useJUCEMIDIBase;

// Export the types
export interface MIDIEvent { 
  type: 'noteOn' | 'noteOff' | 'controlChange'; 
  timestamp: number; 
  note?: number; 
  velocity?: number; 
  controller?: number; 
  value?: number; 
  channel: number; 
}
