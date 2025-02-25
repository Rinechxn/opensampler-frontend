export interface JUCEMessage {
  type: string;
  action?: string;
  data: any;
  padId?: number;
  effect?: string;
  parameter?: string;
  value?: number;
  enabled?: boolean;
}

export interface JUCEAudioMessage {
  type: 'audio';
  action: 'load' | 'play' | 'stop' | 'setParameter' | 'unload';
  padId: number;
  data: any;
}

export interface JUCEParameterMessage {
  type: 'parameter';
  padId: number;
  parameter: string;
  value: number;
}

export interface JUCEEffectMessage {
  type: 'effect';
  padId: number;
  effect: string;
  parameter: string;
  value: number;
  enabled?: boolean;
}

export interface JUCEMIDIMessage {
  type: 'midi';
  action: 'noteOn' | 'noteOff' | 'controlChange' | 'getInputs' | 'selectInput';
  data: {
    note?: number;
    velocity?: number;
    controller?: number;
    value?: number;
    channel?: number;
    deviceName?: string;
  };
}

export interface JUCEAudioEngineSettings {
  bufferSize: number;
  sampleRate: number;
  useLowLatency: boolean;
  enableMultithreading: boolean;
  realtimePriority: boolean;
  dithering: boolean;
}

export class JUCEBridge {
  private static instance: JUCEBridge;
  private isInitialized: boolean = false;
  private messageQueue: JUCEMessage[] = [];
  private messageHandlers: Map<string, ((message: any) => void)[]> = new Map();
  private engineSettings: JUCEAudioEngineSettings = {
    bufferSize: 512,
    sampleRate: 48000,
    useLowLatency: true,
    enableMultithreading: true,
    realtimePriority: true,
    dithering: true
  };

