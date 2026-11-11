import data from './javaPustaka.json';

/**
 * Library Java (JUnit 5, Mockito, SLF4J + Logback, Lombok, H2, Jackson, Hibernate Validator) untuk modul
 * Java lanjutan. Jar-nya ada di public/java-lib dan hanya dimuat kalau kodenya memakai library itu,
 * dikenali dari import atau nama class (aturan di javaPustaka.json, juga dipakai scripts/test-java.js).
 */
export interface AturanPustaka {
  nama: string;
  pola: string;
  jar: string[];
}

export const ATURAN_PUSTAKA: AturanPustaka[] = data.aturan;

/** Nama file jar yang dibutuhkan kode, tanpa duplikat, sesuai urutan aturan. */
export function jarUntuk(kode: string): string[] {
  const hasil: string[] = [];
  for (const a of ATURAN_PUSTAKA) {
    if (!new RegExp(a.pola).test(kode)) continue;
    for (const j of a.jar) if (!hasil.includes(j)) hasil.push(j);
  }
  return hasil;
}

/** Classpath CheerpJ (dipisah titik dua) untuk jar library kode ini. Kosong kalau tidak memakai library. */
export function classpathPustaka(kode: string, base = '/'): string {
  const folder = ('/app/' + base + 'java-lib/').replace(/\/{2,}/g, '/');
  return jarUntuk(kode)
    .map((j) => folder + j)
    .join(':');
}
