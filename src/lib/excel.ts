/**
 * Mesin rumus Excel tiruan untuk kartu "praktik_excel" dan tes konten kelas Excel.
 *
 * Mengikuti Microsoft Excel dengan pengaturan wilayah (regional setting) Indonesia:
 * pemisah argumen titik koma (;), desimal koma (2,5), pemisah ribuan titik (1.250.000),
 * tanggal dd/mm/yyyy. Nama fungsi tetap bahasa Inggris (SUM, IF, VLOOKUP).
 *
 * Sengaja tanpa import supaya bisa dijalankan langsung oleh Node untuk memeriksa konten.
 */

export interface Galat {
  galat: string;
}
export type Nilai = number | string | boolean | Galat | null;
export type Matriks = Nilai[][];

export function isGalat(v: unknown): v is Galat {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && 'galat' in v;
}
const G = (kode: string): Galat => ({ galat: kode });
const LINGKAR = '#LINGKAR!';

/** Kesalahan penulisan rumus (Excel menolak rumusnya). `pesan` ditujukan ke pelajar. */
export class GalatRumus extends Error {
  jenis: 'koma' | 'titik-desimal' | 'kurung' | 'argumen' | 'umum';
  constructor(jenis: GalatRumus['jenis'], pesan: string) {
    super(pesan);
    this.jenis = jenis;
  }
}

// ------------------------------------------------------------------ alamat sel

export function hurufKeKolom(h: string): number {
  let n = 0;
  for (const c of h.toUpperCase()) n = n * 26 + (c.charCodeAt(0) - 64);
  return n;
}

export function kolomKeHuruf(n: number): string {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function uraiAlamat(a: string): { kolom: number; baris: number } | null {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(a.trim());
  if (!m) return null;
  return { kolom: hurufKeKolom(m[1]), baris: Number(m[2]) };
}

export function alamat(kolom: number, baris: number): string {
  return `${kolomKeHuruf(kolom)}${baris}`;
}

/** Semua alamat dari `dari` sampai `sampai` (persegi), baris demi baris. */
export function rentangAlamat(dari: string, sampai?: string): string[] {
  const a = uraiAlamat(dari);
  const b = uraiAlamat(sampai ?? dari);
  if (!a || !b) return [];
  const hasil: string[] = [];
  for (let r = Math.min(a.baris, b.baris); r <= Math.max(a.baris, b.baris); r++)
    for (let c = Math.min(a.kolom, b.kolom); c <= Math.max(a.kolom, b.kolom); c++) hasil.push(alamat(c, r));
  return hasil;
}

// ------------------------------------------------------------------ token

type Token =
  | { j: 'angka'; v: number; a: number; z: number }
  | { j: 'teks'; v: string; a: number; z: number }
  | { j: 'ref'; kolom: number; baris: number; absK: boolean; absB: boolean; a: number; z: number }
  | { j: 'kolom'; kolom: number; absK: boolean; a: number; z: number }
  | { j: 'nama'; v: string; a: number; z: number }
  | { j: 'op'; v: string; a: number; z: number };

const PESAN_KOMA =
  'Di Excel dengan pengaturan Indonesia, pemisah antarbagian rumus adalah titik koma (;), bukan koma. Contoh: =IF(B2>=75;"Lulus";"Ulang").';
const PESAN_TITIK = 'Di pengaturan Indonesia, angka desimal memakai koma, contoh 2,5 (bukan 2.5).';
const PESAN_UMUM = 'Excel menolak rumus ini karena penulisannya belum lengkap. Periksa tanda kurung, tanda kutip, dan tanda ; di dalamnya.';

function tokenisasi(rumus: string): Token[] {
  const t: Token[] = [];
  let i = 0;
  const s = rumus;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t' || c === '\n') {
      i++;
      continue;
    }
    const sisa = s.slice(i);
    if (c === '"') {
      let j = i + 1;
      let isi = '';
      for (;;) {
        if (j >= s.length) throw new GalatRumus('umum', 'Ada tanda kutip " yang belum ditutup.');
        if (s[j] === '"') {
          if (s[j + 1] === '"') {
            isi += '"';
            j += 2;
            continue;
          }
          break;
        }
        isi += s[j];
        j++;
      }
      t.push({ j: 'teks', v: isi, a: i, z: j + 1 });
      i = j + 1;
      continue;
    }
    let m = /^\d+\.\d+/.exec(sisa);
    if (m) throw new GalatRumus('titik-desimal', PESAN_TITIK);
    m = /^\d+(,\d+)?/.exec(sisa);
    if (m) {
      t.push({ j: 'angka', v: Number(m[0].replace(',', '.')), a: i, z: i + m[0].length });
      i += m[0].length;
      continue;
    }
    m = /^(\$?)([A-Za-z]{1,3}):(\$?)([A-Za-z]{1,3})(?![A-Za-z0-9_(.])/.exec(sisa);
    if (m) {
      t.push({ j: 'kolom', kolom: hurufKeKolom(m[2]), absK: m[1] === '$', a: i, z: i + m[1].length + m[2].length });
      t.push({ j: 'op', v: ':', a: i + m[1].length + m[2].length, z: i + m[1].length + m[2].length + 1 });
      const a2 = i + m[1].length + m[2].length + 1;
      t.push({ j: 'kolom', kolom: hurufKeKolom(m[4]), absK: m[3] === '$', a: a2, z: a2 + m[3].length + m[4].length });
      i += m[0].length;
      continue;
    }
    m = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)(?![A-Za-z0-9_(.])/.exec(sisa);
    if (m) {
      t.push({
        j: 'ref',
        kolom: hurufKeKolom(m[2]),
        baris: Number(m[4]),
        absK: m[1] === '$',
        absB: m[3] === '$',
        a: i,
        z: i + m[0].length,
      });
      i += m[0].length;
      continue;
    }
    m = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(sisa);
    if (m) {
      t.push({ j: 'nama', v: m[0].toUpperCase(), a: i, z: i + m[0].length });
      i += m[0].length;
      continue;
    }
    m = /^(<=|>=|<>|[-+*/^&=<>%();:])/.exec(sisa);
    if (m) {
      t.push({ j: 'op', v: m[0], a: i, z: i + m[0].length });
      i += m[0].length;
      continue;
    }
    if (c === ',') throw new GalatRumus('koma', PESAN_KOMA);
    throw new GalatRumus('umum', `Tanda ${c} tidak dikenal di rumus Excel.`);
  }
  return t;
}

// ------------------------------------------------------------------ parser

type Simpul =
  | { j: 'angka'; v: number }
  | { j: 'teks'; v: string }
  | { j: 'logika'; v: boolean }
  | { j: 'ref'; kolom: number; baris: number }
  | { j: 'rentang'; k1: number; b1: number; k2: number; b2: number }
  | { j: 'fungsi'; nama: string; arg: Simpul[] }
  | { j: 'biner'; op: string; l: Simpul; r: Simpul }
  | { j: 'negatif'; e: Simpul }
  | { j: 'persen'; e: Simpul }
  | { j: 'nama-salah'; v: string }
  | { j: 'kosong' };

const BARIS_MAKS = 1000;

