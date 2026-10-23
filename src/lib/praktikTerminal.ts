import { rapikanKetikan } from './ketikan';

/**
 * Logika kartu "praktik_terminal": terminal tiruan dengan pemandu Lingga.
 *
 * Pola perintah boleh berisi isian {{nama}}. Isian menerima teks berkutip ("..." atau '...')
 * atau satu kata tanpa spasi, lalu disimpan ke variabel `nama`. Keluaran dan kata-kata Lingga
 * boleh memakai {{nama}} untuk menampilkan isian itu lagi (misalnya pesan commit pengguna).
 */

const KUNCI_SIMPAN = 'bn_praktik_terminal';
const POLA_ISIAN = /\{\{(\w+)\}\}/g;

/** Rapikan ketikan pengguna: kutip pintar, kutip tunggal, dan spasi ganda. */
export function rapikanPerintah(s: string): string {
  return rapikanKetikan(s).replace(/'/g, '"').replace(/\s+/g, ' ').trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface HasilCocok {
  cocok: boolean;
  /** Nilai isian yang ditangkap, tanpa tanda kutip. */
  isian: Record<string, string>;
}

/** Cocokkan ketikan dengan satu pola. */
export function cocokkanPola(pola: string, ketikan: string): HasilCocok {
  const p = rapikanPerintah(pola);
  const k = rapikanPerintah(ketikan);
  const nama: string[] = [];
  let sumber = '';
  let akhir = 0;
  for (const m of p.matchAll(POLA_ISIAN)) {
    sumber += escapeRegex(p.slice(akhir, m.index));
    sumber += '(?:"([^"]*\\S[^"]*)"|([^\\s"]+))';
    nama.push(m[1]);
    akhir = (m.index ?? 0) + m[0].length;
  }
  sumber += escapeRegex(p.slice(akhir));
  const hasil = new RegExp(`^${sumber}$`).exec(k);
  if (!hasil) return { cocok: false, isian: {} };
  const isian: Record<string, string> = {};
  nama.forEach((n, i) => {
    isian[n] = (hasil[1 + i * 2] ?? hasil[2 + i * 2] ?? '').trim();
  });
  return { cocok: true, isian };
}

/** Cocokkan ketikan dengan beberapa pola; kembalikan pola pertama yang cocok. */
export function cocokkanSalahSatu(pola: string[], ketikan: string): HasilCocok {
  for (const p of pola) {
    const h = cocokkanPola(p, ketikan);
    if (h.cocok) return h;
  }
  return { cocok: false, isian: {} };
}

/** Ganti {{nama}} dengan nilai variabel; kalau tidak ada, pakai nilai bawaan. */
export function isiTemplate(
  teks: string,
  nilai: Record<string, string>,
  bawaan: Record<string, string> = {}
): string {
  return teks.replace(POLA_ISIAN, (asli, n: string) => nilai[n] ?? bawaan[n] ?? asli);
}

/** Contoh perintah lengkap untuk tombol "Lihat jawabannya": isian diisi nilai bawaan berkutip. */
export function contohPerintah(
  pola: string,
  nilai: Record<string, string>,
  bawaan: Record<string, string> = {}
): string {
  return pola.replace(POLA_ISIAN, (asli, n: string) => {
    const v = nilai[n] ?? bawaan[n];
    return v === undefined ? asli : `"${v}"`;
  });
}

/** Variabel yang pernah diisi pengguna (nama, email, pesan commit), dipakai lintas materi. */
export function bacaVariabel(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KUNCI_SIMPAN);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === 'object' ? (data as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function simpanVariabel(baru: Record<string, string>): Record<string, string> {
  const gabung = { ...bacaVariabel(), ...baru };
  try {
    localStorage.setItem(KUNCI_SIMPAN, JSON.stringify(gabung));
  } catch {
    // penyimpanan diblokir: isian tetap dipakai selama halaman terbuka
  }
  return gabung;
}

/** Periksa teks yang ditempel pengguna dari terminalnya sendiri: semua pola harus ditemukan. */
export function cekTantangan(teks: string, pola: string[]): boolean {
  const t = rapikanKetikan(teks).trim();
  if (!t) return false;
  return pola.every((p) => {
    try {
      return new RegExp(p, 'im').test(t);
    } catch {
      return false;
    }
  });
}

export interface BagianTeks {
  jenis: 'teks' | 'kode' | 'tebal';
  isi: string;
}

/** Pecah teks Lingga menjadi bagian biasa, `kode`, dan **tebal** (tanpa HTML mentah). */
export function pecahTeks(teks: string): BagianTeks[] {
  const hasil: BagianTeks[] = [];
  const pola = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let akhir = 0;
  for (const m of teks.matchAll(pola)) {
    const i = m.index ?? 0;
    if (i > akhir) hasil.push({ jenis: 'teks', isi: teks.slice(akhir, i) });
    const s = m[0];
    if (s.startsWith('`')) hasil.push({ jenis: 'kode', isi: s.slice(1, -1) });
    else hasil.push({ jenis: 'tebal', isi: s.slice(2, -2) });
    akhir = i + s.length;
  }
  if (akhir < teks.length) hasil.push({ jenis: 'teks', isi: teks.slice(akhir) });
  return hasil;
}
