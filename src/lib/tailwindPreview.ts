import { createContext } from 'react';
import { buildPreviewDocument } from './htmlCssPreview';

/**
 * Pratinjau kelas Tailwind CSS.
 *
 * CSS Tailwind dibuat di halaman utama dari kelas yang dipakai kode pengguna, lalu disisipkan ke
 * dokumen pratinjau sebagai <style>. Iframe tetap tanpa script (sandbox=""), dan compiler Tailwind
 * ikut dibundel di aplikasi (dimuat saat pertama dipakai) sehingga pratinjau jalan offline.
 *
 * Sama seperti Tailwind lewat CDN, CSS tambahan (@theme, @custom-variant, @apply) ditulis di
 * <style type="text/tailwindcss">.
 */

/** true di materi kelas Tailwind: HtmlResult memakai Tailwind untuk pratinjaunya. */
export const PratinjauTailwind = createContext(false);

const POLA_STYLE = /<style\s+type=["']text\/tailwindcss["'][^>]*>([\s\S]*?)<\/style>/gi;

export function pisahkanTailwind(html: string): { html: string; css: string } {
  let css = '';
  const sisa = html.replace(POLA_STYLE, (_, isi: string) => {
    css += `${isi}\n`;
    return '';
  });
  return { html: sisa, css };
}

/** Semua kata di atribut class (termasuk class di <html> dan <body>). */
export function kandidatKelas(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const hasil = new Set<string>();
  doc.querySelectorAll('[class]').forEach((el) => {
    for (const k of (el.getAttribute('class') ?? '').split(/\s+/)) if (k) hasil.add(k);
  });
  return [...hasil];
}

type Kompiler = { build(kandidat: string[]): string };
const cache = new Map<string, Promise<Kompiler>>();

function kompiler(cssTambahan: string): Promise<Kompiler> {
  const ada = cache.get(cssTambahan);
  if (ada) return ada;
  const baru = (async () => {
    const [{ compile }, { default: indexCss }] = await Promise.all([
      import('tailwindcss'),
      import('tailwindcss/index.css?raw'),
    ]);
    if (indexCss.length < 1000) throw new Error('file tailwindcss/index.css tidak termuat');
    return compile(`@import "tailwindcss";\n${cssTambahan}`, {
      base: '/',
      loadStylesheet: async (_id: string, base: string) => ({ path: 'tailwindcss/index.css', base, content: indexCss }),
    });
  })();
  if (cache.size > 20) cache.clear();
  cache.set(cssTambahan, baru);
  baru.catch(() => cache.delete(cssTambahan));
  return baru;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

export async function buildTailwindDocument(html: string): Promise<string> {
  const { html: sisa, css } = pisahkanTailwind(html);
  try {
    const k = await kompiler(css);
    return buildPreviewDocument(sisa, k.build(kandidatKelas(sisa)));
  } catch (e) {
    const pesan = e instanceof Error ? e.message : String(e);
    return buildPreviewDocument(
      `<p style="font-family:monospace;color:#b91c1c;padding:8px">CSS Tailwind belum bisa dibaca: ${escapeHtml(pesan)}</p>${sisa}`,
      '',
    );
  }
}
