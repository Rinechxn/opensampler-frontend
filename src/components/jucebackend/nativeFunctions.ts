import { PromiseHandler } from './PromiseHandler';

const promiseHandler = new PromiseHandler();

/**
 * Returns a function object that calls a function registered on the JUCE backend and forwards all
 * parameters to it.
 *
 * The provided name should be the same as the name argument passed to
 * WebBrowserComponent::Options.withNativeFunction() on the backend.
 */
export function getNativeFunction(name: string): (...args: any[]) => Promise<any> {
  if (!window.__JUCE__.initialisationData.__juce__functions.includes(name))
    console.warn(
      `Creating native function binding for '${name}', which is unknown to the backend`
    );

  const f = function (...args: any[]): Promise<any> {
    const [promiseId, result] = promiseHandler.createPromise();

    window.__JUCE__.backend.emitEvent("__juce__invoke", {
      name: name,
      params: args,
      resultId: promiseId,
    });

    return result;
  };

  return f;
}

/**
 * Appends a platform-specific prefix to the path to ensure that a request sent to this address will
 * be received by the backend's ResourceProvider.
 */
export function getBackendResourceAddress(path: string): string {
  const platform =
    window.__JUCE__.initialisationData.__juce__platform.length > 0
      ? window.__JUCE__.initialisationData.__juce__platform[0]
      : "";

  if (platform === "windows" || platform === "android")
    return "https://juce.backend/" + path;

  if (platform === "macos" || platform === "ios" || platform === "linux")
    return "juce://juce.backend/" + path;

  console.warn(
    "getBackendResourceAddress() called, but no JUCE native backend is detected."
  );
  return path;
}