  private constructor() {
    // Listen for messages from JUCE
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleMessage.bind(this));
    }
  }

  static getInstance(): JUCEBridge {
    if (!JUCEBridge.instance) {
      JUCEBridge.instance = new JUCEBridge();
    }
    return JUCEBridge.instance;
  }

  initialize(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isInitialized) {
        resolve(true);
        return;
      }

      if (window.juceBridge) {
        window.juceBridge.onready = () => {
          this.isInitialized = true;
          // Process any queued messages
          this.processQueue();
          // Apply audio engine settings
          this.applyEngineSettings();
          resolve(true);
        };
        
        // Initialize the bridge
        window.juceBridge.init();
        
        // Set up message handler
        window.juceBridge.onmessage = (messageStr: string) => {
          try {
            const message = JSON.parse(messageStr);
            this.dispatchMessage(message);
          } catch (error) {
            console.error('Error parsing message from JUCE:', error);
          }
        };
      } else {
        console.warn('JUCE Bridge not available');
        resolve(false);
      }
    });
  }

  private handleMessage(event: MessageEvent) {
    // Handle messages from JUCE that come via postMessage
    if (event.data && event.data.source === 'juce-bridge') {
      this.dispatchMessage(event.data);
    }
  }

  private dispatchMessage(message: any) {
    const { type } = message;
    const handlers = this.messageHandlers.get(type) || [];
    handlers.forEach(handler => handler(message));
  }

  on(messageType: string, handler: (message: any) => void) {
    const handlers = this.messageHandlers.get(messageType) || [];
    handlers.push(handler);
    this.messageHandlers.set(messageType, handlers);
    
    return () => {
      const updatedHandlers = this.messageHandlers.get(messageType) || [];
      this.messageHandlers.set(
        messageType,
        updatedHandlers.filter(h => h !== handler)
      );
    };
  }

  private processQueue() {
    if (!this.isInitialized || !window.juceBridge) return;
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        window.juceBridge.sendMessage(JSON.stringify(message));
      }
    }
  }

  private applyEngineSettings() {
    this.sendMessage({
      type: 'engineSettings',
      data: this.engineSettings
    });
  }

  updateEngineSettings(settings: Partial<JUCEAudioEngineSettings>) {
    this.engineSettings = {
      ...this.engineSettings,
      ...settings
    };

    if (this.isInitialized) {
      this.applyEngineSettings();
    }
  }

  getEngineSettings(): JUCEAudioEngineSettings {
    return { ...this.engineSettings };
  }

  sendMessage(message: JUCEMessage) {
    if (!this.isInitialized || !window.juceBridge) {
      // Queue message for later if not initialized
      this.messageQueue.push(message);
      return;
    }
    
    window.juceBridge.sendMessage(JSON.stringify(message));
  }

  loadSample(padId: number, audioBuffer: ArrayBuffer, sampleInfo: any) {
    this.sendMessage({
      type: 'audio',
      action: 'load',
      padId,
      data: {
        buffer: audioBuffer, 
        ...sampleInfo
      }
    });
  }

  playSample(padId: number, noteInfo?: any) {
    this.sendMessage({
      type: 'audio',
      action: 'play',
      padId,
      data: noteInfo || {}
    });
  }

  stopSample(padId: number) {
    this.sendMessage({
      type: 'audio',
      action: 'stop',
      padId,
      data: {}
    });
  }

  setSampleParameter(padId: number, parameter: string, value: number) {
    this.sendMessage({
        type: 'parameter',
        padId,
        parameter,
        value,
        data: undefined
    });
  }

  setEffectParameter(padId: number, effect: string, parameter: string, value: number, enabled?: boolean) {
    this.sendMessage({
        type: 'effect',
        padId,
        effect,
        parameter,
        value,
        enabled,
        data: undefined
    });
  }
  
  // MIDI-specific methods
  sendMIDINote(note: number, velocity: number, channel: number = 0) {
    this.sendMessage({
      type: 'midi',
      action: 'noteOn',
      data: {
        note,
        velocity,
        channel
      }
    });
  }

  releaseMIDINote(note: number, channel: number = 0) {
    this.sendMessage({
      type: 'midi',
      action: 'noteOff',
      data: {
        note,
        channel
      }
    });
  }

  sendMIDIControlChange(controller: number, value: number, channel: number = 0) {
    this.sendMessage({
      type: 'midi',
      action: 'controlChange',
      data: {
        controller,
        value,
        channel
      }
    });
  }

  getMIDIInputDevices(): Promise<string[]> {
    return new Promise((resolve) => {
      if (!this.isInitialized || !window.juceBridge) {
        resolve([]);
        return;
      }
      
      const handler = (message: any) => {
        if (message.type === 'midiDeviceList') {
          this.messageHandlers.set(
            'midiDeviceList',
            (this.messageHandlers.get('midiDeviceList') || []).filter(h => h !== handler)
          );
          resolve(message.data.inputs || []);
        }
      };
      
      // Register temporary handler
      const handlers = this.messageHandlers.get('midiDeviceList') || [];
      handlers.push(handler);
      this.messageHandlers.set('midiDeviceList', handlers);
      
      // Request device list
      this.sendMessage({
        type: 'midi',
        action: 'getInputs',
        data: {}
      });
      
      // Timeout after 2 seconds
      setTimeout(() => {
        this.messageHandlers.set(
          'midiDeviceList',
          (this.messageHandlers.get('midiDeviceList') || []).filter(h => h !== handler)
        );
        resolve([]);
      }, 2000);
    });
  }

  selectMIDIInputDevice(deviceName: string | null): void {
    if (!this.isInitialized || !window.juceBridge) return;
    
    this.sendMessage({
      type: 'midi',
      action: 'selectInput',
      data: {
        deviceName: deviceName || ''
      }
    });
  }

  // Audio analysis methods
  requestAnalysis(type: 'spectrum' | 'waveform', padId?: number) {
    this.sendMessage({
      type: 'analysis',
      action: 'request',
      data: {
        analysisType: type,
        padId
      }
    });
  }

  // Add shutdown method
  shutdown(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isInitialized || !window.juceBridge) {
        resolve(false);
        return;
      }
      
      try {
        // Send shutdown message to JUCE
        this.sendMessage({
          type: 'system',
          action: 'shutdown',
          data: {}
        });
        
        // Clean up event listeners
        window.removeEventListener('message', this.handleMessage.bind(this));
        
        this.isInitialized = false;
        resolve(true);
      } catch (error) {
        console.error('Error shutting down JUCE Bridge:', error);
        resolve(false);
      }
    });
  }
  
  // Add resource cleanup
  releaseResources(): void {
    if (!this.isInitialized || !window.juceBridge) return;
    
    this.sendMessage({
      type: 'system',
      action: 'releaseResources',
      data: {}
    });
  }

  // Add device enumeration
  async getAudioDevices(): Promise<{ inputs: string[], outputs: string[] }> {
    return new Promise((resolve) => {
      if (!this.isInitialized || !window.juceBridge) {
        resolve({ inputs: [], outputs: [] });
        return;
      }
      
      const handler = (message: any) => {
        if (message.type === 'deviceList' && message.deviceType === 'audio') {
          this.messageHandlers.set(
            'deviceList',
            (this.messageHandlers.get('deviceList') || []).filter(h => h !== handler)
          );
          resolve(message.data);
        }
      };
      
      // Register temporary handler
      const handlers = this.messageHandlers.get('deviceList') || [];
      handlers.push(handler);
      this.messageHandlers.set('deviceList', handlers);
      
      // Request device list
      this.sendMessage({
        type: 'audio',
        action: 'getDevices',
        data: {}
      });
      
      // Timeout after 2 seconds
      setTimeout(() => {
        this.messageHandlers.set(
          'deviceList',
          (this.messageHandlers.get('deviceList') || []).filter(h => h !== handler)
        );
        resolve({ inputs: [], outputs: [] });
      }, 2000);
    });
  }
}

// Add the JUCE bridge to the global Window interface
declare global {
  interface Window {
    juceBridge?: {
      init: () => void;
      sendMessage: (message: string) => void;
      onready: () => void;
      onmessage?: (message: string) => void;
    };
  }
}
