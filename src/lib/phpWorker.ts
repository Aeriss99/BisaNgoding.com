/// <reference lib="webworker" />
import { loadPHPRuntime, PHP, PHPResponse, setPhpIniEntries } from '@php-wasm/universal';
// Build PHP 8.3 (asyncify, jalan di semua browser modern). Path diarahkan alias di vite.config.ts.
import * as pemuat from 'php-wasm-8-3';

/**
 * Web Worker yang menjalankan PHP 8.3 asli (WebAssembly, paket @php-wasm dari WordPress Playground).
 * Dimuat sekali, lalu setiap kode dijalankan sebagai permintaan baru (variabel tidak terbawa).
 */
let php: Promise<PHP> | null = null;

function siapkan(): Promise<PHP> {
  if (!php) {
    php = (async () => {
      const id = await loadPHPRuntime(pemuat, { processId: 1, phpWasmAsyncMode: 'asyncify' } as never);
      const p = new PHP(id);
      await setPhpIniEntries(p, {
        html_errors: '0',
        display_errors: '1',
        log_errors: '0',
        error_reporting: String(32767),
        'date.timezone': 'Asia/Jakarta',
      });
      return p;
    })();
  }
  return php;
}

self.onmessage = async (e: MessageEvent<{ id: number; kode: string }>) => {
  const { id, kode } = e.data;
  try {
    const p = await siapkan();
    const hasil = await PHPResponse.fromStreamedResponse(await p.runStream({ code: kode }));
    self.postMessage({ id, teks: hasil.text, exitCode: hasil.exitCode });
  } catch (err) {
    self.postMessage({ id, gagal: err instanceof Error ? err.message : String(err) });
  }
};
