/**
 * This helper class is intended to aid the implementation of
 * AudioProcessorEditor::getControlParameterIndex() for editors using a WebView interface.
 *
 * Create an instance of this class and call its handleMouseMove() method in each mousemove event.
 *
 * This class can be used to continuously report the controlParameterIndexAnnotation attribute's
 * value related to the DOM element that is currently under the mouse pointer.
 */
export class ControlParameterIndexUpdater {
  private controlParameterIndexAnnotation: string;
  private lastElement: Element | null = null;
  private lastControlParameterIndex: string | number | null = null;

  constructor(controlParameterIndexAnnotation: string) {
    this.controlParameterIndexAnnotation = controlParameterIndexAnnotation;
  }

  handleMouseMove(event: MouseEvent): void {
    const currentElement = document.elementFromPoint(
      event.clientX,
      event.clientY
    );

    if (currentElement === this.lastElement) return;
    this.lastElement = currentElement;

    let controlParameterIndex: string | number = -1;

    if (currentElement !== null)
      controlParameterIndex = this.#getControlParameterIndex(currentElement);

    if (controlParameterIndex === this.lastControlParameterIndex) return;
    this.lastControlParameterIndex = controlParameterIndex;

    window.__JUCE__.backend.emitEvent(
      "__juce__controlParameterIndexChanged",
      controlParameterIndex
    );
  }

  //==============================================================================
  #getControlParameterIndex(element: Element): string | number {
    const isValidNonRootElement = (e: Element | null): boolean => {
      return e !== null && e !== document.documentElement;
    };

    let currentElement: Element | null = element;
    
    while (isValidNonRootElement(currentElement)) {
      if (currentElement?.hasAttribute(this.controlParameterIndexAnnotation)) {
        return currentElement.getAttribute(this.controlParameterIndexAnnotation)!;
      }

      currentElement = currentElement?.parentElement ?? null;
    }

    return -1;
  }
}
