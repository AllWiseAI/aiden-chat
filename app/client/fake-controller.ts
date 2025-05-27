/**
 * FakeAbortController is a fake implementation of the AbortController API.
 * It is used to simulate the behavior of the AbortController API in environments
 * that do not support it.
 *
 *
 * @see URL_ADDRESS * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortController
 */
class FakeAbortSignal {
  private _aborted = false;
  private _listeners: (() => void)[] = [];

  get aborted() {
    return this._aborted;
  }

  addEventListener(event: "abort", listener: () => void) {
    if (event !== "abort") return;
    this._listeners.push(listener);
    if (this._aborted) {
      listener();
    }
  }

  removeEventListener(event: "abort", listener: () => void) {
    if (event !== "abort") return;
    this._listeners = this._listeners.filter((l) => l !== listener);
  }

  _trigger() {
    if (!this._aborted) {
      this._aborted = true;
      this._listeners.forEach((l) => l());
    }
  }
}

export default class FakeAbortController {
  readonly signal: FakeAbortSignal;

  constructor() {
    this.signal = new FakeAbortSignal();
  }

  abort() {
    this.signal._trigger();
  }
}
