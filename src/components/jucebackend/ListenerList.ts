export class ListenerList {
  private listeners = new Map<number, (payload?: any) => void>();
  private listenerId = 0;

  addListener(fn: (payload?: any) => void): number {
    const newListenerId = this.listenerId++;
    this.listeners.set(newListenerId, fn);
    return newListenerId;
  }

  removeListener(id: number): void {
    if (this.listeners.has(id)) {
      this.listeners.delete(id);
    }
  }

  callListeners(payload?: any): void {
    for (const [, value] of this.listeners) {
      value(payload);
    }
  }
}
