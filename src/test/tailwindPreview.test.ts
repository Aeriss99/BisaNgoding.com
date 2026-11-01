import { describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { buildTailwindDocument, kandidatKelas, pisahkanTailwind } from '../lib/tailwindPreview';

// Vitest tidak memproses file CSS (isinya kosong di tes), padahal di build Vite `?raw` berisi teks
// file aslinya. Tes memakai isi index.css yang sebenarnya.
vi.mock('tailwindcss/index.css?raw', () => ({
  default: fs.readFileSync(path.resolve(__dirname, '../../node_modules/tailwindcss/index.css'), 'utf8'),
}));

describe('pratinjau Tailwind', () => {
  it('memisahkan <style type="text/tailwindcss"> dari HTML', () => {
    const { html, css } = pisahkanTailwind('<style type="text/tailwindcss">@theme { --color-merek: #f50; }</style><p class="text-merek">Hai</p>');
    expect(html).toBe('<p class="text-merek">Hai</p>');
    expect(css).toContain('--color-merek');
  });

  it('mengambil semua kelas, termasuk di <html>', () => {
    const k = kandidatKelas('<html class="dark"><body><div class="p-4 md:flex  bg-blue-500"></div></body></html>');
    expect(k).toEqual(expect.arrayContaining(['dark', 'p-4', 'md:flex', 'bg-blue-500']));
  });

  it('membuat CSS hanya dari kelas yang dipakai, ditambah tema sendiri', async () => {
    const dok = await buildTailwindDocument(
      '<style type="text/tailwindcss">@theme { --color-merek: #ff5500; }</style><div class="bg-merek p-4 md:flex w-[350px]">Hai</div>');
    expect(dok).toContain('.bg-merek');
    expect(dok).toContain('--color-merek: #ff5500');
    expect(dok).toContain('.md\\:flex');
    expect(dok).toContain('.w-\\[350px\\]');
    expect(dok).not.toContain('.bg-red-500');
    expect(dok).not.toContain('text/tailwindcss');
    expect(dok).not.toMatch(/<script/i);
  });

  it('CSS tambahan yang salah menampilkan pesan, bukan halaman kosong', async () => {
    const dok = await buildTailwindDocument('<style type="text/tailwindcss">.kartu { @apply bukan-kelas; }</style><p class="p-4">Hai</p>');
    expect(dok).toContain('CSS Tailwind belum bisa dibaca');
    expect(dok).toContain('<p class="p-4">Hai</p>');
  });
});
