/// <reference lib="webworker" />
/**
 * Web Worker pemeriksa TypeScript. Compiler TypeScript resmi (sekitar 3 MB) dan file lib-nya hanya diunduh
 * saat kelas TypeScript dipakai, lalu disimpan di cache browser (lihat runtimeCaching di vite.config.ts).
 * Pesan masuk: { id, kode }. Pesan keluar: { id, galat, kodeGalat, js } atau { id, gagal }.
 */
import ts from 'typescript';
import { buatPemeriksa, FILE_LIB_TS } from './tsPeriksa';

const semuaLib = import.meta.glob(
  [
    '../../node_modules/typescript/lib/lib.es5.d.ts',
    '../../node_modules/typescript/lib/lib.decorators*.d.ts',
    '../../node_modules/typescript/lib/lib.es201[5-9]*.d.ts',
    '../../node_modules/typescript/lib/lib.es202[0-2]*.d.ts',
    '!../../node_modules/typescript/lib/lib.*.full.d.ts',
  ],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  }
) as Record<string, string>;

const lib: Record<string, string> = {};
for (const [jalur, isi] of Object.entries(semuaLib)) {
  const nama = jalur.replace(/^.*\//, '');
  if (FILE_LIB_TS.includes(nama)) lib[nama] = isi;
}

const periksa = buatPemeriksa(ts, lib);

self.onmessage = (e: MessageEvent<{ id: number; kode: string }>) => {
  const { id, kode } = e.data;
  try {
    const hasil = periksa(kode);
    (self as unknown as Worker).postMessage({ id, ...hasil });
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, gagal: err instanceof Error ? err.message : String(err) });
  }
};
