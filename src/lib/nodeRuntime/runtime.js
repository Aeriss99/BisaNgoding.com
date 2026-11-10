// Runtime Node.js tiruan untuk editor kelas Node.js (berjalan di Web Worker).
// Kode pengguna (ESM atau CommonJS, boleh beberapa file "// === nama ===") dijalankan dengan modul bawaan tiruan:
// fs (memfs), path, events, stream, http (server di port tiruan + fetch localhost), crypto, os, url, util, timers,
// serta paket npm express dan zod. Keluaran console memakai util.inspect versi Node.
import { Buffer } from 'buffer';
import { tambalBuffer } from './tambalBuffer.js';
import * as eventsMod from 'events';
import * as pathMod from 'path-browserify';
import * as streamMod from 'readable-stream';
import * as sdMod from 'string_decoder';
import * as qsMod from 'querystring-es3';
import express from 'express';
import * as zodMod from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { st, tulisKeluar, tulisGalat, KeluarProses, adaTick, bersihkanTick } from './inti.js';
import proc, { aturUlangProcess, pasangPembacaFile, CWD } from './process.js';
import * as timers from './timers.js';
import * as httpMod from './http.js';
import { fs, aturUlangFs } from './fs.js';
import * as cryptoMod from './crypto.js';
import * as osMod from './os.js';
import * as urlMod from './url.js';
import * as utilMod from './util.js';
import * as netMod from './net.js';
import * as ahMod from './asyncHooks.js';
import * as spMod from './streamPromises.js';
import * as rlMod from './readline.js';
import { inspect, format } from 'node-inspect-extracted';

tambalBuffer(Buffer);
const ev = eventsMod.default || eventsMod;
const pth = pathMod.default || pathMod;
const stream = streamMod.default || streamMod;
const fsp = fs.promises;

// [nilai default, nama-nama export]
function m(def, ns) { return { def, ns: ns || def }; }
const BAWAAN = {
  fs: m(fs, { ...fs, promises: fsp, constants: fs.constants }), 'fs/promises': m(fsp), path: m(pth), 'path/posix': m(pth), events: m(ev), stream: m(stream, { ...streamMod, promises: spMod }),
  'stream/promises': m(spMod), http: m(httpMod.default, httpMod), https: m(httpMod.default, httpMod),
  crypto: m(cryptoMod.default, cryptoMod), os: m(osMod.default, osMod), url: m(urlMod.default, urlMod),
  util: m(utilMod.default, utilMod), net: m(netMod.default, netMod), async_hooks: m(ahMod.default, ahMod),
  timers: m(timers.default, timers), 'timers/promises': m(timers.promises), process: m(proc), buffer: m({ Buffer }, { Buffer }),
  string_decoder: m(sdMod.default || sdMod), querystring: m(qsMod.default || qsMod), readline: m(rlMod.default, rlMod),
};
const PAKET = { express: m(express), zod: m(zodMod, zodMod), bcryptjs: m(bcrypt), jsonwebtoken: m(jwt) };
function cariModul(spes) {
  const nama = spes.startsWith('node:') ? spes.slice(5) : spes;
  if (BAWAAN[nama]) return BAWAAN[nama];
  if (!spes.startsWith('node:') && PAKET[spes]) return PAKET[spes];
  const e = new Error(spes.startsWith('node:') || !/^[@a-z]/.test(spes)
    ? `No such built-in module: ${spes}`
    : `Cannot find package '${spes}' imported from ${CWD}/main.js`);
  e.code = spes.startsWith('node:') ? 'ERR_UNKNOWN_BUILTIN_MODULE' : 'ERR_MODULE_NOT_FOUND';
  throw e;
}
self.__nodeModul = (spes) => cariModul(spes);

