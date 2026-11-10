// node:readline tiruan: createInterface({ input }) membaca stream baris demi baris
// (event 'line' dan 'close', serta for await ... of).
import { EventEmitter } from 'events';
import { StringDecoder } from 'string_decoder';

export class Interface extends EventEmitter {
  constructor(input, output, completer, terminal) {
    super();
    const opsi = input && input.input ? input : { input, output, completer, terminal };
    this.input = opsi.input;
    this.output = opsi.output;
    this.closed = false;
    this.line = '';
    this.terminal = false;
    this._antrean = [];
    this._penunggu = null;
    this._jeda = false;
    let sisa = '';
    const dec = new StringDecoder('utf8');
    const kirim = (baris) => {
      if (this.closed) return;
      this.emit('line', baris);
    };
    this._onData = (c) => {
      sisa += typeof c === 'string' ? c : dec.write(c);
      let m;
      while ((m = /\r\n|\n|\r(?!$)/.exec(sisa))) {
        const baris = sisa.slice(0, m.index);
        sisa = sisa.slice(m.index + m[0].length);
        kirim(baris);
      }
    };
    this._onEnd = () => {
      sisa += dec.end();
      if (sisa.endsWith('\r')) sisa = sisa.slice(0, -1);
      if (sisa.length) kirim(sisa);
      sisa = '';
      this.close();
    };
    if (this.input) {
      this.input.on('data', this._onData);
      this.input.on('end', this._onEnd);
    }
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    if (this.input) {
      this.input.removeListener('data', this._onData);
      this.input.removeListener('end', this._onEnd);
    }
    this.emit('close');
  }
  pause() { if (this.input && this.input.pause) this.input.pause(); this.emit('pause'); return this; }
  resume() { if (this.input && this.input.resume) this.input.resume(); this.emit('resume'); return this; }
  setPrompt() {}
  prompt() {}
  write() {}
  [Symbol.asyncIterator]() {
    const antrean = [];
    let tunggu = null;
    let selesai = false;
    const onLine = (l) => {
      if (tunggu) { const t = tunggu; tunggu = null; t.resolve({ value: l, done: false }); } else antrean.push(l);
    };
    const onClose = () => {
      selesai = true;
      if (tunggu) { const t = tunggu; tunggu = null; t.resolve({ value: undefined, done: true }); }
    };
    this.on('line', onLine);
    this.on('close', onClose);
    if (this.closed) selesai = true;
    const lepas = () => { this.removeListener('line', onLine); this.removeListener('close', onClose); };
    return {
      next: () => {
        if (antrean.length) return Promise.resolve({ value: antrean.shift(), done: false });
        if (selesai) { lepas(); return Promise.resolve({ value: undefined, done: true }); }
        return new Promise((resolve, reject) => { tunggu = { resolve, reject }; });
      },
      return: () => { lepas(); this.close(); return Promise.resolve({ value: undefined, done: true }); },
      [Symbol.asyncIterator]() { return this; },
    };
  }
}
export function createInterface(input, output, completer, terminal) {
  return new Interface(input, output, completer, terminal);
}
export function clearLine() { return true; }
export function cursorTo() { return true; }
export function moveCursor() { return true; }
export function emitKeypressEvents() {}
export default { Interface, createInterface, clearLine, cursorTo, moveCursor, emitKeypressEvents };
