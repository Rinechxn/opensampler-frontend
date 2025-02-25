
declare namespace Aika {
  // Common types
  export type SampleRate = number;
  export type ChannelCount = 1 | 2;

  // Sampler types
  export interface SampleData {
    buffer: Float32Array[];
    sampleRate: SampleRate;
    channels: ChannelCount;
    rootNote: number;
    loopStart?: number;
    loopEnd?: number;
    hasLoop: boolean;
  }

  export interface SampleRegion {
    id: string;
    sampleData: SampleData;
    keyRange: { low: number; high: number };
    velocityRange: { low: number; high: number };
    pitchBendRange: number;
    tuning: number;
  }

  export interface SampleParser {
    parseSampleFile(filePath: string): Promise<SampleData>;
    parseSampleFolder(folderPath: string): Promise<SampleData[]>;
  }

  // DSP types
  export interface ReverbParameters {
    roomSize: number;      // 0.0 - 1.0
    dampening: number;     // 0.0 - 1.0
    width: number;         // 0.0 - 1.0
    wetLevel: number;      // 0.0 - 1.0
    dryLevel: number;      // 0.0 - 1.0
    freezeMode: boolean;   // true/false
  }

  export interface ReverbProcessor {
    setParameters(params: ReverbParameters): void;
    processBlock(inBuffer: Float32Array[], outBuffer: Float32Array[], numSamples: number): void;
    reset(): void;
  }
}

export = Aika;