function urai(rumus: string): Simpul {
  const t = tokenisasi(rumus);
  let p = 0;
  const lihat = () => t[p];
  const isOp = (v: string) => {
    const x = t[p];
    return x !== undefined && x.j === 'op' && x.v === v;
  };
  const ambilOp = (v: string) => {
    if (!isOp(v)) {
      if (v === ')') throw new GalatRumus('kurung', 'Kurung buka ( dan kurung tutup ) belum seimbang.');
      throw new GalatRumus('umum', PESAN_UMUM);
    }
    p++;
  };

  function perbandingan(): Simpul {
    let l = gabung();
    for (;;) {
      const x = lihat();
      if (x && x.j === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(x.v)) {
        p++;
        l = { j: 'biner', op: x.v, l, r: gabung() };
      } else return l;
    }
  }
  function gabung(): Simpul {
    let l = tambah();
    while (isOp('&')) {
      p++;
      l = { j: 'biner', op: '&', l, r: tambah() };
    }
    return l;
  }
  function tambah(): Simpul {
    let l = kali();
    while (isOp('+') || isOp('-')) {
      const op = (t[p] as { v: string }).v;
      p++;
      l = { j: 'biner', op, l, r: kali() };
    }
    return l;
  }
  function kali(): Simpul {
    let l = pangkat();
    while (isOp('*') || isOp('/')) {
      const op = (t[p] as { v: string }).v;
      p++;
      l = { j: 'biner', op, l, r: pangkat() };
    }
    return l;
  }
  function pangkat(): Simpul {
    let l = persen();
    while (isOp('^')) {
      p++;
      l = { j: 'biner', op: '^', l, r: persen() };
    }
    return l;
  }
  function persen(): Simpul {
    let e = unary();
    while (isOp('%')) {
      p++;
      e = { j: 'persen', e };
    }
    return e;
  }
  function unary(): Simpul {
    if (isOp('-')) {
      p++;
      return { j: 'negatif', e: unary() };
    }
    if (isOp('+')) {
      p++;
      return unary();
    }
    return primer();
  }
  function primer(): Simpul {
    const x = lihat();
    if (!x) throw new GalatRumus('umum', PESAN_UMUM);
    if (x.j === 'angka') {
      p++;
      return { j: 'angka', v: x.v };
    }
    if (x.j === 'teks') {
      p++;
      return { j: 'teks', v: x.v };
    }
    if (x.j === 'ref') {
      p++;
      if (isOp(':')) {
        p++;
        const y = lihat();
        if (!y || y.j !== 'ref') throw new GalatRumus('umum', 'Rentang sel ditulis dengan dua alamat, contoh B2:B6.');
        p++;
        return { j: 'rentang', k1: x.kolom, b1: x.baris, k2: y.kolom, b2: y.baris };
      }
      return { j: 'ref', kolom: x.kolom, baris: x.baris };
    }
    if (x.j === 'kolom') {
      p++;
      ambilOp(':');
      const y = lihat();
      if (!y || y.j !== 'kolom') throw new GalatRumus('umum', PESAN_UMUM);
      p++;
      return { j: 'rentang', k1: x.kolom, b1: 1, k2: y.kolom, b2: BARIS_MAKS };
    }
    if (x.j === 'nama') {
      p++;
      if (isOp('(')) {
        p++;
        const arg: Simpul[] = [];
        if (isOp(')')) {
          p++;
        } else {
          for (;;) {
            if (isOp(';') || isOp(')')) arg.push({ j: 'kosong' });
            else arg.push(perbandingan());
            if (isOp(';')) {
              p++;
              continue;
            }
            ambilOp(')');
            break;
          }
        }
        const f = FUNGSI[x.v];
        if (f && (arg.length < f.min || arg.length > f.maks)) {
          throw new GalatRumus(
            'argumen',
            arg.length < f.min
              ? `Bagian (argumen) fungsi ${x.v} kurang. ${x.v} butuh minimal ${f.min} bagian yang dipisah tanda ;.`
              : `Bagian (argumen) fungsi ${x.v} terlalu banyak. Maksimal ${f.maks} bagian.`
          );
        }
        if (!f) return { j: 'nama-salah', v: x.v };
        return { j: 'fungsi', nama: x.v, arg };
      }
      if (x.v === 'TRUE' || x.v === 'FALSE') return { j: 'logika', v: x.v === 'TRUE' };
      return { j: 'nama-salah', v: x.v };
    }
    if (x.j === 'op' && x.v === '(') {
      p++;
      const e = perbandingan();
      ambilOp(')');
      return e;
    }
    if (x.j === 'op' && x.v === ')') throw new GalatRumus('kurung', 'Kurung buka ( dan kurung tutup ) belum seimbang.');
    throw new GalatRumus('umum', PESAN_UMUM);
  }

  const hasil = perbandingan();
  if (p < t.length) {
    const x = t[p];
    if (x.j === 'op' && x.v === ')') throw new GalatRumus('kurung', 'Kurung buka ( dan kurung tutup ) belum seimbang.');
    throw new GalatRumus('umum', PESAN_UMUM);
  }
  return hasil;
}

/** Periksa penulisan rumus tanpa menghitung. Kembalikan pesan kesalahan atau null. */
export function periksaRumus(rumus: string): GalatRumus | null {
  try {
    urai(rumus.replace(/^=/, ''));
    return null;
  } catch (e) {
    if (e instanceof GalatRumus) return e;
    throw e;
  }
}

/** Nama fungsi yang dipakai di rumus (huruf besar, tanpa duplikat). */
export function fungsiDipakai(rumus: string): string[] {
  try {
    return [...new Set(tokenisasi(rumus.replace(/^=/, '')).filter((x, i, arr) => x.j === 'nama' && arr[i + 1]?.j === 'op' && (arr[i + 1] as { v: string }).v === '(').map((x) => (x as { v: string }).v))];
  } catch {
    return [];
  }
}

/** Apakah rumus memakai alamat sel (bukan hanya angka yang diketik langsung). */
export function pakaiAlamat(rumus: string): boolean {
  try {
    return tokenisasi(rumus.replace(/^=/, '')).some((x) => x.j === 'ref' || x.j === 'kolom');
  } catch {
    return false;
  }
}

/**
 * Geser rumus seperti saat disalin (AutoFill/copy-paste): alamat tanpa $ ikut bergeser,
 * alamat dengan $ tetap. Contoh geserRumus('=B2*$F$1', 0, 1) -> '=B3*$F$1'.
 */
export function geserRumus(rumus: string, dKolom: number, dBaris: number): string {
  if (!rumus.startsWith('=')) return rumus;
  const isi = rumus.slice(1);
  const t = tokenisasi(isi);
  let hasil = '';
  let akhir = 0;
  for (const x of t) {
    hasil += isi.slice(akhir, x.a);
    if (x.j === 'ref') {
      const k = x.absK ? x.kolom : x.kolom + dKolom;
      const b = x.absB ? x.baris : x.baris + dBaris;
      if (k < 1 || b < 1) hasil += '#REF!';
      else hasil += `${x.absK ? '$' : ''}${kolomKeHuruf(k)}${x.absB ? '$' : ''}${b}`;
    } else if (x.j === 'kolom') {
      const k = x.absK ? x.kolom : x.kolom + dKolom;
      hasil += `${x.absK ? '$' : ''}${kolomKeHuruf(Math.max(1, k))}`;
    } else {
      hasil += isi.slice(x.a, x.z);
    }
    akhir = x.z;
  }
  hasil += isi.slice(akhir);
  return '=' + hasil;
}

// ------------------------------------------------------------------ konversi nilai

const EPOCH = Date.UTC(1899, 11, 30);
const HARI = 86400000;

export function tanggalKeSerial(th: number, bl: number, tg: number): number {
  if (th < 1900) th += 1900;
  return Math.round((Date.UTC(th, bl - 1, tg) - EPOCH) / HARI);
}

export function serialKeTanggal(n: number): { th: number; bl: number; tg: number } {
  // Excel menganggap 1900 tahun kabisat (bawaan Lotus 1-2-3), jadi angka 1 sampai 59 bergeser satu hari.
  const hari = Math.floor(n) < 61 ? Math.floor(n) + 1 : Math.floor(n);
  const d = new Date(EPOCH + hari * HARI);
  return { th: d.getUTCFullYear(), bl: d.getUTCMonth() + 1, tg: d.getUTCDate() };
}

/**
 * Ubah isian sel yang bukan rumus menjadi nilai, seperti saat diketik di Excel (wilayah Indonesia):
 * "1.250.000" dan "2,5" jadi angka, "15%" jadi 0,15, "17/08/2026" jadi tanggal, awalan ' memaksa teks.
 */
