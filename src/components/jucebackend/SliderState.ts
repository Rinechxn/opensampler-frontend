import { ListenerList } from './ListenerList';
import { 
  BasicControl_valueChangedEventId, 
  BasicControl_propertiesChangedId,
  SliderControl_sliderDragStartedEventId, 
  SliderControl_sliderDragEndedEventId,
  SliderProperties 
} from './types';

/**
 * SliderState encapsulates data and callbacks that are synchronised with a WebSliderRelay object
 * on the backend.
 *
 * Use getSliderState() to create a SliderState object. This object will be synchronised with the
 * WebSliderRelay backend object that was created using the same unique name.
 */
export class SliderState {
  private name: string;
  private identifier: string;
  private scaledValue: number;
  public properties: SliderProperties;
  public valueChangedEvent: ListenerList;
  public propertiesChangedEvent: ListenerList;

  constructor(name: string) {
    if (!window.__JUCE__.initialisationData.__juce__sliders.includes(name))
      console.warn(
        "Creating SliderState for '" +
          name +
          "', which is unknown to the backend"
      );

    this.name = name;
    this.identifier = "__juce__slider" + this.name;
    this.scaledValue = 0;
    this.properties = {
      start: 0,
      end: 1,
      skew: 1,
      name: "",
      label: "",
      numSteps: 100,
      interval: 0,
      parameterIndex: -1,
    };
    this.valueChangedEvent = new ListenerList();
    this.propertiesChangedEvent = new ListenerList();

    window.__JUCE__.backend.addEventListener(this.identifier, (event: any) =>
      this.handleEvent(event)
    );

    window.__JUCE__.backend.emitEvent(this.identifier, {
      eventType: "requestInitialUpdate",
    });
  }

  /**
   * Sets the normalised value of the corresponding backend parameter. This value is always in the
   * [0, 1] range (inclusive).
   *
   * The meaning of this range is the same as in the case of
   * AudioProcessorParameter::getValue() (C++).
   */
  setNormalisedValue(newValue: number): void {
    this.scaledValue = this.snapToLegalValue(
      this.normalisedToScaledValue(newValue)
    );

    window.__JUCE__.backend.emitEvent(this.identifier, {
      eventType: BasicControl_valueChangedEventId,
      value: this.scaledValue,
    });
  }

  /**
   * This function should be called first thing when the user starts interacting with the slider.
   */
  sliderDragStarted(): void {
    window.__JUCE__.backend.emitEvent(this.identifier, {
      eventType: SliderControl_sliderDragStartedEventId,
    });
  }

  /**
   * This function should be called when the user finished the interaction with the slider.
   */
  sliderDragEnded(): void {
    window.__JUCE__.backend.emitEvent(this.identifier, {
      eventType: SliderControl_sliderDragEndedEventId,
    });
  }

  /** Internal. */
  private handleEvent(event: any): void {
    if (event.eventType === BasicControl_valueChangedEventId) {
      this.scaledValue = event.value;
      this.valueChangedEvent.callListeners();
    }
    if (event.eventType === BasicControl_propertiesChangedId) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { eventType: _, ...rest } = event;
      this.properties = rest as SliderProperties;
      this.propertiesChangedEvent.callListeners();
    }
  }

  /**
   * Returns the scaled value of the parameter. This corresponds to the return value of
   * NormalisableRange::convertFrom0to1() (C++). This value will differ from a linear
   * [0, 1] range if a non-default NormalisableRange was set for the parameter.
   */
  getScaledValue(): number {
    return this.scaledValue;
  }

  /**
   * Returns the normalised value of the corresponding backend parameter. This value is always in the
   * [0, 1] range (inclusive).
   *
   * The meaning of this range is the same as in the case of
   * AudioProcessorParameter::getValue() (C++).
   */
  getNormalisedValue(): number {
    return Math.pow(
      (this.scaledValue - this.properties.start) /
        (this.properties.end - this.properties.start),
      this.properties.skew
    );
  }

  /** Internal. */
  private normalisedToScaledValue(normalisedValue: number): number {
    return (
      Math.pow(normalisedValue, 1 / this.properties.skew) *
        (this.properties.end - this.properties.start) +
      this.properties.start
    );
  }

  /** Internal. */
  private snapToLegalValue(value: number): number {
    const interval = this.properties.interval;

    if (interval === 0) return value;

    const start = this.properties.start;
    const clamp = (val: number, min = 0, max = 1): number => Math.max(min, Math.min(max, val));

    return clamp(
      start + interval * Math.floor((value - start) / interval + 0.5),
      this.properties.start,
      this.properties.end
    );
  }
}

const sliderStates = new Map<string, SliderState>();

// Initialize states for sliders that were registered in JUCE
for (const sliderName of window.__JUCE__.initialisationData.__juce__sliders) {
  sliderStates.set(sliderName, new SliderState(sliderName));
}

/**
 * Returns a SliderState object that is connected to the backend WebSliderRelay object that was
 * created with the same name argument.
 *
 * To register a WebSliderRelay object create one with the right name and add it to the
 * WebBrowserComponent::Options struct using withOptionsFrom.
 */
export function getSliderState(name: string): SliderState {
  if (!sliderStates.has(name)) sliderStates.set(name, new SliderState(name));

  return sliderStates.get(name)!;
}
