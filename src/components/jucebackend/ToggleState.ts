import { ListenerList } from './ListenerList';
import { 
  BasicControl_valueChangedEventId, 
  BasicControl_propertiesChangedId,
  ToggleProperties 
} from './types';

/**
 * ToggleState encapsulates data and callbacks that are synchronised with a WebToggleRelay object
 * on the backend.
 *
 * Use getToggleState() to create a ToggleState object. This object will be synchronised with the
 * WebToggleRelay backend object that was created using the same unique name.
 */
export class ToggleState {
  private name: string;
  private identifier: string;
  private value: boolean;
  public properties: ToggleProperties;
  public valueChangedEvent: ListenerList;
  public propertiesChangedEvent: ListenerList;

  constructor(name: string) {
    if (!window.__JUCE__.initialisationData.__juce__toggles.includes(name))
      console.warn(
        "Creating ToggleState for '" +
          name +
          "', which is unknown to the backend"
      );

    this.name = name;
    this.identifier = "__juce__toggle" + this.name;
    this.value = false;
    this.properties = {
      name: "",
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

  /** Returns the value corresponding to the associated WebToggleRelay's (C++) state. */
  getValue(): boolean {
    return this.value;
  }

  /** Informs the backend to change the associated WebToggleRelay's (C++) state. */
  setValue(newValue: boolean): void {
    this.value = newValue;

    window.__JUCE__.backend.emitEvent(this.identifier, {
      eventType: BasicControl_valueChangedEventId,
      value: this.value,
    });
  }

  /** Internal. */
  private handleEvent(event: any): void {
    if (event.eventType === BasicControl_valueChangedEventId) {
      this.value = event.value;
      this.valueChangedEvent.callListeners();
    }
    if (event.eventType === BasicControl_propertiesChangedId) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { eventType: _, ...rest } = event;
      this.properties = rest as ToggleProperties;
      this.propertiesChangedEvent.callListeners();
    }
  }
}

const toggleStates = new Map<string, ToggleState>();

// Initialize states for toggles that were registered in JUCE
for (const name of window.__JUCE__.initialisationData.__juce__toggles) {
  toggleStates.set(name, new ToggleState(name));
}

/**
 * Returns a ToggleState object that is connected to the backend WebToggleButtonRelay object that was
 * created with the same name argument.
 *
 * To register a WebToggleButtonRelay object create one with the right name and add it to the
 * WebBrowserComponent::Options struct using withOptionsFrom.
 */
export function getToggleState(name: string): ToggleState {
  if (!toggleStates.has(name)) toggleStates.set(name, new ToggleState(name));

  return toggleStates.get(name)!;
}
