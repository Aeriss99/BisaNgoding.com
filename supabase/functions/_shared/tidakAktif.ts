export interface AkunEvaluasi {
  id: string;
  email: string;
  diperbarui?: string | null;
  last_sign_in_at?: string | null;
  banned_until?: string | null;
  terakhir_blokir_sampai?: string | null;
}

/**
 * Waktu aktif terakhir = greatest(progres.diperbarui, auth.users.last_sign_in_at, blokir_akun.sampai terakhir).
 */
export function hitungWaktuAktifTerakhir(akun: AkunEvaluasi): Date | null {
  const dates: number[] = [];
  if (akun.diperbarui) {
    const t = new Date(akun.diperbarui).getTime();
    if (!isNaN(t)) dates.push(t);
  }
  if (akun.last_sign_in_at) {
    const t = new Date(akun.last_sign_in_at).getTime();
    if (!isNaN(t)) dates.push(t);
  }
  if (akun.terakhir_blokir_sampai) {
    const t = new Date(akun.terakhir_blokir_sampai).getTime();
    if (!isNaN(t)) dates.push(t);
  }
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates));
}

/**
 * Evaluasi apakah akun memenuhi syarat blokir dan reset (7 hari tidak aktif).
 */
export function apakahPerluDiblokir(
  akun: AkunEvaluasi,
  daftarAdmin: string[] | Set<string>,
  now: Date = new Date()
): boolean {
  // 1. Lewati jika admin
  const emailLower = (akun.email || '').toLowerCase().trim();
  const isAdmin =
    daftarAdmin instanceof Set
      ? daftarAdmin.has(emailLower)
      : daftarAdmin.map((e) => e.toLowerCase().trim()).includes(emailLower);
  if (isAdmin) return false;

  // 2. Lewati jika akun saat ini sedang dalam masa blokir (banned_until masih di masa depan)
  if (akun.banned_until) {
    const bannedUntil = new Date(akun.banned_until);
    if (bannedUntil.getTime() > now.getTime()) {
      return false;
    }
  }

  // 3. Waktu aktif terakhir = greatest(diperbarui, last_sign_in_at, terakhir_blokir_sampai)
  const waktuAktif = hitungWaktuAktifTerakhir(akun);
  if (!waktuAktif) {
    return false;
  }

  // 4. Periksa apakah sudah lebih dari 7 hari
  const BATAS_7_HARI_MS = 7 * 24 * 60 * 60 * 1000;
  const selisihMs = now.getTime() - waktuAktif.getTime();

  return selisihMs > BATAS_7_HARI_MS;
}

/**
 * Menyaring semua akun yang harus diblokir dan di-reset progresnya.
 */
export function saringAkunTidakAktif(
  semuaAkun: AkunEvaluasi[],
  daftarAdmin: string[] | Set<string>,
  now: Date = new Date()
): AkunEvaluasi[] {
  return semuaAkun.filter((akun) => apakahPerluDiblokir(akun, daftarAdmin, now));
}
