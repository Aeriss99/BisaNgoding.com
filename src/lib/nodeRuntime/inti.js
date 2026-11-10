// Inti runtime: keluaran, pelacak pekerjaan yang masih hidup (seperti event loop Node), dan antrean tick.
// Disimpan di globalThis: saat dev, paket npm yang di-prebundle Vite membawa salinan modul ini sendiri.
export const st = (globalThis.__nodeSt ??= { out: '', err: '', keluar: null, hidup: 0, kodeSelesai: false, onCek: null });
export function tulisKeluar(s) { st.out += s; }
export function tulisGalat(s) { st.err += s; }
export class KeluarProses extends Error { constructor(code) { super('process.exit'); this.code = code; } }
export function catatKeluar(code) {
  if (st.keluar === null) st.keluar = code;
  st.onCek && st.onCek();
  throw new KeluarProses(code);
}
// pekerjaan yang membuat proses tetap hidup (timer, server listening, fetch berjalan)
export function tahan() { st.hidup++; }
export function lepas() { st.hidup--; st.onCek && st.onCek(); }
// process.nextTick: di modul ES Node, antrean tick baru dijalankan setelah antrean Promise habis.
// Di sini lewat MessageChannel (setelah microtask, sebelum setImmediate/timer yang dijadwalkan sesudahnya).
const kanalTick = new MessageChannel();
const ticks = [];
let tickTerjadwal = false;
export function jadwalTick(fn) {
  ticks.push(fn);
  if (!tickTerjadwal) {
    tickTerjadwal = true;
    kanalTick.port2.postMessage(0);
  }
}
kanalTick.port1.onmessage = () => jalankanTick();
function jalankanTick() {
  tickTerjadwal = false;
  while (ticks.length) {
    const f = ticks.shift();
    try { f(); } catch (e) { st.onGalat && st.onGalat(e); }
  }
  st.onCek && st.onCek();
}
export const adaTick = () => ticks.length > 0;
export function bersihkanTick() { ticks.length = 0; }
