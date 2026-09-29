/**
 * Keyboard HP (iPhone "Smart Punctuation") dan Mac otomatis mengubah "--" menjadi "—"
 * dan tanda kutip lurus menjadi kutip miring. Di kode, semua itu salah.
 * Fungsi ini mengembalikan karakter yang sebenarnya diketik pelajar.
 */
export function rapikanKetikan(s: string): string {
  return s
    .replace(/[\u2014\u2013]/g, '--')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...');
}
