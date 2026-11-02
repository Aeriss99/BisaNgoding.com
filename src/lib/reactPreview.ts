/**
 * Pratinjau kelas React.
 *
 * Kode JSX pengguna diubah menjadi JavaScript biasa di halaman utama dengan sucrase (dimuat saat
 * pertama dipakai), lalu dijalankan di iframe sandbox (allow-scripts tanpa allow-same-origin),
 * jadi kode pengguna tidak bisa menyentuh halaman BisaNgoding. React, ReactDOM, dan React Router
 * versi development disisipkan langsung ke dokumen iframe dari src/vendor/pratinjau-react.js,
 * sehingga pratinjau jalan offline dan peringatan React (misalnya key) terbaca di konsol.
 *
 * Yang bisa di-import kode pengguna: react, react-dom/client, react-router-dom (atau react-router).
 * Komponen yang di-`export default` otomatis ditampilkan di <div id="root">.
 */

export type HasilUbah = { ok: true; js: string } | { ok: false; galat: string };

/** Baris konsol dari iframe pratinjau. */
export interface PesanKonsol {
  sumber: 'bn-react';
  jenis: 'log' | 'warn' | 'error';
  teks: string;
}

/** Isi localStorage tiruan berubah. Halaman utama menyimpannya supaya tetap ada setelah "Jalankan ulang". */
export interface PesanSimpan {
  sumber: 'bn-react';
  jenis: 'simpan';
  data: Record<string, string>;
}

export function bacaPesan(d: unknown): PesanKonsol | PesanSimpan | null {
  if (!d || typeof d !== 'object' || (d as { sumber?: unknown }).sumber !== 'bn-react') return null;
  const p = d as { jenis?: unknown; teks?: unknown; data?: unknown };
  if (p.jenis === 'simpan') {
    if (!p.data || typeof p.data !== 'object') return null;
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(p.data as Record<string, unknown>)) if (typeof v === 'string') data[k] = v.slice(0, 100000);
    return { sumber: 'bn-react', jenis: 'simpan', data };
  }
  if ((p.jenis === 'log' || p.jenis === 'warn' || p.jenis === 'error') && typeof p.teks === 'string') {
    return { sumber: 'bn-react', jenis: p.jenis as PesanKonsol['jenis'], teks: p.teks.slice(0, 2000) };
  }
  return null;
}

export const MODUL_TERSEDIA = ['react', 'react-dom/client', 'react-router-dom'];

type Sucrase = typeof import('sucrase');
let sucrase: Promise<Sucrase> | null = null;
let runtime: Promise<string> | null = null;

/** Isi src/vendor/pratinjau-react.js (React + ReactDOM + React Router build development). */
export function muatRuntime(): Promise<string> {
  if (!runtime) {
    runtime = import('../vendor/pratinjau-react.js?raw').then((m) => m.default);
    runtime.catch(() => { runtime = null; });
  }
  return runtime;
}

function muatSucrase(): Promise<Sucrase> {
  if (!sucrase) {
    sucrase = import('sucrase');
    sucrase.catch(() => { sucrase = null; });
  }
  return sucrase;
}

/** Ubah pesan error sucrase menjadi pesan yang menyebut baris dan petunjuk singkat. */
export function pesanGalatJsx(pesan: string): string {
  const posisi = pesan.match(/\((\d+):(\d+)\)\s*$/);
  const inti = pesan.replace(/^Error transforming [^:]+:\s*/, '').replace(/\s*\(\d+:\d+\)\s*$/, '');
  const tempat = posisi ? `baris ${posisi[1]}, kolom ${Number(posisi[2]) + 1}` : 'kode';
  return `Kode belum bisa dibaca (${tempat}): ${inti}.\n` +
    'Periksa tag yang belum ditutup, pasangan { } dan ( ), serta tanda kutip.';
}

export async function ubahJsx(kode: string): Promise<HasilUbah> {
  const { transform } = await muatSucrase();
  try {
    const { code } = transform(kode, {
      transforms: ['jsx', 'imports'],
      jsxRuntime: 'automatic',
      production: false,
      filePath: 'App.jsx',
    });
    return { ok: true, js: code };
  } catch (e) {
    return { ok: false, galat: pesanGalatJsx(e instanceof Error ? e.message : String(e)) };
  }
}

/** "</script" di dalam teks akan menutup tag <script> lebih awal; "<\/script" artinya sama di JavaScript. */
export function amankanSkrip(js: string): string {
  return js.replace(/<\/(script)/gi, '<\\/$1');
}

const CSS_DASAR = `
*,*::before,*::after{box-sizing:border-box}
body{margin:0;padding:12px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:16px;line-height:1.5;color:#1a1a1a;background:#fff}
h1,h2,h3{line-height:1.25;margin:0 0 8px}
p{margin:0 0 8px}
button{font:inherit;padding:6px 12px;border:2px solid #1a1a1a;border-radius:8px;background:#ffe838;cursor:pointer}
button:disabled{opacity:.5;cursor:not-allowed}
input,select,textarea{font:inherit;padding:6px 8px;border:2px solid #1a1a1a;border-radius:8px;max-width:100%}
input[type=checkbox]{width:18px;height:18px;vertical-align:middle}
ul{padding-left:20px;margin:0 0 8px}
a{color:#0b57d0}
#__bn_galat{display:none;margin:0 0 12px;padding:10px;border:2px solid #cf222e;border-radius:8px;background:#ffebe9;color:#82071e;font:13px/1.45 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-word}
`;

