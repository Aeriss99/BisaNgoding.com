import { describe, it, expect } from 'vitest';
import { pecahFileTs, artiGalatTs } from './tsPeriksa';
import { pemeriksaNode } from '../test/alat/tsNode';
import { jalankanSepertiWorker } from '../test/alat/jalankanWorker';

const periksa = pemeriksaNode();

describe('Pemeriksa TypeScript (tsc strict di browser)', () => {
  it('menemukan error tipe dengan format seperti tsc', () => {
    const h = periksa('let umur: number = "dua";');
    expect(h.galat).toEqual(["main.ts(1,5): error TS2322: Type 'string' is not assignable to type 'number'."]);
    expect(h.kodeGalat).toEqual([2322]);
  });

  it('mode strict: parameter tanpa tipe dan nilai yang mungkin undefined ditolak', () => {
    const h = periksa('function f(x) { return x }\nconst n = [1, 2].find((a) => a > 1);\nconsole.log(n.toFixed());');
    expect(h.kodeGalat).toEqual([7006, 18048]);
  });

  it('kode benar diubah menjadi JavaScript tanpa tipe dan bisa dijalankan', async () => {
    const h = periksa('interface Produk { nama: string; harga: number }\nconst p: Produk = { nama: "Kopi", harga: 18000 };\nconsole.log(p.nama, p.harga);');
    expect(h.galat).toEqual([]);
    expect(h.js).not.toMatch(/interface|: Produk/);
    const r = await jalankanSepertiWorker(h.js);
    expect(r.stdout).toBe('Kopi 18000\n');
  });

  it('setiap file adalah module: nama global seperti name tidak bentrok', () => {
    expect(periksa('const name = "Rina";\nconsole.log(name);').galat).toEqual([]);
  });

  it('beberapa file: import antar-file diperiksa dan diarahkan ke .js', () => {
    const h = periksa("// === todo.ts ===\nexport interface Todo { judul: string }\nexport const buat = (judul: string): Todo => ({ judul });\n// === main.ts ===\nimport { buat } from './todo';\nconsole.log(buat('A').judul);");
    expect(h.galat).toEqual([]);
    expect(h.js).toContain('// === todo.js ===');
    expect(h.js).toContain("from './todo.js'");
    expect(h.js.indexOf('// === main.js ===')).toBeGreaterThan(h.js.indexOf('// === todo.js ==='));
    const salah = periksa("// === todo.ts ===\nexport const x = 1;\n// === main.ts ===\nimport { y } from './todo';");
    expect(salah.kodeGalat).toContain(2305);
  });

  it('fetch, console, dan setTimeout dikenal; DOM tidak', () => {
    expect(periksa('const r = await fetch("https://api.toko.contoh/products");\nconst d: unknown = await r.json();\nsetTimeout(() => console.log(d), 10);').galat).toEqual([]);
    expect(periksa('document.title = "x";').kodeGalat).toEqual([2584]);
  });

  it('pecahFileTs: tanpa penanda semuanya main.ts', () => {
    expect(pecahFileTs('console.log(1)')).toMatchObject({ urutan: ['main.ts'], utama: 'main.ts' });
    expect(pecahFileTs('// === a.ts ===\nexport const a = 1;\n// === b.ts ===\nimport { a } from "./a";').utama).toBe('b.ts');
  });

  it('arti error dalam bahasa Indonesia untuk error yang sering muncul', () => {
    for (const k of [2322, 2345, 2339, 7006, 18048, 2741]) expect(artiGalatTs(k).length).toBeGreaterThan(20);
    expect(artiGalatTs(99999)).toBe('');
  });
});
