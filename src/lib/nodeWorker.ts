// Web Worker kelas Node.js: menjalankan kode dengan runtime Node tiruan (lihat src/lib/nodeRuntime).
import './nodeRuntime/global.js';
// @ts-expect-error modul JavaScript tanpa deklarasi tipe
import { jalankanNode } from './nodeRuntime/runtime.js';

let sibuk = false;
self.onmessage = async (e: MessageEvent<{ id: number; kode: string }>) => {
  const { id, kode } = e.data;
  if (sibuk) {
    self.postMessage({ id, gagal: 'Runtime sedang dipakai' });
    return;
  }
  sibuk = true;
  try {
    const hasil = await jalankanNode(kode, { batasMs: 5000 });
    self.postMessage({ id, ...hasil });
  } catch (err) {
    self.postMessage({ id, gagal: err instanceof Error ? err.message : String(err) });
  } finally {
    sibuk = false;
  }
};
