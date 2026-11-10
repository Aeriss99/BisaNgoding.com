// Peta modul bawaan Node -> pengganti untuk browser. Dipakai Vite (worker nodeWorker) dan test (esbuild).
import path from 'node:path';

export function petaNode(akar) {
  const R = path.join(akar, 'src/lib/nodeRuntime');
  const N = path.join(akar, 'node_modules');
  return {
    http: R + '/http.js', https: R + '/http.js', fs: R + '/fs.js', 'fs/promises': R + '/fsPromises.js',
    path: N + '/path-browserify/index.js', 'path/posix': N + '/path-browserify/index.js',
    events: N + '/events/events.js', stream: N + '/readable-stream/lib/ours/browser.js',
    'stream/promises': R + '/streamPromises.js', buffer: N + '/buffer/index.js', util: R + '/util.js',
    url: R + '/url.js', querystring: N + '/querystring-es3/index.js',
    string_decoder: N + '/string_decoder/lib/string_decoder.js', crypto: R + '/crypto.js', zlib: R + '/kosong.js',
    net: R + '/net.js', async_hooks: R + '/asyncHooks.js', os: R + '/os.js', tty: R + '/kosong.js',
    timers: R + '/timers.js', process: R + '/process.js', readline: R + '/readline.js',
  };
}

const POLA = /^(node:)?[a-z_/-]+$/;

/** Plugin Vite/Rollup: hanya untuk bundle worker Node tiruan. */
export function pluginNodeVite(akar) {
  const peta = petaNode(akar);
  return {
    name: 'node-tiruan',
    enforce: 'pre',
    resolveId(id, importer) {
      if (!POLA.test(id)) return null;
      // compiler TypeScript (tsWorker) punya cadangan sendiri untuk modul Node; jangan ikut diganti
      if (importer && /[\\/]node_modules[\\/]typescript[\\/]|tsWorker|tsPeriksa/.test(importer)) return null;
      return peta[id.replace(/^node:/, '')] || null;
    },
  };
}

/** Plugin esbuild (test). */
export function pluginNodeEsbuild(akar) {
  const peta = petaNode(akar);
  return {
    name: 'node-tiruan',
    setup(b) {
      b.onResolve({ filter: POLA }, (a) => {
        const p = peta[a.path.replace(/^node:/, '')];
        return p ? { path: p } : undefined;
      });
    },
  };
}

/** Untuk server dev Vite: worker.plugins tidak dipakai saat dev, jadi modul runtime dan paket npm-nya
 * (yang di-prebundle) diarahkan dengan plugin ini. Hanya berlaku untuk impor dari runtime Node tiruan
 * dan paket di node_modules (kecuali compiler TypeScript). */
export function pluginNodeDev(akar) {
  const p = pluginNodeVite(akar);
  return {
    name: 'node-tiruan-dev',
    apply: 'serve',
    enforce: 'pre',
    resolveId(id, importer) {
      if (!importer || !/[\\/](nodeRuntime|node_modules)[\\/]/.test(importer)) return null;
      const hasil = p.resolveId(id, importer);
      // paket npm (events, buffer, ...) dibiarkan lewat jalur biasa supaya di-prebundle Vite
      return hasil && hasil.includes('nodeRuntime') ? hasil : null;
    },
  };
}

