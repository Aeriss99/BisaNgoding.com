import type { PraktikJavaCard } from '../types/schema';

/**
 * Logika kartu "praktik_java": praktik menulis kode Java bersama Lingga.
 *
 * Langkah pertama adalah contoh (Lingga mengetik kode lalu menjalankannya). Langkah berikutnya
 * adalah tugas: pengguna mengubah kode di editor, kodenya dijalankan sungguhan di browser, lalu
 * dianggap benar kalau keluarannya sama dengan `keluaran` dan semua pola `wajib` ada di kodenya.
 */

/** Samakan akhir baris dan buang spasi di ujung setiap baris serta baris kosong di akhir. */
export function rapikanKeluaran(teks: string): string {
  return teks
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((b) => b.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

export function keluaranSama(a: string, b: string): boolean {
  return rapikanKeluaran(a) === rapikanKeluaran(b);
}

/** Buang komentar supaya pola `wajib` tidak terpenuhi hanya karena ditulis di komentar. */
export function tanpaKomentar(kode: string): string {
  return kode.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/** Pesan dari pola `wajib` pertama yang tidak ditemukan di kode, atau null kalau semuanya ada. */
export function cekWajib(kode: string, wajib: { pola: string; pesan: string }[] = []): string | null {
  const bersih = tanpaKomentar(kode);
  for (const w of wajib) {
    let cocok = false;
    try {
      cocok = new RegExp(w.pola, 'm').test(bersih);
    } catch {
      cocok = false;
    }
    if (!cocok) return w.pesan;
  }
  return null;
}

/** Kode di editor saat langkah ke-i dimulai: kodeAwal, atau jawaban langkah sebelumnya. */
export function kodeAwalLangkah(card: PraktikJavaCard, i: number): string {
  const l = card.langkah[i];
  if (!l) return '';
  if (l.kodeAwal !== undefined) return l.kodeAwal;
  return i > 0 ? card.langkah[i - 1].jawaban : '';
}

/** Rapikan pesan error dari compiler/JVM supaya mudah dibaca pemula. */
export function rapikanError(stderr: string): string {
  return stderr
    .split('\n')
    .filter((b) => !/^\s+at (Runner|java\.base\/|sun\.reflect|jdk\.internal)/.test(b))
    .join('\n')
    .replace(/\/(str|files)\/Main\.java/g, 'Main.java')
    .trim();
}

/** Label "Contoh dari Lingga", "Tugas 2 dari 3", atau "Tantangan · Tugas 2 dari 3". */
export function labelLangkahJava(card: PraktikJavaCard, i: number): string {
  const l = card.langkah[i];
  if (!l) return '';
  if (l.otomatis) return 'Contoh dari Lingga';
  const tugas = card.langkah.filter((x) => !x.otomatis);
  const ke = card.langkah.slice(0, i + 1).filter((x) => !x.otomatis).length;
  return `${l.tantangan ? 'Tantangan · ' : ''}Tugas ${ke} dari ${tugas.length}`;
}
