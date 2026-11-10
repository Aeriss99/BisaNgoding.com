import { tahan, lepas, st } from './inti.js';
const asliSet = globalThis.setTimeout.bind(globalThis);
const asliClear = globalThis.clearTimeout.bind(globalThis);
const asliSetI = globalThis.setInterval.bind(globalThis);
const asliClearI = globalThis.clearInterval.bind(globalThis);
let nomor = 1;
const daftar = new Map();
class Timeout {
  constructor(id) { this._id = id; this._ref = true; }
  ref() { if (!this._ref && daftar.has(this._id)) { this._ref = true; tahan(); } return this; }
  unref() { if (this._ref && daftar.has(this._id)) { this._ref = false; lepas(); } return this; }
  hasRef() { return this._ref; }
  refresh() { return this; }
  [Symbol.toPrimitive]() { return this._id; }
}
function jalankan(cb, args) {
  try { cb(...args); } catch (e) { st.onGalat && st.onGalat(e); }
}
export function setTimeout(cb, ms = 1, ...args) {
  const id = nomor++;
  const t = new Timeout(id);
  tahan();
  const h = asliSet(() => {
    daftar.delete(id);
    if (t._ref) lepas(); else st.onCek && st.onCek();
    jalankan(cb, args);
    st.onCek && st.onCek();
  }, Math.max(1, Number(ms) || 1));
  daftar.set(id, { h, t, jenis: 't' });
  return t;
}
export function setInterval(cb, ms = 1, ...args) {
  const id = nomor++;
  const t = new Timeout(id);
  tahan();
  const h = asliSetI(() => { jalankan(cb, args); st.onCek && st.onCek(); }, Math.max(1, Number(ms) || 1));
  daftar.set(id, { h, t, jenis: 'i' });
  return t;
}
function hapus(t) {
  const id = t && typeof t === 'object' ? t._id : t;
  const d = daftar.get(id);
  if (!d) return;
  daftar.delete(id);
  if (d.jenis === 'i') asliClearI(d.h); else asliClear(d.h);
  if (d.t._ref) lepas();
}
export const clearTimeout = hapus;
export const clearInterval = hapus;
// setImmediate: setelah microtask, sebelum timer berikutnya (di browser: MessageChannel)
const kanal = new MessageChannel();
const antreanImm = [];
kanal.port1.onmessage = () => {
  const f = antreanImm.shift();
  if (f) f();
};
export function setImmediate(cb, ...args) {
  const id = nomor++;
  const t = new Timeout(id);
  tahan();
  daftar.set(id, { h: null, t, jenis: 'm' });
  antreanImm.push(() => {
    if (!daftar.has(id)) return;
    daftar.delete(id);
    if (t._ref) lepas();
    jalankan(cb, args);
    st.onCek && st.onCek();
  });
  kanal.port2.postMessage(0);
  return t;
}
export function clearImmediate(t) {
  const id = t && typeof t === 'object' ? t._id : t;
  const d = daftar.get(id);
  if (!d) return;
  daftar.delete(id);
  if (d.t._ref) lepas();
}
export function hentikanSemua() {
  for (const [id, d] of daftar) { if (d.jenis === 'i') asliClearI(d.h); else if (d.h) asliClear(d.h); daftar.delete(id); }
}
export const promises = {
  setTimeout: (ms, nilai) => new Promise((r) => setTimeout(() => r(nilai), ms)),
  setImmediate: (nilai) => new Promise((r) => setImmediate(() => r(nilai))),
  async *setInterval(ms, nilai) { while (true) { await promises.setTimeout(ms); yield nilai; } },
};
export default { setTimeout, setInterval, clearTimeout, clearInterval, setImmediate, clearImmediate, promises };
