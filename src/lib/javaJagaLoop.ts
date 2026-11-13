/**
 * Penjaga perulangan untuk Java di browser.
 *
 * CheerpJ menjalankan Java di thread utama halaman, jadi `while (true) {}` membekukan seluruh tab
 * dan pewaktu JavaScript tidak pernah sempat berjalan. Sebelum dikompilasi, setiap badan perulangan
 * disisipi `_BnJaga.cek();` (di baris yang sama, jadi nomor baris error tidak berubah).
 * Kelas _BnJaga ikut dikompilasi bersama Runner: ia memberi jeda ke browser dan menghentikan
 * program yang melewati batas waktu atau mencetak terlalu banyak.
 * Kode yang tampil di editor tidak berubah.
 */

export const PANGGIL_JAGA = '_BnJaga.cek();';
export const TANDA_BATAS_WAKTU = 'BN_BATAS_WAKTU';
export const TANDA_BATAS_KELUARAN = 'BN_BATAS_KELUARAN';
export const BATAS_KELUARAN_BYTE = 1_000_000;

export const PESAN_BATAS_WAKTU =
  'Program dihentikan karena berjalan terlalu lama. Kemungkinan ada perulangan yang tidak pernah berhenti: periksa kondisi while/for dan pastikan nilainya berubah di dalam perulangan.';
export const PESAN_BATAS_KELUARAN =
  'Program dihentikan karena mencetak terlalu banyak teks. Kemungkinan ada perulangan yang tidak pernah berhenti: periksa kondisi while/for dan pastikan nilainya berubah di dalam perulangan.';

/** Sumber kelas _BnJaga (non-public, ditaruh di file Runner.java). */
export function sumberKelasJaga(): string {
  return [
    'class _BnJaga {',
    '  static long batas = Long.MAX_VALUE, jeda = Long.MAX_VALUE;',
    '  static int n;',
    '  static ByteArrayOutputStream keluaran;',
    '  static void mulai(long ms, ByteArrayOutputStream out) {',
    '    long t = System.currentTimeMillis();',
    '    batas = t + ms; jeda = t + 200; keluaran = out;',
    '  }',
    '  static void cek() {',
    '    if ((++n & 1023) != 0) return;',
    '    long t = System.currentTimeMillis();',
    `    if (t > batas) throw new Error("${TANDA_BATAS_WAKTU}");`,
    `    if (keluaran != null && keluaran.size() > ${BATAS_KELUARAN_BYTE}) throw new Error("${TANDA_BATAS_KELUARAN}");`,
    '    if (t > jeda) {',
    '      jeda = t + 200;',
    '      try { Thread.sleep(1); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }',
    '    }',
    '  }',
    '}',
  ].join('\n');
}

interface Sisipan { pos: number; teks: string }

export interface HasilJaga {
  kode: string;
  /** Baris yang berubah: indeks baris -> sisipan (kolom asli dan panjang). */
  perubahan: Map<number, { asli: string; baru: string; sisip: { kolom: number; panjang: number }[] }>;
}

/** Salinan kode dengan string, char, dan komentar diganti spasi (panjang dan baris baru tetap). */
export function tutupTeks(src: string): string {
  const out = src.split('');
  let i = 0;
  const kosongkan = (a: number, b: number) => {
    for (let k = a; k < b && k < out.length; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  while (i < src.length) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') {
      let j = i;
      while (j < src.length && src[j] !== '\n') j++;
      kosongkan(i, j); i = j;
    } else if (c === '/' && d === '*') {
      const j = src.indexOf('*/', i + 2);
      const akhir = j < 0 ? src.length : j + 2;
      kosongkan(i, akhir); i = akhir;
    } else if (c === '"' && src.startsWith('"""', i)) {
      const j = src.indexOf('"""', i + 3);
      const akhir = j < 0 ? src.length : j + 3;
      kosongkan(i, akhir); i = akhir;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      const akhir = Math.min(j + 1, src.length);
      kosongkan(i, akhir); i = akhir;
    } else i++;
  }
  return out.join('');
}

const lewatiSpasi = (m: string, i: number) => {
  while (i < m.length && /\s/.test(m[i])) i++;
  return i;
};

/** Indeks penutup yang cocok untuk pembuka di m[i], atau -1. */
function cariPasangan(m: string, i: number): number {
  const buka = m[i];
  const tutup = buka === '(' ? ')' : buka === '{' ? '}' : ']';
  let dalam = 0;
  for (let j = i; j < m.length; j++) {
    if (m[j] === buka) dalam++;
    else if (m[j] === tutup && --dalam === 0) return j;
  }
  return -1;
}

const KATA_PERNYATAAN = /^(if|for|while|do|try|switch|synchronized|return|throw|break|continue|else|case|default)\b/;

/** Akhir pernyataan sederhana (posisi ';' pada kedalaman 0), atau -1. */
function akhirPernyataan(m: string, i: number): number {
  let dalam = 0;
  for (let j = i; j < m.length; j++) {
    const c = m[j];
    if (c === '(' || c === '{' || c === '[') dalam++;
    else if (c === ')' || c === '}' || c === ']') {
      if (--dalam < 0) return -1;
    } else if (c === ';' && dalam === 0) return j;
  }
  return -1;
}

