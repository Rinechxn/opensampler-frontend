export interface JuceGlobalWindow extends Window {
  __JUCE__: {
    backend: Backend;
    initialisationData: {
      __juce__platform: string[];
      __juce__functions: string[];
      __juce__registeredGlobalEventIds: string[];
      __juce__sliders: string[];
      __juce__toggles: string[];
      __juce__comboBoxes: string[];
    };
    postMessage: (message: string) => void;
    getAndroidUserScripts?: () => string;
  }
}

export interface Backend {
  addEventListener: (eventId: string, fn: (event: any) => void) => [string, number];
  removeEventListener: (idPair: [string, number]) => void;
  emitEvent: (eventId: string, object: any) => void;
  emitByBackend: (eventId: string, object: string) => void;
}

export interface PromiseRecord {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

export interface SliderProperties {
  start: number;
  end: number;
  skew: number;
  name: string;
  label: string;
  numSteps: number;
  interval: number;
  parameterIndex: number;
}

export interface ToggleProperties {
  name: string;
  parameterIndex: number;
}

export interface ComboBoxProperties {
  name: string;
  parameterIndex: number;
  choices: string[];
}

// Event IDs
export const BasicControl_valueChangedEventId = "valueChanged";
export const BasicControl_propertiesChangedId = "propertiesChanged";
export const SliderControl_sliderDragStartedEventId = "sliderDragStarted";
export const SliderControl_sliderDragEndedEventId = "sliderDragEnded";

declare global {
  interface Window {
    __JUCE__: JuceGlobalWindow['__JUCE__'];
  }
}