export function uraiKonstanta(s: string): Nilai {
  if (s === '') return null;
  if (s.startsWith("'")) return s.slice(1);
  const t = s.trim();
  if (/^(true|false)$/i.test(t)) return t.toUpperCase() === 'TRUE';
  let m = /^(-?)(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?(%?)$/.exec(t);
  if (m) {
    const n = Number(`${m[1]}${m[2].replace(/\./g, '')}${m[3] ? '.' + m[3] : ''}`);
    return m[4] ? n / 100 : n;
  }
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (m) {
    const tg = Number(m[1]);
    const bl = Number(m[2]);
    if (bl >= 1 && bl <= 12 && tg >= 1 && tg <= 31) return tanggalKeSerial(Number(m[3]), bl, tg);
  }
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (m) {
    const bl = Number(m[2]);
    const tg = Number(m[3]);
    if (bl >= 1 && bl <= 12 && tg >= 1 && tg <= 31) return tanggalKeSerial(Number(m[1]), bl, tg);
  }
  return s;
}

function angkaUmum(n: number): string {
  if (!Number.isFinite(n)) return '#NUM!';
  let v = Number(n.toPrecision(11));
  if (Object.is(v, -0)) v = 0;
  let s = String(v);
  if (/e/.test(s)) s = v.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
  return s.replace('.', ',');
}

function ribuan(n: number, desimal: number): string {
  const neg = n < 0;
  const [bulat, pecahan] = Math.abs(n).toFixed(desimal).split('.');
  const b = bulat.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${neg ? '-' : ''}${b}${pecahan ? ',' + pecahan : ''}`;
}

export type FormatSel = 'umum' | 'ribuan' | 'rupiah' | 'desimal2' | 'persen' | 'tanggal';

/** Teks yang tampil di sel. */
export function tampilkan(v: Nilai | undefined, format: FormatSel = 'umum'): string {
  if (v === null || v === undefined) return '';
  if (isGalat(v)) return v.galat === LINGKAR ? '0' : v.galat;
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'string') return v;
  switch (format) {
    case 'ribuan':
      return ribuan(n0(v), 0);
    case 'rupiah':
      return (v < 0 ? '-Rp' : 'Rp') + ribuan(Math.abs(n0(v)), 0);
    case 'desimal2':
      return ribuan(v, 2);
    case 'persen':
      return ribuan(n0(v * 100), 0) + '%';
    case 'tanggal': {
      const d = serialKeTanggal(v);
      return `${String(d.tg).padStart(2, '0')}/${String(d.bl).padStart(2, '0')}/${d.th}`;
    }
    default:
      return angkaUmum(v);
  }
}
const n0 = (v: number) => Math.round(v + Math.sign(v) * 1e-9);

function keTeks(v: Nilai): string | Galat {
  if (isGalat(v)) return v;
  if (v === null) return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return angkaUmum(v);
  return v;
}

function keAngka(v: Nilai): number | Galat {
  if (isGalat(v)) return v;
  if (v === null) return 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') return v;
  const k = uraiKonstanta(v.trim());
  if (typeof k === 'number') return k;
  return G('#VALUE!');
}

function keLogika(v: Nilai): boolean | Galat {
  if (isGalat(v)) return v;
  if (v === null) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (/^true$/i.test(v)) return true;
  if (/^false$/i.test(v)) return false;
  return G('#VALUE!');
}

/** Bandingkan seperti Excel: angka < teks < logika, teks tidak membedakan huruf besar-kecil. */
function banding(a: Nilai, b: Nilai): number {
  const jenis = (v: Nilai) => (typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : typeof v === 'boolean' ? 2 : -1);
  if (a === null) a = typeof b === 'string' ? '' : typeof b === 'boolean' ? false : 0;
  if (b === null) b = typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0;
  const ja = jenis(a);
  const jb = jenis(b);
  if (ja !== jb) return ja - jb;
  if (typeof a === 'string' && typeof b === 'string') {
    const x = a.toLowerCase();
    const y = b.toLowerCase();
    return x < y ? -1 : x > y ? 1 : 0;
  }
  const x = Number(a);
  const y = Number(b);
  return Math.abs(x - y) < 1e-12 ? 0 : x < y ? -1 : 1;
}

function polaWildcard(teks: string): RegExp {
  let s = '';
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (c === '~' && i + 1 < teks.length) {
      s += teks[++i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    } else if (c === '*') s += '[\\s\\S]*';
    else if (c === '?') s += '[\\s\\S]';
    else s += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${s}$`, 'i');
}

/** Kriteria COUNTIF/SUMIF: 75, ">=75", "Lunas", "<>Lunas", "B*", "". */
function buatKriteria(k: Nilai): (v: Nilai) => boolean {
  if (typeof k === 'number') return (v) => {
    const n = typeof v === 'string' ? uraiKonstanta(v.trim()) : v;
    return typeof n === 'number' && Math.abs(n - k) < 1e-12;
  };
  if (typeof k === 'boolean') return (v) => v === k;
  if (k === null) return (v) => v === null || v === '' || v === 0;
  if (isGalat(k)) return (v) => isGalat(v) && v.galat === k.galat;
  const m = /^(<=|>=|<>|<|>|=)?([\s\S]*)$/.exec(k)!;
  const op = m[1] ?? '';
  const isi = m[2];
  const angka = isi === '' ? null : uraiKonstanta(isi);
  if (typeof angka === 'number') {
    return (v) => {
      // Seperti Excel: untuk kriteria "sama dengan", teks berisi angka ("0812001") ikut dibaca sebagai angka.
      if (typeof v === 'string' && (op === '' || op === '=' || op === '<>')) {
        const n = uraiKonstanta(v.trim());
        if (typeof n === 'number') v = n;
      }
      if (typeof v !== 'number') return op === '<>';
      switch (op) {
        case '<':
          return v < angka;
        case '>':
          return v > angka;
        case '<=':
          return v <= angka + 1e-12;
        case '>=':
          return v >= angka - 1e-12;
        case '<>':
          return Math.abs(v - angka) >= 1e-12;
        default:
          return Math.abs(v - angka) < 1e-12;
      }
    };
  }
  if (isi === '') {
    if (op === '<>') return (v) => v !== null && v !== '';
    if (op === '=' || op === '') return (v) => v === null || v === '';
    return () => false;
  }
  const pola = polaWildcard(isi);
  if (op === '' || op === '=') return (v) => typeof v === 'string' && pola.test(v);
  if (op === '<>') return (v) => !(typeof v === 'string' && pola.test(v));
  return (v) => {
    if (typeof v !== 'string') return false;
    const c = banding(v, isi);
    return op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0;
  };
}

// ------------------------------------------------------------------ evaluasi

interface Konteks {
  ambil(kolom: number, baris: number): Nilai;
}

type Hasil = Nilai | Matriks;
const isMatriks = (v: Hasil): v is Matriks => Array.isArray(v);

function tunggal(v: Hasil): Nilai {
  if (!isMatriks(v)) return v;
  if (v.length === 1 && v[0].length === 1) return v[0][0];
  return G('#VALUE!');
}

