import { coursesData, modulesData, getVisibleLessons } from './content';

export type JenisHasil = 'kelas' | 'modul' | 'materi';

export interface HasilCari {
  jenis: JenisHasil;
  id: string;
  judul: string;
  /** Keterangan kecil di bawah judul, misalnya nama kelas/modul induk. */
  induk: string;
  url: string;
  /** Teks tambahan yang ikut dicocokkan (tidak ditampilkan). */
  kunci?: string;
}

/** Huruf kecil, tanpa aksen, spasi dirapikan. */
export function normalCari(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

let indeksCache: HasilCari[] | null = null;

/** Semua kelas, modul, dan materi yang sudah bisa dipelajari. */
export function indeksPencarian(): HasilCari[] {
  if (indeksCache) return indeksCache;
  const hasil: HasilCari[] = [];
  const kelasSiap = coursesData.filter((c) => c.status !== 'soon');
  for (const c of kelasSiap) {
    hasil.push({ jenis: 'kelas', id: c.id, judul: c.title.replace(/^Kelas /, ''), induk: 'Kelas', url: `/kelas/${c.id}`, kunci: c.title });
  }
  for (const m of modulesData) {
    if (m.status === 'draft') continue;
    const courseId = m.courseId || 'java';
    const kelas = kelasSiap.find((c) => c.id === courseId);
    if (!kelas) continue;
    const lessons = getVisibleLessons(m.id);
    if (lessons.length === 0) continue;
    hasil.push({ jenis: 'modul', id: m.id, judul: m.title, induk: kelas.title, url: `/kelas/${kelas.id}?modul=${m.id}` });
    for (const l of lessons) {
      hasil.push({ jenis: 'materi', id: l.id, judul: l.title, induk: m.title, url: `/lesson/${l.id}` });
    }
  }
  indeksCache = hasil;
  return hasil;
}

const BOBOT: Record<JenisHasil, number> = { kelas: 0, modul: 1, materi: 2 };

/**
 * Cari berdasarkan judul. Semua kata di kueri harus ada di judul.
 * Urutan: judul yang diawali kueri dulu, lalu kelas > modul > materi.
 */
export function cari(kueri: string, batas = 8, indeks: HasilCari[] = indeksPencarian()): HasilCari[] {
  const q = normalCari(kueri);
  if (q.length < 2) return [];
  const kata = q.split(' ');
  return indeks
    .map((h) => ({ h, j: normalCari(h.judul), semua: normalCari(`${h.judul} ${h.kunci ?? ''}`) }))
    .filter(({ semua }) => kata.every((k) => semua.includes(k)))
    .sort((a, b) => {
      const awalA = a.j.startsWith(q) || normalCari(a.h.kunci ?? '').startsWith(q) ? 0 : 1;
      const awalB = b.j.startsWith(q) || normalCari(b.h.kunci ?? '').startsWith(q) ? 0 : 1;
      if (awalA !== awalB) return awalA - awalB;
      return BOBOT[a.h.jenis] - BOBOT[b.h.jenis];
    })
    .slice(0, batas)
    .map(({ h }) => h);
}