// ── console versi Node ──────────────────────────────────────────────
const hitung = new Map();
const waktu = new Map();
let indent = '';
const tulis = (fn) => (...a) => fn(indentasi(format(...a)) + '\n');
const indentasi = (s) => (indent ? s.split('\n').map((x) => indent + x).join('\n') : s);
const konsol = {
  log: tulis(tulisKeluar), info: tulis(tulisKeluar), debug: tulis(tulisKeluar),
  error: tulis(tulisGalat), warn: tulis(tulisGalat), trace: tulis(tulisGalat),
  dir: (o, opsi) => tulisKeluar(indentasi(inspect(o, opsi)) + '\n'),
  group: (...a) => { if (a.length) konsol.log(...a); indent += '  '; }, groupEnd: () => { indent = indent.slice(2); },
  count: (l = 'default') => { const n = (hitung.get(l) || 0) + 1; hitung.set(l, n); konsol.log(`${l}: ${n}`); },
  countReset: (l = 'default') => hitung.delete(l),
  time: (l = 'default') => waktu.set(l, performance.now()),
  timeEnd: (l = 'default') => { const t = waktu.get(l); waktu.delete(l); konsol.log(`${l}: ${(performance.now() - t).toFixed(3)}ms`); },
  timeLog: (l = 'default', ...a) => konsol.log(`${l}: ${(performance.now() - waktu.get(l)).toFixed(3)}ms`, ...a),
  assert: (c, ...a) => { if (!c) konsol.error('Assertion failed' + (a.length ? ': ' + format(...a) : '')); },
  table: (d) => konsol.log(d),
};
konsol.groupCollapsed = konsol.group;

// ── fetch: localhost diarahkan ke server tiruan ─────────────────────
async function fetchNode(input, init = {}) {
  const req = input instanceof Request ? input : null;
  const url = new URL(req ? req.url : String(input));
  if (req) init = { method: req.method, headers: req.headers, body: req.body ? await req.text() : undefined, ...init };
  if (!lokal(url)) gagalDns(url);
  let r = await httpMod.kirimKeServer(url, init);
  let kini = url, belok = false, n = 0;
  const mode = init.redirect || 'follow';
  while ([301, 302, 303, 307, 308].includes(r.status) && r.headers.has('location') && mode !== 'manual') {
    if (mode === 'error') throw Object.assign(new TypeError('fetch failed'), { cause: new Error('unexpected redirect') });
    if (++n > 20) throw Object.assign(new TypeError('fetch failed'), { cause: new Error('redirect count exceeded') });
    kini = new URL(r.headers.get('location'), kini);
    if (!lokal(kini)) gagalDns(kini);
    const metode = String(init.method || 'GET').toUpperCase();
    if ((r.status === 303 && metode !== 'HEAD') || ([301, 302].includes(r.status) && metode === 'POST')) {
      const h = new Headers(init.headers || {});
      for (const k of ['content-type', 'content-length', 'content-encoding', 'content-language', 'content-location']) h.delete(k);
      init = { ...init, method: 'GET', body: undefined, headers: h };
    }
    r = await httpMod.kirimKeServer(kini, init);
    belok = true;
  }
  Object.defineProperty(r, 'url', { value: kini.href });
  Object.defineProperty(r, 'redirected', { value: belok });
  return r;
}
function lokal(url) { return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname); }
function gagalDns(url) {
  const sebab = new Error(`getaddrinfo ENOTFOUND ${url.hostname}`);
  sebab.code = 'ENOTFOUND'; sebab.errno = -3008; sebab.syscall = 'getaddrinfo'; sebab.hostname = url.hostname;
  throw Object.assign(new TypeError('fetch failed'), { cause: sebab });
}

