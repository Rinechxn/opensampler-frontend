import  { useState } from 'react';
import { useJUCEMIDI } from '@/hooks/useJUCEMIDI';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music2 } from 'lucide-react';

export function MIDIMonitor() {
  const [open, setOpen] = useState(false);
  const { 
    midiEvents, 
    midiInputs, 
    selectedInput, 
    selectMIDIInput, 
    isAvailable 
  } = useJUCEMIDI();
  
  if (!isAvailable) return null;

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}.${String(date.getMilliseconds()).padStart(3, '0')}`;
  };

  const getMIDINoteName = (noteNumber: number): string => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteName = notes[noteNumber % 12];
    return `${noteName}${octave}`;
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-zinc-400 hover:text-zinc-100"
        >
          <Music2 className="h-4 w-4 mr-2" />
          MIDI Monitor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>MIDI Monitor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">MIDI Input</label>
              <Select 
                value={selectedInput || ''} 
                onValueChange={(value) => selectMIDIInput(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select MIDI Input" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {midiInputs.map(input => (
                    <SelectItem key={input} value={input}>{input}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
          
          <div className="border border-zinc-800 rounded-md p-2 h-80 overflow-y-auto bg-zinc-900/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-800">
                  <th className="py-1 px-2">Time</th>
                  <th className="py-1 px-2">Type</th>
                  <th className="py-1 px-2">Data</th>
                  <th className="py-1 px-2">Channel</th>
                </tr>
              </thead>
              <tbody>
                {midiEvents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-zinc-500">
                      No MIDI events received
                    </td>
                  </tr>
                )}
                {midiEvents.map((event, index) => (
                  <tr key={index} className="border-b border-zinc-800/50">
                    <td className="py-1 px-2 text-zinc-400">
                      {formatTimestamp(event.timestamp)}
                    </td>
                    <td className="py-1 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        event.type === 'noteOn' 
                          ? 'bg-green-900/30 text-green-400' 
                          : event.type === 'noteOff'
                          ? 'bg-red-900/30 text-red-400'
                          : 'bg-blue-900/30 text-blue-400'
                      }`}>
                        {event.type}
                      </span>
                    </td>
                    <td className="py-1 px-2">
                      {event.type === 'noteOn' || event.type === 'noteOff' ? (
                        <span className="text-zinc-300">
                          {getMIDINoteName(event.note || 0)} ({event.note})
                          {event.type === 'noteOn' && event.velocity !== undefined && (
                            <span className="text-zinc-400 ml-1">vel: {Math.round(event.velocity * 127)}</span>
                          )}
                        </span>
                      ) : event.type === 'controlChange' ? (
                        <span className="text-zinc-300">
                          CC {event.controller} = {event.value}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-1 px-2 text-zinc-400">
                      {event.channel + 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
