import { ListenerList } from './ListenerList';
import { 
  BasicControl_valueChangedEventId, 
  BasicControl_propertiesChangedId,
  ComboBoxProperties 
} from './types';

/**
 * ComboBoxState encapsulates data and callbacks that are synchronised with a WebComboBoxRelay object
 * on the backend.
 *
 * Use getComboBoxState() to create a ComboBoxState object. This object will be synchronised with the
 * WebComboBoxRelay backend object that was created using the same unique name.
 */
export class ComboBoxState {
  private name: string;
  private identifier: string;
  private value: number;
  public properties: ComboBoxProperties;
  public valueChangedEvent: ListenerList;
  public propertiesChangedEvent: ListenerList;

  constructor(name: string) {
    if (!window.__JUCE__.initialisationData.__juce__comboBoxes.includes(name))
      console.warn(
        "Creating ComboBoxState for '" +
          name +
          "', which is unknown to the backend"
      );

    this.name = name;
    this.identifier = "__juce__comboBox" + this.name;
    this.value = 0.0;
    this.properties = {
      name: "",
      parameterIndex: -1,
      choices: []
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
   * Returns the value corresponding to the associated WebComboBoxRelay's (C++) state.
   *
   * This is an index identifying which element of the properties.choices array is currently
   * selected.
   */
  getChoiceIndex(): number {
    return Math.round(this.value * (this.properties.choices.length - 1));
  }

  /**
   * Informs the backend to change the associated WebComboBoxRelay's (C++) state.
   *
   * This should be called with the index identifying the selected element from the
   * properties.choices array.
   */
  setChoiceIndex(index: number): void {
    const numItems = this.properties.choices.length;
    this.value = numItems > 1 ? index / (numItems - 1) : 0.0;

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
      this.properties = rest as ComboBoxProperties;
      this.propertiesChangedEvent.callListeners();
    }
  }
}

const comboBoxStates = new Map<string, ComboBoxState>();

// Initialize states for comboBoxes that were registered in JUCE
for (const name of window.__JUCE__.initialisationData.__juce__comboBoxes) {
  comboBoxStates.set(name, new ComboBoxState(name));
}

/**
 * Returns a ComboBoxState object that is connected to the backend WebComboBoxRelay object that was
 * created with the same name argument.
 *
 * To register a WebComboBoxRelay object create one with the right name and add it to the
 * WebBrowserComponent::Options struct using withOptionsFrom.
 */
export function getComboBoxState(name: string): ComboBoxState {
  if (!comboBoxStates.has(name))
    comboBoxStates.set(name, new ComboBoxState(name));

  return comboBoxStates.get(name)!;
}