// ── memecah kode menjadi file ───────────────────────────────────────
const POLA_FILE = /^\/\/ === ([\w.\/-]+) ===[ \t]*$/m;
export function pecahFile(kode) {
  if (!POLA_FILE.test(kode)) return { files: { 'main.js': kode }, utama: 'main.js' };
  const files = {};
  let nama = null, isi = [];
  const simpan = () => { if (nama !== null) files[nama] = isi.join('\n').replace(/\n+$/, '') + '\n'; };
  for (const b of kode.split('\n')) {
    const x = b.match(/^\/\/ === ([\w.\/-]+) ===[ \t]*$/);
    if (x) { simpan(); nama = x[1]; isi = []; } else if (nama !== null) isi.push(b);
  }
  simpan();
  const js = Object.keys(files).filter((f) => /\.(m|c)?js$/.test(f));
  const utama = ['main.js', 'main.mjs', 'index.js', 'app.js', 'server.js'].find((f) => files[f] !== undefined) || js[js.length - 1];
  return { files, utama };
}

const namaUrl = new Map();
const urlModul = (src, nama) => {
  const u = globalThis.__pakaiDataUrl ? 'data:text/javascript;base64,' + Buffer.from(src).toString('base64') : URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
  if (nama) namaUrl.set(u, nama);
  return u;
};
// alamat blob/data di pesan error diganti nama file seperti di Node ('./menu.js')
const gantiUrl = (t) => (namaUrl.size ? t.replace(/(blob:[^\s'")]+|data:text\/javascript;base64,[A-Za-z0-9+/=]+)/g, (u) => namaUrl.get(u) || u) : t);
const CADANGAN = new Set('default static package private protected public implements interface let yield await enum class const function var new delete typeof void in instanceof this super import export extends return if else for while do switch case break continue throw try catch finally with debugger null true false arguments eval'.split(' '));
// ditulis lewat RegExp supaya Vite tidak mengira modul ini memakai meta-impor milik Vite
// import() dinamis lewat Function supaya bundler tidak membungkusnya (alamat blob/data dibuat saat jalan)
const imporUrl = new Function('u', 'return import(u)');
const META = (k) => new RegExp('\\bimport\\s*\\.\\s*meta\\s*\\.\\s*' + k + '\\b', 'g');
const POLA_ESM = /^[ \t]*(import\s*[\w{*'"]|export\s)/m;
// seperti deteksi sintaks Node 22+: file tanpa import/export tapi gagal dibaca sebagai CommonJS karena
// top-level await atau import.meta dianggap ES Module
function esm(src) {
  if (POLA_ESM.test(src)) return true;
  try { new Function(src); return false; } catch (e) { return e instanceof SyntaxError && /\bawait\b|\bimport\s*\.\s*meta\b/.test(src); }
}
const resolve = (dari, spes) => pth.normalize(pth.join(pth.dirname(dari), spes));

function jalankanCjs(files, nama, cache) {
  if (cache[nama]) return cache[nama].exports;
  const mod = { exports: {}, filename: CWD + '/' + nama, id: nama };
  cache[nama] = mod;
  if (nama.endsWith('.json')) { mod.exports = JSON.parse(files[nama]); return mod.exports; }
  const req = (spes) => {
    if (spes.startsWith('./') || spes.startsWith('../')) {
      let t = resolve(nama, spes);
      if (files[t] === undefined) t = ['.js', '.cjs', '.json', '/index.js'].map((e) => t + e).find((x) => files[x] !== undefined) || t;
      if (files[t] === undefined) { const e = new Error(`Cannot find module '${spes}'`); e.code = 'MODULE_NOT_FOUND'; throw e; }
      return jalankanCjs(files, t, cache);
    }
    return cariModul(spes).def;
  };
  const fn = new Function('exports', 'require', 'module', '__filename', '__dirname', files[nama] + '\n//# sourceURL=' + nama);
  fn.call(mod.exports, mod.exports, req, mod, CWD + '/' + nama, pth.dirname(CWD + '/' + nama));
  return mod.exports;
}

async function jalankanEsm(files, utama) {
  const url = {};
  const cacheCjs = {};
  const bawaan = {};
  function blobBawaan(spes) {
    if (bawaan[spes]) return bawaan[spes];
    const x = cariModul(spes);
    const nama = Object.keys(x.ns).filter((k) => /^[A-Za-z_$][\w$]*$/.test(k) && !CADANGAN.has(k));
    const src = `const m = self.__nodeModul(${JSON.stringify(spes)});\nexport default m.def;\n` +
      (nama.length ? `export const { ${nama.join(', ')} } = m.ns;\n` : '');
    return (bawaan[spes] = urlModul(src, spes));
  }
  function buat(nama, jalur = []) {
    if (url[nama]) return url[nama];
    if (jalur.includes(nama)) throw new Error('Circular import (' + [...jalur, nama].join(' -> ') + ') tidak didukung di editor ini');
    const ganti = (spes) => {
      if (/^\.\.?\//.test(spes)) {
        const t = resolve(nama, spes);
        if (files[t] === undefined) { const e = new Error(`Cannot find module '${CWD}/${t}' imported from ${CWD}/${nama}`); e.code = 'ERR_MODULE_NOT_FOUND'; throw e; }
        if (t.endsWith('.json')) {
          return urlModul('export default ' + files[t]);
        }
        if (t.endsWith('.cjs') || (t.endsWith('.js') && !esm(files[t]))) {
          // modul CommonJS diimpor dari ESM: default = module.exports, nama = kunci-kuncinya
          const ex = jalankanCjs(files, t, cacheCjs);
          const nama = ex && typeof ex === 'object' ? Object.keys(ex).filter((k) => /^[A-Za-z_$][\w$]*$/.test(k) && !CADANGAN.has(k)) : [];
          self.__cjsEkspor = self.__cjsEkspor || {};
          self.__cjsEkspor[t] = ex;
          return urlModul(`const m = self.__cjsEkspor[${JSON.stringify(t)}];\nexport default m;\n` + (nama.length ? `export const { ${nama.join(', ')} } = m;\n` : ''));
        }
        return buat(t, [...jalur, nama]);
      }
      return blobBawaan(spes);
    };
    const dir = pth.dirname(CWD + '/' + nama);
    let src = files[nama]
      .replace(META('dirname'), JSON.stringify(dir))
      .replace(META('filename'), JSON.stringify(CWD + '/' + nama))
      .replace(META('url'), JSON.stringify('file://' + CWD + '/' + nama))
      .replace(/(\bfrom\s*)(["'])([^"']+)\2(\s*with\s*\{[^}]*\})?/g, (_, a, q, s) => a + q + ganti(s) + q)
      .replace(/(^|[;\s])import(\s*)(["'])([^"']+)\3/g, (_, a, sp, q, s) => a + 'import' + sp + q + ganti(s) + q)
      .replace(/\bimport\s*\(/g, '__imporNode(');
    if (/__imporNode\(/.test(src)) src = `const __imporNode = (s) => self.__imporNode(${JSON.stringify(nama)}, s);\n` + src;
    const u = urlModul(src + '\n//# sourceURL=' + nama, './' + nama);
    return (url[nama] = u);
  }
  self.__imporNode = async (dari, spes) => {
    if (/^\.\.?\//.test(spes)) return imporUrl(buat(resolve(dari, spes)));
    return imporUrl(blobBawaan(spes));
  };
  await imporUrl(buat(utama));
}

function tulisUncaught(e) {
  if (e instanceof KeluarProses) return;
  const teks = gantiUrl(e instanceof Error ? (e.stack && e.stack.startsWith(e.name) ? e.name + ': ' + e.message : inspect(e)) : 'Uncaught ' + inspect(e));
  let tambahan = '';
  if (e && typeof e === 'object') {
    const extra = Object.keys(e).filter((k) => k !== 'stack' && k !== 'message');
    if (extra.length) tambahan = ' ' + inspect(Object.fromEntries(extra.map((k) => [k, e[k]])));
  }
  tulisGalat(teks + tambahan + '\n\nNode.js ' + proc.version + '\n');
  if (st.keluar === null) st.keluar = 1;
  st.onCek && st.onCek();
}

let siap = false;
function pasangGlobal() {
  if (siap) return;
  siap = true;
  Object.assign(globalThis, {
    process: proc, Buffer, global: globalThis,
    setTimeout: timers.setTimeout, setInterval: timers.setInterval, clearTimeout: timers.clearTimeout,
    clearInterval: timers.clearInterval, setImmediate: timers.setImmediate, clearImmediate: timers.clearImmediate,
    fetch: fetchNode,
  });
  globalThis.console = konsol;
  st.onGalat = tulisUncaught;
  if (self.addEventListener) self.addEventListener('unhandledrejection', (ev) => { ev.preventDefault(); tulisUncaught(ev.reason); });
  if (self.addEventListener) self.addEventListener('error', (ev) => { ev.preventDefault(); tulisUncaught(ev.error); });
  pasangPembacaFile((p) => {
    try { return fs.readFileSync(p, 'utf8'); }
    catch { const e = new Error(`ENOENT: no such file or directory, open '${p}'`); e.code = 'ENOENT'; throw e; }
  });
}

export async function jalankanNode(kode, { batasMs = 5000, env = {}, argv = [] } = {}) {
  pasangGlobal();
  st.out = ''; st.err = ''; st.keluar = null; st.hidup = 0; st.kodeSelesai = false;
  namaUrl.clear();
  bersihkanTick();
  hitung.clear(); waktu.clear(); indent = '';
  aturUlangProcess(env);
  const { files, utama } = pecahFile(kode);
  proc.argv = ['/usr/local/bin/node', CWD + '/' + utama, ...argv];
  aturUlangFs(files, CWD);
  return new Promise((selesai) => {
    let beres = false, cekId = null;
    const akhiri = (tambahan) => {
      if (beres) return;
      beres = true;
      globalThis.__asliClearTimeout(batas);
      if (tambahan) tulisGalat(tambahan);
      httpMod.tutupSemua(); timers.hentikanSemua();
      st.onCek = null;
      const kode = st.keluar !== null ? st.keluar : (proc.exitCode ?? 0);
      if (st.keluar === null) proc.emit('exit', kode);
      const namaFile = Object.keys(files);
      const err = st.err.split('\n').filter((b) => !/^\s+at /.test(b) || namaFile.some((f) => b.includes(f + ':'))).join('\n');
      selesai({ stdout: st.out, stderr: err, exitCode: kode });
    };
    st.onCek = () => {
      if (beres) return;
      if (st.keluar !== null) { queueMicrotask(() => akhiri()); return; }
      if (!st.kodeSelesai || st.hidup > 0 || adaTick()) return;
      if (cekId !== null) return;
      cekId = 1;
      (async () => {
        for (let i = 0; i < 20; i++) await null; // habiskan microtask
        cekId = null;
        if (st.kodeSelesai && st.hidup <= 0 && !adaTick()) {
          proc.emit('beforeExit', proc.exitCode ?? 0);
          if (st.hidup <= 0) akhiri();
        }
      })();
    };
    const batas = globalThis.__asliSetTimeout(() => akhiri(`\n[dihentikan: program masih berjalan setelah ${batasMs / 1000} detik. Lupa server.close() atau clearInterval()?]\n`), batasMs);
    const mulai = async () => {
      try {
        if (!utama.endsWith('.cjs') && (esm(files[utama]) || utama.endsWith('.mjs'))) await jalankanEsm(files, utama);
        else jalankanCjs(files, utama, {});
      } catch (e) { tulisUncaught(e); }
      st.kodeSelesai = true;
      st.onCek();
    };
    mulai();
  });
}
globalThis.__asliSetTimeout = globalThis.setTimeout.bind(globalThis);
globalThis.__asliClearTimeout = globalThis.clearTimeout.bind(globalThis);
