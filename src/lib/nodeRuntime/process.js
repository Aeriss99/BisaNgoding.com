// process tiruan: cukup untuk materi kelas Node.js. Nilai yang tampil di materi disamakan dengan laptop contoh.
import { EventEmitter } from 'events';
import { tulisKeluar, tulisGalat, jadwalTick, catatKeluar } from './inti.js';

export const CWD = '/home/sari/proyek';
const proc = new EventEmitter();
let cwd = CWD;
Object.assign(proc, {
  title: 'node',
  version: 'v26.13.0',
  versions: { node: '26.13.0', v8: '14.6.202.33-node.18', uv: '1.51.0', modules: '147' },
  arch: 'x64',
  platform: 'linux',
  pid: 4821,
  ppid: 4790,
  execPath: '/usr/local/bin/node',
  argv: ['/usr/local/bin/node', CWD + '/main.js'],
  execArgv: [],
  env: {},
  exitCode: undefined,
  release: { name: 'node', lts: 'Lithium' },
  cwd: () => cwd,
  chdir: (d) => { cwd = d.startsWith('/') ? d : cwd + '/' + d; },
  nextTick: (cb, ...a) => jadwalTick(() => cb(...a)),
  hrtime: Object.assign((prev) => {
    const t = performance.now();
    const s = Math.floor(t / 1000), ns = Math.floor((t % 1000) * 1e6);
    if (!prev) return [s, ns];
    let ds = s - prev[0], dn = ns - prev[1];
    if (dn < 0) { ds--; dn += 1e9; }
    return [ds, dn];
  }, { bigint: () => BigInt(Math.floor(performance.now() * 1e6)) }),
  uptime: () => performance.now() / 1000,
  memoryUsage: Object.assign(() => ({ rss: 45678592, heapTotal: 6029312, heapUsed: 4512344, external: 1621234, arrayBuffers: 10515 }), { rss: () => 45678592 }),
  cpuUsage: () => ({ user: 31000, system: 12000 }),
  emitWarning: (w) => tulisGalat('(node:4821) Warning: ' + (w && w.message ? w.message : w) + '\n'),
  exit: (code) => { catatKeluar(code === undefined ? proc.exitCode ?? 0 : code); },
  abort: () => { catatKeluar(134); },
  stdout: { write: (s) => { tulisKeluar(String(s)); return true; }, isTTY: false, columns: 80, on() {}, once() {} },
  stderr: { write: (s) => { tulisGalat(String(s)); return true; }, isTTY: false, on() {}, once() {} },
  stdin: { isTTY: false, on() {}, once() {}, resume() {}, pause() {}, setEncoding() {} },
  umask: () => 0o22,
  getuid: () => 1000,
  getgid: () => 1000,
  features: {},
  config: {},
  binding() { throw new Error('No such module'); },
  loadEnvFile: (p = '.env') => { muatEnv(p); },
});
export default proc;

let bacaFile = null;
export function pasangPembacaFile(f) { bacaFile = f; }
function muatEnv(p) {
  const isi = bacaFile(p);
  for (const baris of isi.split(/\r?\n/)) {
    const m = baris.match(/^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!m) continue;
    let v = (m[2] || '').trim();
    const q = v[0];
    if ((q === '"' || q === "'" || q === '`') && v.endsWith(q) && v.length > 1) {
      v = v.slice(1, -1);
      if (q === '"') v = v.replace(/\\n/g, '\n');
    } else {
      const i = v.indexOf(' #');
      if (i >= 0) v = v.slice(0, i).trim();
      if (v.startsWith('#')) v = '';
    }
    if (!(m[1] in proc.env)) proc.env[m[1]] = v;
  }
}
export const ENV_BAWAAN = { HOME: '/home/sari', USER: 'sari', LOGNAME: 'sari', SHELL: '/bin/bash', LANG: 'id_ID.UTF-8', PATH: '/usr/local/bin:/usr/bin:/bin', PWD: CWD };
export function aturUlangProcess(env) {
  cwd = CWD;
  proc.env = { ...ENV_BAWAAN, ...env };
  proc.exitCode = undefined;
  proc.argv = ['/usr/local/bin/node', CWD + '/main.js'];
  proc.removeAllListeners();
}