function nilaiSimpul(s: Simpul, k: Konteks): Hasil {
  switch (s.j) {
    case 'angka':
      return s.v;
    case 'teks':
      return s.v;
    case 'logika':
      return s.v;
    case 'kosong':
      return null;
    case 'nama-salah':
      return G('#NAME?');
    case 'ref':
      return k.ambil(s.kolom, s.baris);
    case 'rentang': {
      const m: Matriks = [];
      const b2 = Math.min(s.b2, BARIS_MAKS);
      for (let r = Math.min(s.b1, b2); r <= Math.max(s.b1, b2); r++) {
        const baris: Nilai[] = [];
        for (let c = Math.min(s.k1, s.k2); c <= Math.max(s.k1, s.k2); c++) baris.push(k.ambil(c, r));
        m.push(baris);
      }
      return m;
    }
    case 'negatif': {
      const v = keAngka(tunggal(nilaiSimpul(s.e, k)));
      return isGalat(v) ? v : -v;
    }
    case 'persen': {
      const v = keAngka(tunggal(nilaiSimpul(s.e, k)));
      return isGalat(v) ? v : v / 100;
    }
    case 'biner': {
      const l = tunggal(nilaiSimpul(s.l, k));
      const r = tunggal(nilaiSimpul(s.r, k));
      if (isGalat(l)) return l;
      if (isGalat(r)) return r;
      if (s.op === '&') {
        const a = keTeks(l);
        const b = keTeks(r);
        if (isGalat(a)) return a;
        if (isGalat(b)) return b;
        return a + b;
      }
      if (['=', '<>', '<', '>', '<=', '>='].includes(s.op)) {
        const c = banding(l, r);
        switch (s.op) {
          case '=':
            return c === 0;
          case '<>':
            return c !== 0;
          case '<':
            return c < 0;
          case '>':
            return c > 0;
          case '<=':
            return c <= 0;
          default:
            return c >= 0;
        }
      }
      const a = keAngka(l);
      const b = keAngka(r);
      if (isGalat(a)) return a;
      if (isGalat(b)) return b;
      switch (s.op) {
        case '+':
          return a + b;
        case '-':
          return a - b;
        case '*':
          return a * b;
        case '/':
          return b === 0 ? G('#DIV/0!') : a / b;
        default: {
          const h = Math.pow(a, b);
          return Number.isFinite(h) ? h : G('#NUM!');
        }
      }
    }
    case 'fungsi': {
      const f = FUNGSI[s.nama];
      return f.f(s.arg, k);
    }
  }
}

// ------------------------------------------------------------------ fungsi

type ImplFungsi = (arg: Simpul[], k: Konteks) => Hasil;
interface DefFungsi {
  min: number;
  maks: number;
  f: ImplFungsi;
}

const ev = (s: Simpul | undefined, k: Konteks): Hasil => (s ? nilaiSimpul(s, k) : null);
const evT = (s: Simpul | undefined, k: Konteks): Nilai => tunggal(ev(s, k));
const ada = (s: Simpul | undefined) => s !== undefined && s.j !== 'kosong';

function sebagaiMatriks(s: Simpul, k: Konteks): Matriks {
  const v = nilaiSimpul(s, k);
  return isMatriks(v) ? v : [[v]];
}

/** Kumpulkan angka untuk SUM/AVERAGE/MIN/MAX: dari rentang hanya angka; argumen langsung diubah ke angka. */
function kumpulkanAngka(arg: Simpul[], k: Konteks): number[] | Galat {
  const hasil: number[] = [];
  for (const a of arg) {
    if (a.j === 'kosong') {
      hasil.push(0);
      continue;
    }
    const v = nilaiSimpul(a, k);
    if (isMatriks(v) || a.j === 'ref') {
      for (const x of isMatriks(v) ? v.flat() : [v]) {
        if (isGalat(x)) return x;
        if (typeof x === 'number') hasil.push(x);
      }
    } else {
      const n = keAngka(v);
      if (isGalat(n)) return n;
      hasil.push(n);
    }
  }
  return hasil;
}

function bulatkan(x: number, d: number, cara: 'biasa' | 'atas' | 'bawah'): number {
  const f = Math.pow(10, d);
  const v = Number((Math.abs(x) * f).toPrecision(15));
  const r = cara === 'biasa' ? Math.round(v) : cara === 'atas' ? Math.ceil(v) : Math.floor(v);
  return (Math.sign(x) * r) / f;
}

function fBulat(cara: 'biasa' | 'atas' | 'bawah'): DefFungsi {
  return {
    min: 2,
    maks: 2,
    f: (a, k) => {
      const x = keAngka(evT(a[0], k));
      const d = ada(a[1]) ? keAngka(evT(a[1], k)) : 0;
      if (isGalat(x)) return x;
      if (isGalat(d)) return d;
      return bulatkan(x, Math.trunc(d), cara);
    },
  };
}

function fTeks(fn: (t: string, a: Simpul[], k: Konteks) => Nilai, min = 1, maks = 1): DefFungsi {
  return {
    min,
    maks,
    f: (a, k) => {
      const t = keTeks(evT(a[0], k));
      if (isGalat(t)) return t;
      return fn(t, a, k);
    },
  };
}

function fTanggal(fn: (d: { th: number; bl: number; tg: number }) => number): DefFungsi {
  return {
    min: 1,
    maks: 1,
    f: (a, k) => {
      const n = keAngka(evT(a[0], k));
      if (isGalat(n)) return n;
      if (n < 0) return G('#NUM!');
      return fn(serialKeTanggal(n));
    },
  };
}

/** COUNTIFS/SUMIFS/AVERAGEIFS: daftar baris (indeks datar) yang memenuhi semua pasangan rentang-kriteria. */
function cocokSemua(pasangan: Simpul[], k: Konteks): { jumlah: number; cocok: boolean[]; bentuk: [number, number] } | Galat {
  let bentuk: [number, number] | null = null;
  let cocok: boolean[] = [];
  for (let i = 0; i < pasangan.length; i += 2) {
    const m = sebagaiMatriks(pasangan[i], k);
    const kr = evT(pasangan[i + 1], k);
    const b: [number, number] = [m.length, m[0]?.length ?? 0];
    if (!bentuk) {
      bentuk = b;
      cocok = new Array(b[0] * b[1]).fill(true);
    } else if (b[0] !== bentuk[0] || b[1] !== bentuk[1]) return G('#VALUE!');
    const uji = buatKriteria(kr);
    m.flat().forEach((v, j) => {
      if (!uji(v)) cocok[j] = false;
    });
  }
  return { jumlah: cocok.filter(Boolean).length, cocok, bentuk: bentuk ?? [0, 0] };
}

function cariPersis(daftar: Nilai[], dicari: Nilai, wildcard: boolean): number {
  if (typeof dicari === 'string' && wildcard && /[*?~]/.test(dicari)) {
    const pola = polaWildcard(dicari);
    return daftar.findIndex((v) => typeof v === 'string' && pola.test(v));
  }
  return daftar.findIndex((v) => v !== null && typeof v === typeof dicari && banding(v, dicari) === 0);
}

/** Cocok kira-kira (VLOOKUP TRUE, MATCH 1): posisi terakhir yang <= dicari pada data urut naik. */
function cariKiraKira(daftar: Nilai[], dicari: Nilai): number {
  let hasil = -1;
  for (let i = 0; i < daftar.length; i++) {
    const v = daftar[i];
    if (v === null || typeof v !== typeof dicari) continue;
    if (banding(v, dicari) <= 0) hasil = i;
    else break;
  }
  return hasil;
}

function fLookup(arah: 'v' | 'h'): DefFungsi {
  return {
    min: 3,
    maks: 4,
    f: (a, k) => {
      const dicari = evT(a[0], k);
      if (isGalat(dicari)) return dicari;
      const t = sebagaiMatriks(a[1], k);
      const n = keAngka(evT(a[2], k));
      if (isGalat(n)) return n;
      const cara = ada(a[3]) ? keLogika(evT(a[3], k)) : true;
      if (isGalat(cara)) return cara;
      const ke = Math.trunc(n);
      if (ke < 1) return G('#VALUE!');
      const lebar = arah === 'v' ? t[0]?.length ?? 0 : t.length;
      if (ke > lebar) return G('#REF!');
      const kunci = arah === 'v' ? t.map((r) => r[0]) : t[0] ?? [];
      const i = cara ? cariKiraKira(kunci, dicari) : cariPersis(kunci, dicari, true);
      if (i < 0) return G('#N/A');
      const v = arah === 'v' ? t[i][ke - 1] : t[ke - 1][i];
      return v === null ? 0 : v;
    },
  };
}

