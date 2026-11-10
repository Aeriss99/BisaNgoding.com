import type { RunResult } from './javaRunner';
import { runJsCode } from './jsRunner';
import { rapikanKetikan } from './ketikan';

/**
 * Menjalankan TypeScript seperti `tsc && node`: kode diperiksa dulu oleh compiler TypeScript resmi
 * (mode strict) di Web Worker. Kalau ada error tipe, program TIDAK dijalankan dan pesan error tsc
 * ditampilkan. Kalau lolos, JavaScript hasil compile dijalankan oleh jsRunner.
 */
const BATAS_MUAT_MS = 90000;

let worker: Worker | null = null;
let idBerikut = 0;
const menunggu = new Map<number, (data: any) => void>();

function ambilWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./tsWorker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => {
    const selesai = menunggu.get(e.data.id);
    if (selesai) {
      menunggu.delete(e.data.id);
      selesai(e.data);
    }
  };
  worker.onerror = (e) => {
    for (const selesai of menunggu.values()) selesai({ gagal: e.message || 'Compiler TypeScript gagal dimuat' });
    menunggu.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

export interface HasilCekTs {
  galat: string[];
  kodeGalat: number[];
  js: string;
}

let sudahDimuat = false;

/** Periksa tipe dan compile kode TypeScript tanpa menjalankannya. */
export function periksaTs(kode: string, onStatus?: (s: string) => void): Promise<HasilCekTs> {
  if (onStatus) onStatus(sudahDimuat ? 'Memeriksa tipe' : 'Memuat TypeScript (sekali saja)');
  const w = ambilWorker();
  const id = ++idBerikut;
  return new Promise((resolve, reject) => {
    const batas = setTimeout(() => {
      menunggu.delete(id);
      reject(new Error('Compiler TypeScript terlalu lama dimuat'));
    }, BATAS_MUAT_MS);
    menunggu.set(id, (data) => {
      clearTimeout(batas);
      if (data.gagal) {
        reject(new Error(data.gagal));
        return;
      }
      sudahDimuat = true;
      resolve({ galat: data.galat, kodeGalat: data.kodeGalat, js: data.js });
    });
    w.postMessage({ id, kode: rapikanKetikan(kode) });
  });
}

/** Seperti runJsCode, tapi untuk TypeScript: error tipe = program tidak dijalankan (exitCode 2, seperti tsc). */
export async function runTsCode(kode: string, onStatus?: (s: string) => void): Promise<RunResult & { kodeGalat?: number[] }> {
  const cek = await periksaTs(kode, onStatus);
  if (cek.galat.length > 0) {
    return { stdout: '', stderr: cek.galat.join('\n'), exitCode: 2, kodeGalat: cek.kodeGalat };
  }
  if (onStatus) onStatus('Menjalankan');
  return runJsCode(cek.js, undefined, onStatus);
}
