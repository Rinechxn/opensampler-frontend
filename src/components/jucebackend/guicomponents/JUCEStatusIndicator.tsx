
import { useJUCEBridge } from '@/hooks/useJUCEBridge';

export function JUCEStatusIndicator() {
  const { isAvailable, isReady } = useJUCEBridge();
  
  if (!isAvailable) {
    return null;
  }
  
  return (
    <div className="flex items-center ml-auto mr-2">
      <div
        className={`w-2 h-2 rounded-full mr-2 ${
          isReady ? 'bg-emerald-500' : 'bg-amber-500'
        }`}
      />
      <span className="text-xs text-zinc-400">
        {isReady ? 'JUCE Ready' : 'JUCE Initializing'}
      </span>
    </div>
  );
}
