import type { Course, DataJalurKarier, ItemJalur, JalurKarier } from '../types/schema';
import { coursesData, modulesData, getVisibleLessons } from './content';
import dataMentah from '../../content/jalur-karier.json';

export const dataJalur = dataMentah as DataJalurKarier;

/** Warna utama dan warna muda tiap jalur (sesuai desain). */
export const WARNA_JALUR: Record<JalurKarier['warna'], { utama: string; muda: string }> = {
  kuning: { utama: 'var(--color-primary)', muda: 'var(--color-primary-light)' },
  cyan: { utama: 'var(--color-landing-cyan)', muda: '#c9f7fa' },
  ungu: { utama: 'var(--color-landing-purple)', muda: 'var(--color-purple-light)' },
};

export function cariJalur(id: string | null | undefined): JalurKarier {
  return dataJalur.jalur.find((j) => j.id === id) ?? dataJalur.jalur[0];
}

/** Jumlah modul yang sudah bisa dipelajari di sebuah kelas. */
export function jumlahModulTersedia(courseId: string): number {
  return modulesData.filter(
    (m) => (m.courseId || 'java') === courseId && m.status !== 'draft' && getVisibleLessons(m.id).length > 0
  ).length;
}

export type JenisStatus = 'tersedia' | 'sebagian' | 'baru' | 'segera';

export interface StatusKartu {
  jenis: JenisStatus;
  /** Teks baris status, contoh "Tersedia · 8 modul" atau "Segera · Kelas baru". */
  teks: string;
  /** Alamat saat kartu diklik; kosong kalau kartu tidak bisa dibuka. */
  url?: string;
  /** Nama yang ditampilkan di kartu. */
  nama: string;
  kode: string;
}

function namaKelas(c: Course | undefined, id: string): string {
  return c ? c.namaPendek ?? c.title.replace(/^Kelas /, '') : id;
}

/** Status kartu kelas di jalur karier, fondasi, dan halaman Semua Kelas. */
export function statusKartu(item: Pick<ItemJalur, 'kelas' | 'nama' | 'meta' | 'sebagian' | 'modul'>): StatusKartu {
  const c = coursesData.find((x) => x.id === item.kelas);
  const nama = item.nama ?? namaKelas(c, item.kelas);
  const kode = c?.short ?? item.kelas.slice(0, 3).toUpperCase();
  const n = jumlahModulTersedia(item.kelas);
  if (c && c.status !== 'soon' && n > 0) {
    const url = item.modul ? `/kelas/${c.id}?modul=${item.modul}` : `/kelas/${c.id}`;
    if (item.sebagian) return { jenis: 'sebagian', teks: `${n} modul · ${item.sebagian}`, url, nama, kode };
    const meta = item.meta ? item.meta.replace('{n}', String(n)) : `${n} modul`;
    return { jenis: 'tersedia', teks: `Tersedia · ${meta}`, url, nama, kode };
  }
  if (c?.baru) return { jenis: 'baru', teks: 'Segera · Kelas baru', url: c.rencana ? `/kelas/${c.id}` : undefined, nama, kode };
  return { jenis: 'segera', teks: 'Segera hadir', nama, kode };
}

/** "tahap 1", "tahap 1 dan 2", "tahap 3 sampai 6", "tahap 3, 5 dan 6". */
export function formatTahap(nomor: number[]): string {
  const n = [...new Set(nomor)].sort((a, b) => a - b);
  if (n.length === 0) return '';
  if (n.length === 1) return `tahap ${n[0]}`;
  const berurutan = n.every((x, i) => i === 0 || x === n[i - 1] + 1);
  if (berurutan && n.length >= 3) return `tahap ${n[0]} sampai ${n[n.length - 1]}`;
  return `tahap ${n.slice(0, -1).join(', ')} dan ${n[n.length - 1]}`;
}

/**
 * Di jalur mana saja sebuah kelas dipakai. Fondasi selalu di atas,
 * lalu jalur diurutkan dari tahap paling awal.
 */
export function pemakaianKelas(courseId: string): { judul: string; keterangan: string }[] {
  const hasil: { judul: string; keterangan: string; urut: number }[] = [];
  const fondasi = dataJalur.fondasi.find((f) => f.kelas === courseId);
  if (fondasi) {
    hasil.push({ judul: 'Fondasi', keterangan: fondasi.bagian ? `semua jalur, bagian ${fondasi.bagian}` : 'semua jalur', urut: 0 });
  }
  for (const j of dataJalur.jalur) {
    const nomor = j.tahap
      .map((t, i) => (t.grup.some((g) => g.some((it) => it.kelas === courseId)) ? i + 1 : 0))
      .filter((x) => x > 0);
    if (nomor.length) hasil.push({ judul: j.judul, keterangan: formatTahap(nomor), urut: nomor[0] });
  }
  return hasil.sort((a, b) => a.urut - b.urut).map(({ judul, keterangan }) => ({ judul, keterangan }));
}
