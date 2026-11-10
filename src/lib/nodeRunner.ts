import type { RunResult } from './javaRunner';
import { rapikanKetikan } from './ketikan';

/**
 * Menjalankan kode kelas Node.js di Web Worker dengan runtime Node tiruan (src/lib/nodeRuntime):
 * fs di memori, http dengan port tiruan (fetch ke localhost), express, zod, dan modul bawaan lain.
 * Setiap kali jalan memakai worker baru supaya tidak ada sisa dari program sebelumnya.
 */
const BATAS_MS = 8000;
let pernahDimuat = false;

export async function runNodeCode(kode: string, onStatus?: (s: string) => void): Promise<RunResult> {
  if (onStatus) onStatus(pernahDimuat ? 'Menjalankan Node.js' : 'Memuat Node.js (sekali saja)');
  const worker = new Worker(new URL('./nodeWorker.ts', import.meta.url), { type: 'module' });
  try {
    return await new Promise<RunResult>((resolve) => {
      const batas = setTimeout(() => {
        resolve({ stdout: '', stderr: 'Program terlalu lama berjalan (lebih dari 5 detik). Ada perulangan yang tidak berhenti?', exitCode: 1, timedOut: true });
      }, BATAS_MS);
      worker.onmessage = (e) => {
        clearTimeout(batas);
        pernahDimuat = true;
        if (e.data.gagal) resolve({ stdout: '', stderr: e.data.gagal, exitCode: 1 });
        else resolve({ stdout: e.data.stdout, stderr: e.data.stderr, exitCode: e.data.exitCode });
      };
      worker.onerror = (e) => {
        clearTimeout(batas);
        resolve({ stdout: '', stderr: e.message || 'Runtime Node.js gagal dimuat', exitCode: 1 });
      };
      worker.postMessage({ id: 1, kode: rapikanKetikan(kode) });
    });
  } finally {
    worker.terminate();
  }
}

/** Teks keluaran untuk ditampilkan: stdout lalu stderr, seperti terminal. */
export function gabungKeluaranNode(r: RunResult): string {
  return (r.stdout || '') + (r.stderr ? (r.stdout && !r.stdout.endsWith('\n') ? '\n' : '') + r.stderr : '');
}