const SKRIP_KONSOL = `
(function(){
  function teks(a){
    if (typeof a === 'string') return a;
    if (a instanceof Error) return a.name + ': ' + a.message;
    if (typeof a === 'function') return 'function ' + (a.name || '') + '()';
    if (a === undefined) return 'undefined';
    try { return JSON.stringify(a); } catch (e) { return String(a); }
  }
  function gabung(args){
    args = Array.prototype.slice.call(args);
    if (typeof args[0] === 'string' && args[0].indexOf('%') !== -1) {
      var pola = args.shift();
      pola = pola.replace(/%[sdoOic]/g, function(){ return args.length ? teks(args.shift()) : ''; });
      args.unshift(pola);
    }
    return args.map(teks).join(' ');
  }
  function kirim(jenis, isi){ try { parent.postMessage({ sumber: 'bn-react', jenis: jenis, teks: isi }, '*'); } catch (e) {} }
  ['log','info','debug'].forEach(function(n){ console[n] = function(){ kirim('log', gabung(arguments)); }; });
  console.warn = function(){ kirim('warn', gabung(arguments)); };
  console.error = function(){ kirim('error', gabung(arguments)); };
  var sudah = {};
  window.__bnGalat = function(e){
    var isi = e && e.message ? (e.name || 'Error') + ': ' + e.message : 'Error: ' + String(e);
    if (sudah[isi]) return;
    sudah[isi] = true;
    var kotak = document.getElementById('__bn_galat');
    kotak.style.display = 'block';
    kotak.textContent += (kotak.textContent ? '\\n' : '') + isi;
  };
  window.addEventListener('error', function(e){ window.__bnGalat(e.error || e.message); });
  window.addEventListener('unhandledrejection', function(e){ window.__bnGalat(e.reason); });
})();
`;

/**
 * Iframe sandbox tanpa allow-same-origin tidak boleh memakai localStorage asli (SecurityError).
 * Penggantinya menyimpan data di memori dan melaporkan setiap perubahan ke halaman utama.
 */
function skripPenyimpanan(simpanan: Record<string, string>): string {
  return `
(function(){
  var data = ${JSON.stringify(simpanan)};
  function kirim(){ try { parent.postMessage({ sumber: 'bn-react', jenis: 'simpan', data: data }, '*'); } catch (e) {} }
  var penyimpanan = {
    getItem: function(k){ k = String(k); return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem: function(k, v){ data[String(k)] = String(v); kirim(); },
    removeItem: function(k){ delete data[String(k)]; kirim(); },
    clear: function(){ data = {}; kirim(); },
    key: function(i){ var k = Object.keys(data)[i]; return k === undefined ? null : k; },
    get length(){ return Object.keys(data).length; }
  };
  Object.defineProperty(window, 'localStorage', { configurable: true, value: penyimpanan });
})();
`;
}

function skripJalankan(js: string): string {
  return `
(function(){
  var M = window.__BN_MODUL;
  var tampil = false;
  var asli = M['react-dom/client'];
  var klien = Object.assign({}, asli, {
    createRoot: function(el, opsi){
      tampil = true;
      return asli.createRoot(el, Object.assign({ onUncaughtError: window.__bnGalat }, opsi));
    }
  });
  // Pratinjau tidak punya alamat sendiri (about:srcdoc), jadi BrowserRouter dan HashRouter
  // dijalankan di memori. Kode pengguna tetap sama dengan aplikasi sungguhan.
  var R = M['react-router-dom'];
  function routerMemori(p){
    return M['react'].createElement(R.MemoryRouter, { initialEntries: [p.basename || '/'], basename: p.basename }, p.children);
  }
  var router = Object.assign({}, R, {
    BrowserRouter: routerMemori,
    HashRouter: routerMemori,
    createBrowserRouter: function(rute, opsi){ return R.createMemoryRouter(rute, opsi); },
    createHashRouter: function(rute, opsi){ return R.createMemoryRouter(rute, opsi); }
  });
  function require(nama){
    if (/\\.css$/.test(nama)) return {};
    if (nama === 'react-dom/client') return klien;
    if (nama === 'react-router-dom' || nama === 'react-router') return router;
    if (M[nama]) return M[nama];
    throw new Error('Modul "' + nama + '" tidak tersedia di pratinjau ini. Yang bisa di-import: ${MODUL_TERSEDIA.join(', ')}.');
  }
  var module = { exports: {} };
  try {
    (function(require, module, exports){
${js}
    })(require, module, module.exports);
  } catch (e) { window.__bnGalat(e); return; }
  if (tampil) return;
  var App = module.exports.default;
  if (typeof App === 'function') {
    klien.createRoot(document.getElementById('root')).render(M['react'].createElement(App));
  } else {
    window.__bnGalat(new Error('Belum ada komponen yang ditampilkan. Tulis "export default function App() { ... }" atau panggil createRoot sendiri.'));
  }
})();
`;
}

export function buatDokumenReact(js: string, kodeRuntime: string, css = '', simpanan: Record<string, string> = {}): string {
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${CSS_DASAR}</style>
${css ? `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>` : ''}
</head>
<body>
<pre id="__bn_galat" role="alert"></pre>
<div id="root"></div>
<script>${SKRIP_KONSOL}</script>
<script>${amankanSkrip(skripPenyimpanan(simpanan))}</script>
<script>${amankanSkrip(kodeRuntime)}</script>
<script>${amankanSkrip(skripJalankan(js))}</script>
</body>
</html>`;
}