function datar1D(m: Matriks): Nilai[] | null {
  if (m.length === 1) return m[0];
  if (m.every((r) => r.length === 1)) return m.map((r) => r[0]);
  return null;
}

function agregatJika(jenis: 'sum' | 'avg' | 'max' | 'min'): ImplFungsi {
  return (a, k) => {
    const sumber = sebagaiMatriks(a[0], k).flat();
    const c = cocokSemua(a.slice(1), k);
    if (isGalat(c)) return c;
    if (sumber.length !== c.cocok.length) return G('#VALUE!');
    const angka: number[] = [];
    for (let i = 0; i < sumber.length; i++) {
      if (!c.cocok[i]) continue;
      const v = sumber[i];
      if (isGalat(v)) return v;
      if (typeof v === 'number') angka.push(v);
    }
    if (jenis === 'sum') return angka.reduce((x, y) => x + y, 0);
    if (jenis === 'avg') return angka.length ? angka.reduce((x, y) => x + y, 0) / angka.length : G('#DIV/0!');
    if (!angka.length) return 0;
    return jenis === 'max' ? Math.max(...angka) : Math.min(...angka);
  };
}

const FUNGSI: Record<string, DefFungsi> = {
  SUM: { min: 1, maks: 255, f: (a, k) => { const v = kumpulkanAngka(a, k); return isGalat(v) ? v : v.reduce((x, y) => x + y, 0); } },
  AVERAGE: {
    min: 1,
    maks: 255,
    f: (a, k) => {
      const v = kumpulkanAngka(a, k);
      if (isGalat(v)) return v;
      return v.length ? v.reduce((x, y) => x + y, 0) / v.length : G('#DIV/0!');
    },
  },
  MIN: { min: 1, maks: 255, f: (a, k) => { const v = kumpulkanAngka(a, k); return isGalat(v) ? v : v.length ? Math.min(...v) : 0; } },
  MAX: { min: 1, maks: 255, f: (a, k) => { const v = kumpulkanAngka(a, k); return isGalat(v) ? v : v.length ? Math.max(...v) : 0; } },
  PRODUCT: { min: 1, maks: 255, f: (a, k) => { const v = kumpulkanAngka(a, k); return isGalat(v) ? v : v.reduce((x, y) => x * y, 1); } },
  MEDIAN: {
    min: 1,
    maks: 255,
    f: (a, k) => {
      const v = kumpulkanAngka(a, k);
      if (isGalat(v)) return v;
      if (!v.length) return G('#NUM!');
      const s = [...v].sort((x, y) => x - y);
      const t = Math.floor(s.length / 2);
      return s.length % 2 ? s[t] : (s[t - 1] + s[t]) / 2;
    },
  },
  COUNT: {
    min: 1,
    maks: 255,
    f: (a, k) => {
      let n = 0;
      for (const s of a) {
        const v = ev(s, k);
        if (isMatriks(v) || s.j === 'ref') n += (isMatriks(v) ? v.flat() : [v]).filter((x) => typeof x === 'number').length;
        else if (typeof keAngka(v) === 'number' && v !== null) n++;
      }
      return n;
    },
  },
  COUNTA: {
    min: 1,
    maks: 255,
    f: (a, k) => {
      let n = 0;
      for (const s of a) {
        const v = ev(s, k);
        n += (isMatriks(v) ? v.flat() : [v]).filter((x) => x !== null).length;
      }
      return n;
    },
  },
  COUNTBLANK: { min: 1, maks: 1, f: (a, k) => sebagaiMatriks(a[0], k).flat().filter((x) => x === null || x === '').length },
  ROUND: fBulat('biasa'),
  ROUNDUP: fBulat('atas'),
  ROUNDDOWN: fBulat('bawah'),
  INT: { min: 1, maks: 1, f: (a, k) => { const x = keAngka(evT(a[0], k)); return isGalat(x) ? x : Math.floor(x); } },
  ABS: { min: 1, maks: 1, f: (a, k) => { const x = keAngka(evT(a[0], k)); return isGalat(x) ? x : Math.abs(x); } },
  SQRT: { min: 1, maks: 1, f: (a, k) => { const x = keAngka(evT(a[0], k)); return isGalat(x) ? x : x < 0 ? G('#NUM!') : Math.sqrt(x); } },
  POWER: {
    min: 2,
    maks: 2,
    f: (a, k) => {
      const x = keAngka(evT(a[0], k));
      const y = keAngka(evT(a[1], k));
      if (isGalat(x)) return x;
      if (isGalat(y)) return y;
      return Math.pow(x, y);
    },
  },
  MOD: {
    min: 2,
    maks: 2,
    f: (a, k) => {
      const x = keAngka(evT(a[0], k));
      const y = keAngka(evT(a[1], k));
      if (isGalat(x)) return x;
      if (isGalat(y)) return y;
      if (y === 0) return G('#DIV/0!');
      return x - y * Math.floor(x / y);
    },
  },
  IF: {
    min: 2,
    maks: 3,
    f: (a, k) => {
      const c = keLogika(evT(a[0], k));
      if (isGalat(c)) return c;
      if (c) return ada(a[1]) ? evT(a[1], k) : 0;
      if (a.length < 3) return false;
      return ada(a[2]) ? evT(a[2], k) : 0;
    },
  },
  IFS: {
    min: 2,
    maks: 254,
    f: (a, k) => {
      if (a.length % 2) return G('#N/A');
      for (let i = 0; i < a.length; i += 2) {
        const c = keLogika(evT(a[i], k));
        if (isGalat(c)) return c;
        if (c) return evT(a[i + 1], k);
      }
      return G('#N/A');
    },
  },
  AND: { min: 1, maks: 255, f: (a, k) => logikaBanyak(a, k, 'and') },
  OR: { min: 1, maks: 255, f: (a, k) => logikaBanyak(a, k, 'or') },
  NOT: { min: 1, maks: 1, f: (a, k) => { const c = keLogika(evT(a[0], k)); return isGalat(c) ? c : !c; } },
  IFERROR: { min: 2, maks: 2, f: (a, k) => { const v = evT(a[0], k); return isGalat(v) ? evT(a[1], k) : v; } },
  IFNA: { min: 2, maks: 2, f: (a, k) => { const v = evT(a[0], k); return isGalat(v) && v.galat === '#N/A' ? evT(a[1], k) : v; } },
  COUNTIF: {
    min: 2,
    maks: 2,
    f: (a, k) => {
      const uji = buatKriteria(evT(a[1], k));
      return sebagaiMatriks(a[0], k).flat().filter(uji).length;
    },
  },
  COUNTIFS: {
    min: 2,
    maks: 254,
    f: (a, k) => {
      if (a.length % 2) return G('#VALUE!');
      const c = cocokSemua(a, k);
      return isGalat(c) ? c : c.jumlah;
    },
  },
  SUMIF: {
    min: 2,
    maks: 3,
    f: (a, k) => agregatJika('sum')([ada(a[2]) ? a[2] : a[0], a[0], a[1]], k),
  },
  AVERAGEIF: {
    min: 2,
    maks: 3,
    f: (a, k) => agregatJika('avg')([ada(a[2]) ? a[2] : a[0], a[0], a[1]], k),
  },
  SUMIFS: { min: 3, maks: 255, f: (a, k) => (a.length % 2 ? agregatJika('sum')(a, k) : G('#VALUE!')) },
  AVERAGEIFS: { min: 3, maks: 255, f: (a, k) => (a.length % 2 ? agregatJika('avg')(a, k) : G('#VALUE!')) },
  MAXIFS: { min: 3, maks: 255, f: (a, k) => (a.length % 2 ? agregatJika('max')(a, k) : G('#VALUE!')) },
  MINIFS: { min: 3, maks: 255, f: (a, k) => (a.length % 2 ? agregatJika('min')(a, k) : G('#VALUE!')) },
  LEFT: fTeks((t, a, k) => {
    const n = ada(a[1]) ? keAngka(evT(a[1], k)) : 1;
    if (isGalat(n)) return n;
    return n < 0 ? G('#VALUE!') : t.slice(0, Math.trunc(n));
  }, 1, 2),
  RIGHT: fTeks((t, a, k) => {
    const n = ada(a[1]) ? keAngka(evT(a[1], k)) : 1;
    if (isGalat(n)) return n;
    if (n < 0) return G('#VALUE!');
    const m = Math.trunc(n);
    return m === 0 ? '' : t.slice(-m);
  }, 1, 2),
  MID: fTeks((t, a, k) => {
    const s = keAngka(evT(a[1], k));
    const n = keAngka(evT(a[2], k));
    if (isGalat(s)) return s;
    if (isGalat(n)) return n;
    if (s < 1 || n < 0) return G('#VALUE!');
    return t.substr(Math.trunc(s) - 1, Math.trunc(n));
  }, 3, 3),
  LEN: fTeks((t) => t.length),
  TRIM: fTeks((t) => t.replace(/ +/g, ' ').trim()),
  UPPER: fTeks((t) => t.toUpperCase()),
  LOWER: fTeks((t) => t.toLowerCase()),
  PROPER: fTeks((t) => t.toLowerCase().replace(/(^|[^a-zA-ZÀ-ɏ])([a-zà-ɏ])/g, (_m, p1: string, p2: string) => p1 + p2.toUpperCase())),
  VALUE: fTeks((t) => {
    const v = uraiKonstanta(t.trim());
    return typeof v === 'number' ? v : G('#VALUE!');
  }),
  REPT: fTeks((t, a, k) => {
    const n = keAngka(evT(a[1], k));
    if (isGalat(n)) return n;
    return n < 0 ? G('#VALUE!') : t.repeat(Math.trunc(n));
  }, 2, 2),
  EXACT: {
    min: 2,
    maks: 2,
    f: (a, k) => {
      const x = keTeks(evT(a[0], k));
      const y = keTeks(evT(a[1], k));
      if (isGalat(x)) return x;
      if (isGalat(y)) return y;
      return x === y;
    },
  },
  SUBSTITUTE: fTeks((t, a, k) => {
    const lama = keTeks(evT(a[1], k));
    const baru = keTeks(evT(a[2], k));
    if (isGalat(lama)) return lama;
    if (isGalat(baru)) return baru;
    if (lama === '') return t;
    if (!ada(a[3])) return t.split(lama).join(baru);
    const ke = keAngka(evT(a[3], k));
    if (isGalat(ke)) return ke;
    if (ke < 1) return G('#VALUE!');
    let i = -1;
    for (let n = 0; n < ke; n++) {
      i = t.indexOf(lama, i + 1);
      if (i < 0) return t;
    }
    return t.slice(0, i) + baru + t.slice(i + lama.length);
  }, 3, 4),
  FIND: { min: 2, maks: 3, f: (a, k) => cariTeks(a, k, true) },
  SEARCH: { min: 2, maks: 3, f: (a, k) => cariTeks(a, k, false) },
  CONCAT: {
    min: 1,
    maks: 255,
    f: (a, k) => {
      let s = '';
      for (const x of a) {
        const v = ev(x, k);
        for (const y of isMatriks(v) ? v.flat() : [v]) {
          const t = keTeks(y);
          if (isGalat(t)) return t;
          s += t;
        }
      }
      return s;
    },
  },
  CONCATENATE: {
    min: 1,
    maks: 255,
    f: (a, k) => {
      let s = '';
      for (const x of a) {
        const t = keTeks(evT(x, k));
        if (isGalat(t)) return t;
        s += t;
      }
      return s;
    },
  },
  TEXTJOIN: {
    min: 3,
    maks: 255,
    f: (a, k) => {
      const pemisah = keTeks(evT(a[0], k));
      const lewati = keLogika(evT(a[1], k));
      if (isGalat(pemisah)) return pemisah;
      if (isGalat(lewati)) return lewati;
      const bagian: string[] = [];
      for (const x of a.slice(2)) {
        const v = ev(x, k);
        for (const y of isMatriks(v) ? v.flat() : [v]) {
          const t = keTeks(y);
          if (isGalat(t)) return t;
          if (lewati && t === '') continue;
          bagian.push(t);
        }
      }
      return bagian.join(pemisah);
    },
  },
  DATE: {
    min: 3,
    maks: 3,
    f: (a, k) => {
      const th = keAngka(evT(a[0], k));
      const bl = keAngka(evT(a[1], k));
      const tg = keAngka(evT(a[2], k));
      if (isGalat(th)) return th;
      if (isGalat(bl)) return bl;
      if (isGalat(tg)) return tg;
      return tanggalKeSerial(Math.trunc(th), Math.trunc(bl), Math.trunc(tg));
    },
  },
  TODAY: {
    min: 0,
    maks: 0,
    f: () => {
      const d = new Date();
      return tanggalKeSerial(d.getFullYear(), d.getMonth() + 1, d.getDate());
    },
  },
  YEAR: fTanggal((d) => d.th),
  MONTH: fTanggal((d) => d.bl),
  DAY: fTanggal((d) => d.tg),
  WEEKDAY: {
    min: 1,
    maks: 2,
    f: (a, k) => {
      const n = keAngka(evT(a[0], k));
      const tipe = ada(a[1]) ? keAngka(evT(a[1], k)) : 1;
      if (isGalat(n)) return n;
      if (isGalat(tipe)) return tipe;
      const minggu0 = (((Math.floor(n) - 1) % 7) + 7) % 7; // 0 = Minggu
      if (tipe === 1) return minggu0 + 1;
      if (tipe === 2) return ((minggu0 + 6) % 7) + 1;
      if (tipe === 3) return (minggu0 + 6) % 7;
      return G('#NUM!');
    },
  },
  DATEDIF: {
    min: 3,
    maks: 3,
    f: (a, k) => {
      const x = keAngka(evT(a[0], k));
      const y = keAngka(evT(a[1], k));
      const u = keTeks(evT(a[2], k));
      if (isGalat(x)) return x;
      if (isGalat(y)) return y;
      if (isGalat(u)) return u;
      if (x > y) return G('#NUM!');
      const d1 = serialKeTanggal(x);
      const d2 = serialKeTanggal(y);
      let bulan = (d2.th - d1.th) * 12 + (d2.bl - d1.bl);
      if (d2.tg < d1.tg) bulan--;
      switch (u.toUpperCase()) {
        case 'D':
          return Math.floor(y) - Math.floor(x);
        case 'M':
          return bulan;
        case 'Y':
          return Math.floor(bulan / 12);
        case 'YM':
          return bulan % 12;
        case 'MD': {
          if (d2.tg >= d1.tg) return d2.tg - d1.tg;
          const awalBulan = tanggalKeSerial(d2.th, d2.bl, 1);
          const hariBulanLalu = serialKeTanggal(awalBulan - 1).tg;
          return hariBulanLalu - d1.tg + d2.tg;
        }
        default:
          return G('#NUM!');
      }
    },
  },
  VLOOKUP: fLookup('v'),
  HLOOKUP: fLookup('h'),
  MATCH: {
    min: 2,
    maks: 3,
    f: (a, k) => {
      const dicari = evT(a[0], k);
      if (isGalat(dicari)) return dicari;
      const d = datar1D(sebagaiMatriks(a[1], k));
      if (!d) return G('#N/A');
      const tipe = ada(a[2]) ? keAngka(evT(a[2], k)) : 1;
      if (isGalat(tipe)) return tipe;
      let i: number;
      if (tipe === 0) i = cariPersis(d, dicari, true);
      else if (tipe > 0) i = cariKiraKira(d, dicari);
      else {
        i = -1;
        for (let j = 0; j < d.length; j++) {
          const v = d[j];
          if (v === null || typeof v !== typeof dicari) continue;
          if (banding(v, dicari) >= 0) i = j;
          else break;
        }
      }
      return i < 0 ? G('#N/A') : i + 1;
    },
  },
  INDEX: {
    min: 2,
    maks: 3,
    f: (a, k) => {
      const m = sebagaiMatriks(a[0], k);
      const r = keAngka(evT(a[1], k));
      const c = ada(a[2]) ? keAngka(evT(a[2], k)) : null;
      if (isGalat(r)) return r;
      if (c !== null && isGalat(c)) return c;
      let baris = Math.trunc(r);
      let kolom = c === null ? 1 : Math.trunc(c);
      if (c === null && m.length === 1) {
        kolom = baris;
        baris = 1;
      }
      if (baris < 1 || kolom < 1) return G('#VALUE!');
      if (baris > m.length || kolom > (m[0]?.length ?? 0)) return G('#REF!');
      const v = m[baris - 1][kolom - 1];
      return v === null ? 0 : v;
    },
  },
  XLOOKUP: {
    min: 3,
    maks: 6,
    f: (a, k) => {
      const dicari = evT(a[0], k);
      if (isGalat(dicari)) return dicari;
      const cari = datar1D(sebagaiMatriks(a[1], k));
      const kembali = sebagaiMatriks(a[2], k);
      const kembali1 = datar1D(kembali);
      if (!cari || !kembali1 || kembali1.length !== cari.length) return G('#VALUE!');
      const mode = ada(a[4]) ? keAngka(evT(a[4], k)) : 0;
      const arahCari = ada(a[5]) ? keAngka(evT(a[5], k)) : 1;
      if (isGalat(mode)) return mode;
      if (isGalat(arahCari)) return arahCari;
      const urutan = cari.map((_, i) => i);
      if (arahCari < 0) urutan.reverse();
      let i = -1;
      for (const j of urutan) {
        const v = cari[j];
        if (mode === 2 && typeof dicari === 'string' ? typeof v === 'string' && polaWildcard(dicari).test(v) : v !== null && typeof v === typeof dicari && banding(v, dicari) === 0) {
          i = j;
          break;
        }
      }
      if (i < 0 && (mode === -1 || mode === 1)) {
        let terbaik: number | null = null;
        cari.forEach((v, j) => {
          if (v === null || typeof v !== typeof dicari) return;
          const c = banding(v, dicari);
          if (mode === -1 ? c < 0 : c > 0) {
            if (terbaik === null || (mode === -1 ? banding(v, cari[terbaik]) > 0 : banding(v, cari[terbaik]) < 0)) terbaik = j;
          }
        });
        if (terbaik !== null) i = terbaik;
      }
      if (i < 0) return ada(a[3]) ? evT(a[3], k) : G('#N/A');
      const v = kembali1[i];
      return v === null ? 0 : v;
    },
  },
  RANK: fRank(),
  'RANK.EQ': fRank(),
  LARGE: fKe('besar'),
  SMALL: fKe('kecil'),
  SUMPRODUCT: {
    min: 1,
    maks: 255,
    f: (a, k) => {
      const ms = a.map((x) => sebagaiMatriks(x, k));
      const n = ms[0].flat().length;
      if (ms.some((m) => m.flat().length !== n)) return G('#VALUE!');
      let total = 0;
      for (let i = 0; i < n; i++) {
        let hasil = 1;
        for (const m of ms) {
          const v = m.flat()[i];
          if (isGalat(v)) return v;
          hasil *= typeof v === 'number' ? v : 0;
        }
        total += hasil;
      }
      return total;
    },
  },
};

