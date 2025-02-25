import * as path from 'path';
import Aika from '..';

/**
 * Reverb processor bridge class
 */
export class ReverbProcessor implements Aika.ReverbParameters {
  private nativeReverb: any;
  
  // ReverbParameters properties
  roomSize: number = 0.5;
  dampening: number = 0.5;
  width: number = 1.0;
  wetLevel: number = 0.33;
  dryLevel: number = 0.4;
  freezeMode: boolean = false;

  /**
   * Creates a new reverb processor
   * @param sampleRate The sample rate at which the reverb will operate
   */
  constructor(sampleRate: number = 44100) {
    this.nativeReverb = new Aika.ReverbNative(sampleRate);
    this.updateNativeProcessor();
  }

  /**
   * Set parameters for the reverb processor
   * @param params Parameters object with reverb settings
   */
  setParameters(params: Partial<Aika.ReverbParameters>): void {
    if (params.roomSize !== undefined) {
      this.roomSize = clamp(params.roomSize, 0, 1);
    }
    if (params.dampening !== undefined) {
      this.dampening = clamp(params.dampening, 0, 1);
    }
    if (params.width !== undefined) {
      this.width = clamp(params.width, 0, 1);
    }
    if (params.wetLevel !== undefined) {
      this.wetLevel = clamp(params.wetLevel, 0, 1);
    }
    if (params.dryLevel !== undefined) {
      this.dryLevel = clamp(params.dryLevel, 0, 1);
    }
    if (params.freezeMode !== undefined) {
      this.freezeMode = params.freezeMode;
    }

    this.updateNativeProcessor();
  }

  /**
   * Get current reverb parameters
   */
  getParameters(): Aika.ReverbParameters {
    return {
      roomSize: this.roomSize,
      dampening: this.dampening,
      width: this.width,
      wetLevel: this.wetLevel,
      dryLevel: this.dryLevel,
      freezeMode: this.freezeMode
    };
  }

  /**
   * Process a block of audio samples through the reverb
   * @param inBuffer Input audio buffer (array of Float32Array channels)
   * @param outBuffer Output audio buffer (array of Float32Array channels)
   * @param numSamples Number of samples to process
   */
  processBlock(inBuffer: Float32Array[], outBuffer: Float32Array[], numSamples: number): void {
    // Ensure valid buffers
    if (!inBuffer?.length || !outBuffer?.length) {
      throw new Error('Invalid buffer provided to reverb processor');
    }
    
    // Make sure output buffer has enough space
    const numChannels = Math.min(inBuffer.length, outBuffer.length);
    for (let ch = 0; ch < numChannels; ch++) {
      if (outBuffer[ch].length < numSamples || inBuffer[ch].length < numSamples) {
        throw new Error('Buffer size too small for requested sample count');
      }
    }
    
    // Process using native implementation
    this.nativeReverb.processBlock(inBuffer, outBuffer, numSamples);
  }

  /**
   * Reset the internal state of the reverb
   */
  reset(): void {
    this.nativeReverb.reset();
  }

  /**
   * Update the sample rate of the reverb processor
   * @param newSampleRate The new sample rate in Hz
   */
  setSampleRate(newSampleRate: number): void {
    this.nativeReverb.setSampleRate(newSampleRate);
  }

  /**
   * Update the native processor with current parameter values
   */
  private updateNativeProcessor(): void {
    this.nativeReverb.setParameters({
      roomSize: this.roomSize,
      dampening: this.dampening,
      width: this.width,
      wetLevel: this.wetLevel,
      dryLevel: this.dryLevel,
      freezeMode: this.freezeMode
    });
  }
}

/**
 * Utility to clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Factory function to create a reverb processor
 */
export function createReverbProcessor(sampleRate: number = 44100): Aika.ReverbProcessor {
  return new ReverbProcessor(sampleRate);
}

/**
 * Compressor processor bridge class
 */
export class CompressorProcessor {
  private nativeCompressor: any;
  
  // Default compressor parameters
  threshold: number = -20;    // dB
  ratio: number = 4;          // ratio
  attack: number = 5;         // ms
  release: number = 100;      // ms
  makeupGain: number = 0;     // dB
  
  /**
   * Creates a new compressor processor
   * @param sampleRate The sample rate at which the compressor will operate
   */
  constructor(sampleRate: number = 44100) {
    this.nativeCompressor = new Aika.CompressorNative(sampleRate);
    this.updateNativeProcessor();
  }
  
  /**
   * Set parameters for the compressor
   * @param params Parameters for the compressor
   */
  setParameters(params: Partial<typeof CompressorProcessor.prototype>): void {
    if (params.threshold !== undefined) {
      this.threshold = params.threshold;
    }
    if (params.ratio !== undefined) {
      this.ratio = Math.max(1, params.ratio);
    }
    if (params.attack !== undefined) {
      this.attack = Math.max(0, params.attack);
    }
    if (params.release !== undefined) {
      this.release = Math.max(0, params.release);
    }
    if (params.makeupGain !== undefined) {
      this.makeupGain = params.makeupGain;
    }
    
    this.updateNativeProcessor();
  }
  
  /**
   * Process audio through the compressor
   * @param inBuffer Input audio buffer
   * @param outBuffer Output audio buffer
   * @param numSamples Number of samples to process
   */
  processBlock(inBuffer: Float32Array[], outBuffer: Float32Array[], numSamples: number): void {
    this.nativeCompressor.processBlock(inBuffer, outBuffer, numSamples);
  }
  
  /**
   * Reset the compressor state
   */
  reset(): void {
    this.nativeCompressor.reset();
  }
  
  /**
   * Get current gain reduction in dB
   */
  getGainReduction(): number {
    return this.nativeCompressor.getGainReduction();
  }
  
  /**
   * Update the native processor with current parameter values
   */
  private updateNativeProcessor(): void {
    this.nativeCompressor.setParameters({
      threshold: this.threshold,
      ratio: this.ratio,
      attack: this.attack,
      release: this.release,
      makeupGain: this.makeupGain
    });
  }
}

/**
 * Factory function for DSP component creation
 */
export class DSPFactory {
  /**
   * Create a reverb processor
   * @param sampleRate Sample rate in Hz
   */
  static createReverb(sampleRate: number = 44100): Aika.ReverbProcessor {
    return new ReverbProcessor(sampleRate);
  }
  
  /**
   * Create a compressor processor
   * @param sampleRate Sample rate in Hz
   */
  static createCompressor(sampleRate: number = 44100): CompressorProcessor {
    return new CompressorProcessor(sampleRate);
  }
}

// Export factory as default
export default DSPFactory;