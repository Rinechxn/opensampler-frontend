import { PromiseRecord } from './types';

export class PromiseHandler {
  private lastPromiseId = 0;
  private promises = new Map<number, PromiseRecord>();

  constructor() {
    window.__JUCE__.backend.addEventListener(
      "__juce__complete",
      ({ promiseId, result }: { promiseId: number; result: any }) => {
        if (this.promises.has(promiseId)) {
          this.promises.get(promiseId)!.resolve(result);
          this.promises.delete(promiseId);
        }
      }
    );
  }

  createPromise(): [number, Promise<any>] {
    const promiseId = this.lastPromiseId++;
    const result = new Promise<any>((resolve, reject) => {
      this.promises.set(promiseId, { resolve, reject });
    });
    return [promiseId, result];
  }
}
