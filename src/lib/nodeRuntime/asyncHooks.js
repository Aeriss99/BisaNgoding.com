export class AsyncResource { constructor() {} runInAsyncScope(fn, thisArg, ...a) { return fn.apply(thisArg, a); } bind(fn) { return fn; } static bind(fn) { return fn; } emitDestroy() { return this; } }
export class AsyncLocalStorage {
  constructor() { this._s = undefined; }
  getStore() { return this._s; }
  run(store, fn, ...a) { const lama = this._s; this._s = store; try { return fn(...a); } finally { this._s = lama; } }
  enterWith(s) { this._s = s; }
}
export default { AsyncResource, AsyncLocalStorage };
