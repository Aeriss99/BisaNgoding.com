import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { rolldown } from 'rolldown';
// @ts-expect-error modul .mjs tanpa tipe
import { pluginNodeVite } from '../../lib/nodeRuntime/peta.mjs';

export type HasilNode = { stdout: string; stderr: string; exitCode: number };

const PENJALAN = `
const asli = process;
globalThis.self = globalThis;
globalThis.__pakaiDataUrl = true;
const dir = asli.argv[2];
await import(dir + '/global.mjs');
const { jalankanNode } = await import(dir + '/runtime.mjs');
let isi = '';
for await (const c of asli.stdin) isi += c;
const hasil = [];
for (const kode of JSON.parse(isi)) hasil.push(await jalankanNode(kode, { batasMs: 8000 }));
asli.stdout.write(JSON.stringify(hasil));
asli.exit(0);
`;

/**
 * Membundel runtime Node tiruan (src/lib/nodeRuntime) dengan peta modul yang sama seperti worker di browser,
 * lalu mengembalikan fungsi yang menjalankan banyak kode sekaligus di proses Node terpisah.
 */
export async function siapkanNodeTiruan(): Promise<(kode: string[]) => HasilNode[]> {
  const akar = path.resolve(__dirname, '../../..');
  const R = path.join(akar, 'src/lib/nodeRuntime');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'node-tiruan-'));
  const b = await rolldown({
    input: { global: path.join(R, 'global.js'), runtime: path.join(R, 'runtime.js') },
    plugins: [pluginNodeVite(akar)],
    platform: 'browser',
    logLevel: 'silent',
  });
  await b.write({ dir, format: 'esm', entryFileNames: '[name].mjs', chunkFileNames: 'bersama-[hash].mjs' });
  await b.close();
  fs.writeFileSync(path.join(dir, 'jalan.mjs'), PENJALAN);
  return (kode) => {
    const r = spawnSync(process.execPath, [path.join(dir, 'jalan.mjs'), dir], { input: JSON.stringify(kode), maxBuffer: 1 << 28, timeout: 600_000 });
    if (r.status !== 0) throw new Error('runtime Node tiruan gagal: ' + String(r.stderr).slice(-2000));
    return JSON.parse(String(r.stdout));
  };
}