function logikaBanyak(a: Simpul[], k: Konteks, cara: 'and' | 'or'): Nilai {
  const nilai: boolean[] = [];
  for (const s of a) {
    const v = ev(s, k);
    if (isMatriks(v) || s.j === 'ref') {
      for (const x of isMatriks(v) ? v.flat() : [v]) {
        if (isGalat(x)) return x;
        if (typeof x === 'boolean') nilai.push(x);
        else if (typeof x === 'number') nilai.push(x !== 0);
      }
    } else {
      const b = keLogika(v);
      if (isGalat(b)) return b;
      nilai.push(b);
    }
  }
  if (!nilai.length) return G('#VALUE!');
  return cara === 'and' ? nilai.every(Boolean) : nilai.some(Boolean);
}

function cariTeks(a: Simpul[], k: Konteks, bedakanHuruf: boolean): Nilai {
  const cari = keTeks(evT(a[0], k));
  const dalam = keTeks(evT(a[1], k));
  const mulai = ada(a[2]) ? keAngka(evT(a[2], k)) : 1;
  if (isGalat(cari)) return cari;
  if (isGalat(dalam)) return dalam;
  if (isGalat(mulai)) return mulai;
  if (mulai < 1 || mulai > dalam.length + 1) return G('#VALUE!');
  const i = bedakanHuruf
    ? dalam.indexOf(cari, mulai - 1)
    : dalam.toLowerCase().indexOf(cari.toLowerCase(), mulai - 1);
  return i < 0 ? G('#VALUE!') : i + 1;
}

