import type { LangkahPython } from '../types/schema';
import { artiGalatPython, type HasilPython } from './pythonRunner';

export interface NilaiLangkah {
  benar: boolean;
  /** Penjelasan untuk pelajar. */
  pesan?: string;
  /** Pesan sudah lengkap, jangan ditambah petunjuk langkah. */
  khusus?: boolean;
}

/** Rapikan keluaran untuk dibandingkan: spasi di akhir setiap baris dan baris kosong di ujung dibuang. */
export function rapikanKeluaran(s: string): string {
  return s
    .replace(/\r/g, '')
    .split('\n')
    .map((b) => b.replace(/\s+$/, ''))
    .join('\n')
    .trim();
}

/** Buang kutip pembungkus hasil konsol: 'Sari' (tanpa print) dan Sari (dengan print) dianggap sama. */
function tanpaKutip(s: string): string {
  const m = /^'(.*)'$|^"(.*)"$/s.exec(s);
  return m ? (m[1] ?? m[2]) : s;
}

/** Keluaran sama, dengan atau tanpa print(). */
export function keluaranSama(hasil: string, harapan: string): boolean {
  const a = rapikanKeluaran(hasil);
  const b = rapikanKeluaran(harapan);
  return a === b || tanpaKutip(a) === tanpaKutip(b);
}

/** Baris terakhir pesan error, contoh "NameError: name 'x' is not defined". */
export function barisGalat(galat: string): string {
  const baris = galat.trim().split('\n').filter(Boolean);
  return baris[baris.length - 1] ?? '';
}

/**
 * Nilai satu baris yang diketik di konsol >>>.
 * `cekLolos`: hasil ekspresi `langkah.cek` setelah baris dijalankan (null kalau langkah tidak punya cek).
 */
export function nilaiLangkahPython(langkah: LangkahPython, ketikan: string, hasil: HasilPython, cekLolos: boolean | null): NilaiLangkah {
  const tanpaSpasi = ketikan.replace(/\s+/g, '');
  const reaksiSalah = () => {
    for (const s of langkah.salah ?? []) {
      if (new RegExp(s.pola, 'i').test(tanpaSpasi)) return s.reaksi;
    }
    return null;
  };

  if (!ketikan.trim()) return { benar: false, pesan: 'Ketik dulu perintahnya, lalu tekan Enter.', khusus: true };
  if (hasil.waktuHabis) return { benar: false, pesan: artiGalatPython('WaktuHabis'), khusus: true };

  if (langkah.galat) {
    if (hasil.jenisGalat === langkah.galat) return { benar: true };
    const r = reaksiSalah();
    if (r) return { benar: false, pesan: r, khusus: true };
    return { benar: false, pesan: `Langkah ini sengaja membuat ${langkah.galat}, tapi hasilnya ${hasil.jenisGalat || 'tidak ada error'}.` };
  }

  if (hasil.jenisGalat) {
    const r = reaksiSalah();
    if (r) return { benar: false, pesan: r, khusus: true };
    const arti = artiGalatPython(hasil.jenisGalat);
    return { benar: false, pesan: `Muncul error ${barisGalat(hasil.galat)}.${arti ? ` ${arti}` : ''}` };
  }

  const keluaranCocok = langkah.keluaran === undefined || keluaranSama(hasil.keluaran, langkah.keluaran);
  if (!keluaranCocok || cekLolos === false) {
    const r = reaksiSalah();
    if (r) return { benar: false, pesan: r, khusus: true };
    if (!keluaranCocok) {
      const k = rapikanKeluaran(hasil.keluaran);
      return { benar: false, pesan: k ? `Keluarannya ${k.length > 120 ? k.slice(0, 120) + '...' : k}, belum sesuai.` : 'Tidak ada keluaran, belum sesuai.' };
    }
    return { benar: false, pesan: 'Perintahnya jalan tanpa error, tapi hasilnya belum sesuai permintaan.' };
  }

  for (const w of langkah.wajib ?? []) {
    if (!new RegExp(w.pola, 'i').test(ketikan)) return { benar: false, pesan: w.pesan, khusus: true };
  }
  return { benar: true };
}
