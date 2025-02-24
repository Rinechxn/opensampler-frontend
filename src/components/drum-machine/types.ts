export interface Sample {
    url: string;
    name: string;
    midiNote: number;
    chokeGroup: number;
    volume: number;
    attack: number;
    release: number;
    start: number;
    end: number;
    // Effects parameters
    compress: {
        threshold: number;
        ratio: number;
        attack: number;
        release: number;
        enabled?: boolean; // add this
    };
    reverb: {
        wet: number;
        decay: number;
        preDelay: number;
        enabled?: boolean; // add this
    };
}

export interface DrumPad {
    id: number;
    sample: Sample | null;
}

export interface DrumPreset {
    name: string;
    pads: DrumPad[];
}