function fRank(): DefFungsi {
  return {
    min: 2,
    maks: 3,
    f: (a, k) => {
      const n = keAngka(evT(a[0], k));
      if (isGalat(n)) return n;
      const urut = ada(a[2]) ? keAngka(evT(a[2], k)) : 0;
      if (isGalat(urut)) return urut;
      const daftar = sebagaiMatriks(a[1], k).flat().filter((x): x is number => typeof x === 'number');
      if (!daftar.some((x) => Math.abs(x - n) < 1e-12)) return G('#N/A');
      return 1 + daftar.filter((x) => (urut === 0 ? x > n : x < n)).length;
    },
  };
}

function fKe(cara: 'besar' | 'kecil'): DefFungsi {
  return {
    min: 2,
    maks: 2,
    f: (a, k) => {
      const ke = keAngka(evT(a[1], k));
      if (isGalat(ke)) return ke;
      const daftar = sebagaiMatriks(a[0], k).flat().filter((x): x is number => typeof x === 'number');
      daftar.sort((x, y) => (cara === 'besar' ? y - x : x - y));
      const i = Math.ceil(ke);
      if (i < 1 || i > daftar.length) return G('#NUM!');
      return daftar[i - 1];
    },
  };
}

/** Daftar fungsi yang dikenal mesin ini (untuk tes). */
export const DAFTAR_FUNGSI = Object.keys(FUNGSI);

// ------------------------------------------------------------------ lembar kerja

export type IsiSel = string | number;

/** Satu lembar kerja: isi mentah setiap sel (angka, teks, atau rumus berawalan =). */
export class Lembar {
  isi: Map<string, IsiSel>;
  private cache = new Map<string, Nilai>();
  private sedang = new Set<string>();
  private rumusTerurai = new Map<string, Simpul | GalatRumus>();

  constructor(awal: Record<string, IsiSel> | Map<string, IsiSel> = {}) {
    this.isi = new Map(awal instanceof Map ? awal : Object.entries(awal).map(([a, v]) => [a.toUpperCase(), v]));
  }

  salin(): Lembar {
    return new Lembar(new Map(this.isi));
  }

  atur(a: string, v: IsiSel | null): void {
    const kunci = a.toUpperCase();
    if (v === null || v === '') this.isi.delete(kunci);
    else this.isi.set(kunci, v);
    this.cache.clear();
  }

  mentah(a: string): IsiSel | undefined {
    return this.isi.get(a.toUpperCase());
  }

  nilai(a: string): Nilai {
    const p = uraiAlamat(a);
    return p ? this.nilaiDi(p.kolom, p.baris) : G('#REF!');
  }

