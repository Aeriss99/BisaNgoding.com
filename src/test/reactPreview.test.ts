import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { amankanSkrip, bacaPesan, buatDokumenReact, pesanGalatJsx, ubahJsx } from '../lib/reactPreview';

describe('pratinjau React', () => {
  it('mengubah JSX dan import menjadi JavaScript biasa', async () => {
    const h = await ubahJsx("import { useState } from 'react';\nexport default function App() { const [n] = useState(1); return <b>{n}</b>; }");
    expect(h.ok).toBe(true);
    if (!h.ok) return;
    expect(h.js).toContain("require('react')");
    expect(h.js).toContain('react/jsx-dev-runtime');
    expect(h.js).toContain('exports.default = App');
  });

  it('JSX yang salah memberi pesan dengan baris dan petunjuk', async () => {
    const h = await ubahJsx('export default function App() {\n  return <div><p>Hai</div>;\n}');
    expect(h.ok).toBe(false);
    if (h.ok) return;
    expect(h.galat).toMatch(/^Kode belum bisa dibaca \(baris 2, kolom \d+\)/);
    expect(h.galat).toContain('Periksa tag yang belum ditutup');
    expect(pesanGalatJsx('Error transforming App.jsx: Unexpected token (3:4)')).toBe(
      'Kode belum bisa dibaca (baris 3, kolom 5): Unexpected token.\nPeriksa tag yang belum ditutup, pasangan { } dan ( ), serta tanda kutip.');
  });

  it('teks </script di kode tidak menutup tag script lebih awal', () => {
    expect(amankanSkrip('const s = "</script>";')).toBe('const s = "<\\/script>";');
    const dok = buatDokumenReact('console.log("</script>")', '/* runtime */', 'p{color:red}', { kunci: 'nilai' });
    expect(dok.match(/<\/script>/g)).toHaveLength(4);
    expect(dok).toContain('<div id="root"></div>');
    expect(dok).toContain('p{color:red}');
    expect(dok).toContain('{"kunci":"nilai"}');
    expect(dok).toContain("Object.defineProperty(window, 'localStorage'");
  });

  it('hanya menerima pesan dari pratinjau dengan bentuk yang benar', () => {
    expect(bacaPesan({ sumber: 'bn-react', jenis: 'log', teks: 'halo' })).toEqual({ sumber: 'bn-react', jenis: 'log', teks: 'halo' });
    expect(bacaPesan({ sumber: 'bn-react', jenis: 'simpan', data: { a: '1', b: 2 } })).toEqual({ sumber: 'bn-react', jenis: 'simpan', data: { a: '1' } });
    expect(bacaPesan({ sumber: 'lain', jenis: 'log', teks: 'x' })).toBeNull();
    expect(bacaPesan({ sumber: 'bn-react', jenis: 'hapus', teks: 'x' })).toBeNull();
    expect(bacaPesan('teks')).toBeNull();
    expect(bacaPesan({ sumber: 'bn-react', jenis: 'warn', teks: 'x'.repeat(5000) })).toMatchObject({ teks: 'x'.repeat(2000) });
  });

  it('runtime React di src/vendor berisi React, ReactDOM, dan React Router versi development', () => {
    const rt = fs.readFileSync(path.resolve(__dirname, '../vendor/pratinjau-react.js'), 'utf8');
    expect(rt.length).toBeGreaterThan(300000);
    expect(rt).toContain('window.__BN_MODUL');
    expect(rt).toContain('Each child in a list should have a unique "key" prop');
    expect(rt).not.toMatch(/<\/script/i);
  });
});
