import vm from 'node:vm';
import { workerCode } from '../../lib/jsRunner';

/**
 * Menjalankan JavaScript dengan kode Web Worker yang SAMA dengan di browser (jsRunner.workerCode),
 * di dalam konteks vm Node. Format console.log, server latihan https://api.toko.contoh, dan penanganan
 * error-nya identik dengan yang dilihat pengguna. Kode multi-file (import antar-file) diratakan dulu dengan
 * ratakanModulJs.
 */
export function jalankanSepertiWorker(js: string, batasMs = 8000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const ctx: any = {
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      Headers,
      URL,
      structuredClone,
    };
    ctx.self = ctx;
    const timer = setTimeout(() => reject(new Error('waktu habis')), batasMs);
    ctx.postMessage = (m: any) => {
      clearTimeout(timer);
      resolve({ stdout: m.stdout, stderr: m.stderr, exitCode: m.exitCode });
    };
    ctx.addEventListener = (jenis: string, fn: any) => {
      if (jenis === 'unhandledrejection') process.on('unhandledRejection', (reason) => fn({ reason, preventDefault() {} }));
    };
    vm.createContext(ctx);
    vm.runInContext(workerCode, ctx);
    ctx.onmessage({ data: { code: js } });
  });
}

/**
 * Ratakan JavaScript multi-file (penanda `// === nama.js ===`, hasil tsPeriksa) menjadi satu skrip untuk vm:
 * import dan export dibuang, file dijalankan berurutan seperti urutan pemuatan module. Hanya untuk test.
 */
export function ratakanModulJs(js: string): string {
  if (!js.startsWith('// === ')) return js;
  return js
    .split(/^\/\/ === [\w./-]+\.js ===$/m)
    .map((b) =>
      b
        .replace(/^\s*import\s[^;]*?from\s*['"][^'"]+['"];?\s*$/gm, '')
        .replace(/^\s*import\s*['"][^'"]+['"];?\s*$/gm, '')
        .replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, '')
        .replace(/^(\s*)export\s+(default\s+)?(?=(async\s+)?(const|let|var|function|class|abstract|enum)\b)/gm, '$1')
    )
    .join('\n');
}