  /** Kolom dan baris terjauh yang berisi data. */
  batas(): { kolom: number; baris: number } {
    let kolom = 1;
    let baris = 1;
    for (const a of this.isi.keys()) {
      const p = uraiAlamat(a);
      if (!p) continue;
      kolom = Math.max(kolom, p.kolom);
      baris = Math.max(baris, p.baris);
    }
    return { kolom, baris };
  }

  private nilaiDi(kolom: number, baris: number): Nilai {
    const a = alamat(kolom, baris);
    const c = this.cache.get(a);
    if (c !== undefined) return c;
    const mentah = this.isi.get(a);
    if (mentah === undefined) return null;
    if (typeof mentah === 'number') return mentah;
    if (!mentah.startsWith('=')) {
      const v = uraiKonstanta(mentah);
      this.cache.set(a, v);
      return v;
    }
    if (this.sedang.has(a)) return G(LINGKAR);
    this.sedang.add(a);
    let simpul = this.rumusTerurai.get(mentah);
    if (!simpul) {
      try {
        simpul = urai(mentah.slice(1));
      } catch (e) {
        if (!(e instanceof GalatRumus)) throw e;
        simpul = e;
      }
      this.rumusTerurai.set(mentah, simpul);
    }
    let v: Nilai;
    if (simpul instanceof GalatRumus) v = G('#NAME?');
    else {
      const h = nilaiSimpul(simpul, { ambil: (k, b) => this.nilaiDi(k, b) });
      v = tunggal(h);
      if (v === null) v = 0;
    }
    this.sedang.delete(a);
    this.cache.set(a, v);
    return v;
  }
}

/** Hitung satu rumus terhadap lembar (tanpa menyimpannya ke sel). */
export function hitung(rumus: string, lembar: Lembar = new Lembar()): Nilai {
  const s = lembar.salin();
  s.atur('ZZZ999', rumus);
  return s.nilai('ZZZ999');
}

/**
 * Isi `sel` dengan `isi`, lalu kalau ada `sampai`, salin ke semua sel sampai alamat itu seperti AutoFill
 * (rumus digeser, alamat ber-$ tetap). Mengembalikan lembar baru.
 */
export function terapkanIsi(lembar: Lembar, sel: string, isi: string, sampai?: string): Lembar {
  const baru = lembar.salin();
  const asal = uraiAlamat(sel)!;
  for (const a of rentangAlamat(sel, sampai)) {
    const p = uraiAlamat(a)!;
    baru.atur(a, isi.startsWith('=') ? geserRumus(isi, p.kolom - asal.kolom, p.baris - asal.baris) : isi);
  }
  return baru;
}

// ------------------------------------------------------------------ pemeriksa langkah praktik

export interface LangkahCek {
  sel: string;
  sampai?: string;
  jawaban: string;
  wajib?: { pola: string; pesan: string }[];
  salah?: { pola: string; reaksi: string }[];
}

export interface HasilCek {
  benar: boolean;
  /** Penjelasan untuk pelajar (tanpa petunjuk langkah; komponen menambahkannya). */
  pesan?: string;
  /** Pesan sudah lengkap, jangan ditambah petunjuk langkah. */
  khusus?: boolean;
  lembar?: Lembar;
}

const ARTI_GALAT: Record<string, string> = {
  '#DIV/0!': '#DIV/0! artinya ada pembagian dengan nol atau dengan sel kosong.',
  '#N/A': '#N/A artinya data yang dicari tidak ditemukan di tabel.',
  '#NAME?': '#NAME? artinya ada nama fungsi yang salah ketik, atau teks yang lupa diberi tanda kutip "...".',
  '#VALUE!': '#VALUE! artinya ada teks yang ikut dihitung seperti angka, atau isi bagian rumusnya salah jenis.',
  '#REF!': '#REF! artinya rumus menunjuk sel yang tidak ada, misalnya nomor kolom VLOOKUP lebih besar dari lebar tabel.',
  '#NUM!': '#NUM! artinya angkanya tidak bisa dihitung, misalnya urutan tanggal terbalik.',
  [LINGKAR]: 'Rumus ini memakai selnya sendiri (circular reference), jadi Excel tidak bisa menghitungnya.',
};

export function artiGalat(kode: string): string {
  return ARTI_GALAT[kode] ?? '';
}

/** Rapikan ketikan: kutip miring dari HP jadi kutip lurus, spasi di awal/akhir dibuang. */
export function rapikanIsian(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
}

function samaPersis(a: Nilai, b: Nilai): boolean {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
  if (isGalat(a) && isGalat(b)) return a.galat === b.galat;
  return a === b;
}

/** Periksa ketikan pelajar untuk satu langkah praktik. */
export function cekLangkah(lembar: Lembar, langkah: LangkahCek, ketikan: string): HasilCek {
  const teks = rapikanIsian(ketikan);
  if (!teks) return { benar: false, pesan: 'Ketik dulu isinya, lalu tekan Enter.', khusus: true };
  const harusRumus = langkah.jawaban.startsWith('=');
  if (harusRumus && !teks.startsWith('=')) {
    if (/^[A-Za-z]+\(|^[A-Za-z]{1,3}\d+/.test(teks)) {
      return { benar: false, pesan: 'Rumus di Excel selalu diawali tanda sama dengan (=). Tanpa =, Excel menganggapnya teks biasa.', khusus: true };
    }
  }
  if (teks.startsWith('=')) {
    const g = periksaRumus(teks);
    if (g) return { benar: false, pesan: g.message, khusus: true };
  }

  const target = rentangAlamat(langkah.sel, langkah.sampai);
  const punyaPelajar = terapkanIsi(lembar, langkah.sel, teks, langkah.sampai);
  const kunci = terapkanIsi(lembar, langkah.sel, langkah.jawaban, langkah.sampai);
  const beda = target.find((a) => !samaPersis(punyaPelajar.nilai(a), kunci.nilai(a)));

  if (!beda) {
    for (const w of langkah.wajib ?? []) {
      if (!new RegExp(w.pola, 'i').test(teks)) return { benar: false, pesan: w.pesan, khusus: true };
    }
    if (harusRumus && pakaiAlamat(langkah.jawaban) && !pakaiAlamat(teks)) {
      return {
        benar: false,
        pesan: 'Hasilnya sudah benar, tapi angkanya diketik langsung. Pakai alamat sel (misalnya B2) supaya hasilnya ikut berubah kalau datanya berubah.',
        khusus: true,
      };
    }
    return { benar: true, lembar: punyaPelajar };
  }

  const tanpaSpasi = teks.replace(/\s+/g, '');
  for (const s of langkah.salah ?? []) {
    if (new RegExp(s.pola, 'i').test(tanpaSpasi)) return { benar: false, pesan: s.reaksi, khusus: true };
  }

  const vPelajar = punyaPelajar.nilai(beda);
  const vKunci = kunci.nilai(beda);
  const hasilnya = tampilkan(vPelajar) || '(kosong)';
  if (typeof vPelajar === 'string' && typeof vKunci === 'string' && vPelajar.toLowerCase() === vKunci.toLowerCase()) {
    return { benar: false, pesan: `Hampir! Hasilnya ${vPelajar}, tapi huruf besar-kecilnya harus sama persis dengan yang diminta.`, khusus: true };
  }
  const pertama = target[0];
  if (beda !== pertama && langkah.jawaban.includes('$') && !teks.includes('$')) {
    return {
      benar: false,
      pesan: `${pertama} sudah benar, tapi setelah disalin ke bawah, ${beda} jadi ${hasilnya}. Ada alamat yang harus dikunci dengan tanda $ supaya tidak ikut bergeser.`,
      khusus: true,
    };
  }
  if (isGalat(vPelajar)) {
    return { benar: false, pesan: `Hasil di ${beda} jadi ${vPelajar.galat === LINGKAR ? 'circular reference' : vPelajar.galat}. ${artiGalat(vPelajar.galat)}` };
  }
  return { benar: false, pesan: `Hasil di ${beda} jadi ${hasilnya}, belum sesuai.` };
}