export function pasangJagaLoop(src: string): HasilJaga {
  const m = tutupTeks(src);
  const sisipan: Sisipan[] = [];
  const ekorDo = new Set<number>();
  const re = /(?<![\w$.])(for|while|do)(?![\w$])/g;
  let hit: RegExpExecArray | null;

  const pasangBadan = (awal: number, bolehKosong: boolean) => {
    const b = lewatiSpasi(m, awal);
    if (m[b] === '{') sisipan.push({ pos: b + 1, teks: ' ' + PANGGIL_JAGA });
    else if (m[b] === ';') {
      if (bolehKosong) {
        sisipan.push({ pos: b, teks: '{' + PANGGIL_JAGA });
        sisipan.push({ pos: b + 1, teks: '}' });
      }
    } else if (!KATA_PERNYATAAN.test(m.slice(b, b + 14))) {
      const akhir = akhirPernyataan(m, b);
      if (akhir > 0) {
        sisipan.push({ pos: b, teks: '{ ' + PANGGIL_JAGA + ' ' });
        sisipan.push({ pos: akhir + 1, teks: ' }' });
      }
    }
  };

  while ((hit = re.exec(m))) {
    const kata = hit[1];
    const pos = hit.index;
    if (kata === 'do') {
      const b = lewatiSpasi(m, pos + 2);
      if (m[b] === '{') {
        sisipan.push({ pos: b + 1, teks: ' ' + PANGGIL_JAGA });
        const tutup = cariPasangan(m, b);
        if (tutup > 0) {
          const w = lewatiSpasi(m, tutup + 1);
          if (m.startsWith('while', w)) ekorDo.add(w);
        }
      } else {
        // do tanpa kurung kurawal: jangan salah anggap "while (...);" di ekornya sebagai perulangan kosong.
        const lanjut = /(?<![\w$.])while(?![\w$])/g;
        lanjut.lastIndex = pos + 2;
        const w = lanjut.exec(m);
        if (w) ekorDo.add(w.index);
      }
      continue;
    }
    if (kata === 'while' && ekorDo.has(pos)) continue;
    const p = lewatiSpasi(m, pos + kata.length);
    if (m[p] !== '(') continue;
    const tutup = cariPasangan(m, p);
    if (tutup < 0) continue;
    pasangBadan(tutup + 1, true);
  }

  sisipan.sort((a, b) => a.pos - b.pos);
  let kode = '';
  let dari = 0;
  for (const s of sisipan) {
    kode += src.slice(dari, s.pos) + s.teks;
    dari = s.pos;
  }
  kode += src.slice(dari);

  // Catat baris yang berubah untuk merapikan pesan error javac.
  const perubahan: HasilJaga['perubahan'] = new Map();
  const barisAsli = src.split('\n');
  const awalBaris: number[] = [];
  let off = 0;
  for (const b of barisAsli) { awalBaris.push(off); off += b.length + 1; }
  const barisDari = (pos: number) => {
    let lo = 0, hi = awalBaris.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (awalBaris[mid] <= pos) lo = mid; else hi = mid - 1;
    }
    return lo;
  };
  const barisBaru = kode.split('\n');
  for (const s of sisipan) {
    const n = barisDari(s.pos);
    const ada = perubahan.get(n) ?? { asli: barisAsli[n], baru: barisBaru[n], sisip: [] };
    ada.sisip.push({ kolom: s.pos - awalBaris[n], panjang: s.teks.length });
    perubahan.set(n, ada);
  }
  return { kode, perubahan };
}

/** Kembalikan pesan javac ke kode asli: baris kode yang dikutip dan posisi tanda ^. */
export function rapikanPesanJavac(pesan: string, jaga: HasilJaga): string {
  if (!pesan || jaga.perubahan.size === 0) return pesan;
  const keAsli = new Map<string, HasilJaga['perubahan'] extends Map<number, infer V> ? V : never>();
  for (const v of jaga.perubahan.values()) keAsli.set(v.baru, v);
  const baris = pesan.split('\n');
  for (let i = 0; i < baris.length; i++) {
    const v = keAsli.get(baris[i].replace(/\r$/, ''));
    if (!v) continue;
    baris[i] = v.asli;
    const tanda = baris[i + 1]?.match(/^(\s*)\^\s*$/);
    if (!tanda) continue;
    const c = tanda[1].length;
    let geser = 0;
    let kolom = c;
    for (const s of [...v.sisip].sort((a, b) => a.kolom - b.kolom)) {
      const mulai = s.kolom + geser;
      if (c >= mulai + s.panjang) kolom -= s.panjang;
      else if (c >= mulai) { kolom = s.kolom; break; }
      else break;
      geser += s.panjang;
    }
    baris[i + 1] = tanda[1].slice(0, kolom) + '^';
    i++;
  }
  return baris.join('\n');
}
