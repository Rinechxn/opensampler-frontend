

import { Backend } from "./types";

declare global {
  interface Window {
    inAndroidUserScriptEval?: boolean;
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
    };
  }
}

if (
  typeof window.__JUCE__ !== "undefined" &&
  typeof window.__JUCE__.getAndroidUserScripts !== "undefined" &&
  typeof window.inAndroidUserScriptEval === "undefined"
) {
  window.inAndroidUserScriptEval = true;
  eval(window.__JUCE__.getAndroidUserScripts());
  delete window.inAndroidUserScriptEval;
}

{
  if (typeof window.__JUCE__ === "undefined") {
    console.warn(
      "The 'window.__JUCE__' object is undefined." +
        " Native integration features will not work." +
        " Defining a placeholder 'window.__JUCE__' object."
    );

    (window as any).__JUCE__ = {
      postMessage: function () {},
    };
  }

  if (typeof window.__JUCE__.initialisationData === "undefined") {
    window.__JUCE__.initialisationData = {
      __juce__platform: [],
      __juce__functions: [],
      __juce__registeredGlobalEventIds: [],
      __juce__sliders: [],
      __juce__toggles: [],
      __juce__comboBoxes: [],
    };
  }

  class ListenerList {
    private listeners = new Map<number, (payload: any) => void>();
    private listenerId = 0;

    addListener(fn: (payload: any) => void): number {
      const newListenerId = this.listenerId++;
      this.listeners.set(newListenerId, fn);
      return newListenerId;
    }

    removeListener(id: number): void {
      if (this.listeners.has(id)) {
        this.listeners.delete(id);
      }
    }

    callListeners(payload: any): void {
      for (const [, value] of this.listeners) {
        value(payload);
      }
    }
  }

  class EventListenerList {
    private eventListeners = new Map<string, ListenerList>();

    addEventListener(eventId: string, fn: (payload: any) => void): [string, number] {
      if (!this.eventListeners.has(eventId))
        this.eventListeners.set(eventId, new ListenerList());

      const id = this.eventListeners.get(eventId)!.addListener(fn);

      return [eventId, id];
    }

    removeEventListener([eventId, id]: [string, number]): void {
      if (this.eventListeners.has(eventId)) {
        this.eventListeners.get(eventId)!.removeListener(id);
      }
    }

    emitEvent(eventId: string, object: any): void {
      if (this.eventListeners.has(eventId))
        this.eventListeners.get(eventId)!.callListeners(object);
    }
  }

  class Backend {
    private listeners = new EventListenerList();

    addEventListener(eventId: string, fn: (payload: any) => void): [string, number] {
      return this.listeners.addEventListener(eventId, fn);
    }

    removeEventListener([eventId, id]: [string, number]): void {
      this.listeners.removeEventListener([eventId, id]);
    }

    emitEvent(eventId: string, object: any): void {
      window.__JUCE__.postMessage(
        JSON.stringify({ eventId: eventId, payload: object })
      );
    }

    emitByBackend(eventId: string, object: string): void {
      this.listeners.emitEvent(eventId, JSON.parse(object));
    }
  }

  if (typeof window.__JUCE__.backend === "undefined")
    window.__JUCE__.backend = new Backend();
}
