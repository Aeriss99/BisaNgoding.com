import type { UserProgress } from '../types/schema';
import { ringkasanKelas } from './kelas';

const ALFABET_KODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export interface DataSertifikat {
  kode: string;
  user_id: string;
  kelas_id: string;
  nama: string;
  terbit: string;
}

export function buatKodeSertifikat(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let segmen1 = '';
  let segmen2 = '';
  for (let i = 0; i < 4; i++) {
    segmen1 += ALFABET_KODE[bytes[i] % ALFABET_KODE.length];
  }
  for (let i = 4; i < 8; i++) {
    segmen2 += ALFABET_KODE[bytes[i] % ALFABET_KODE.length];
  }
  return `BN-${segmen1}-${segmen2}`;
}

export function formatTanggalSertifikat(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function syaratSertifikat(
  courseId: string,
  progress: UserProgress
): { lulus: boolean; persen: number; modulBelum: number; namaKelas: string } | null {
  const sanitizedProgress: UserProgress = progress.unlockAll
    ? { ...progress, unlockAll: false }
    : progress;

  const ringkasan = ringkasanKelas(courseId, sanitizedProgress);
  if (!ringkasan) return null;

  const rawName = ringkasan.course.namaPendek ?? ringkasan.course.title;
  const namaKelas = rawName.replace(/^Kelas\s+/, '');

  const modulBelum = ringkasan.modul.filter((m) => m.status !== 'selesai').length;
  const lulus = modulBelum === 0 && ringkasan.modul.length > 0;

  return {
    lulus,
    persen: ringkasan.persen,
    modulBelum,
    namaKelas,
  };
}
