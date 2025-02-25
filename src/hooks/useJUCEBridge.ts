import { useEffect, useState } from 'react';
import { JUCEBridge } from '@/lib/juce-bridge';

export function useJUCEBridge() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const bridge = JUCEBridge.getInstance();

  useEffect(() => {
    // Check if JUCE bridge is available in window
    setIsAvailable(!!window.juceBridge);
    
    if (window.juceBridge) {
      bridge.initialize().then((ready) => {
        setIsReady(ready);
      });
    }
    
    // Handle messages from JUCE
    const handleJuceMessage = (e: MessageEvent) => {
      if (e.data && e.data.source === 'juce-bridge') {
        console.log('JUCE message:', e.data);
        // Process message here
      }
    };
    
    window.addEventListener('message', handleJuceMessage);
    
    return () => {
      window.removeEventListener('message', handleJuceMessage);
    };
  }, []);

  return {
    bridge,
    isAvailable,
    isReady
  };
}
