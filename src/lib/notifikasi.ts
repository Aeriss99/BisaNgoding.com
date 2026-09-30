/**
 * Notifikasi lokal (tanpa server): dihitung dari progres dan daftar modul,
 * status "sudah dibaca" disimpan di localStorage perangkat.
 */
export interface Notifikasi {
  id: string;
  judul: string;
  isi: string;
  waktu: string;
  url?: string;
}

export interface ModulInfo {
  id: string;
  judul: string;
  kelasId: string;
  kelasJudul: string;
}

export interface QuizLulusInfo {
  modulId: string;
  judul: string;
  kelasId: string;
  /** Tanggal pertama kali perangkat ini melihat quiz lulus. */
  sejak: string;
  adaBerikutnya: boolean;
}

export interface DataNotifikasi {
  streak: number;
  lastActiveDate?: string;
  jumlahSelesai: number;
  hariIni: string; // YYYY-MM-DD
  /** Modul yang baru muncul sejak kunjungan sebelumnya, beserta tanggal pertama terlihat. */
  modulBaru: (ModulInfo & { sejak: string })[];
  /** Quiz yang baru lulus (terbaru dulu tidak wajib, diurutkan di sini). */
  quizLulus?: QuizLulusInfo[];
}

export function labelTanggal(tanggal: string, hariIni: string): string {
  if (tanggal === hariIni) return 'Hari ini';
  const a = new Date(tanggal + 'T00:00:00');
  const b = new Date(hariIni + 'T00:00:00');
  const selisih = Math.round((b.getTime() - a.getTime()) / 86400000);
  if (selisih === 1) return 'Kemarin';
  if (selisih > 1 && selisih < 7) return `${selisih} hari lalu`;
  return a.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function hitungNotifikasi(d: DataNotifikasi): Notifikasi[] {
  const hasil: Notifikasi[] = [];
  if (d.streak > 0 && d.lastActiveDate && d.lastActiveDate !== d.hariIni) {
    hasil.push({
      id: `streak-${d.hariIni}`,
      judul: `Jaga streak ${d.streak} hari kamu`,
      isi: 'Kamu belum belajar hari ini. Satu materi cukup.',
      waktu: 'Hari ini',
    });
  }
  if (d.jumlahSelesai === 0) {
    hasil.push({
      id: 'selamat-datang',
      judul: 'Selamat datang di BisaNgoding',
      isi: 'Pilih jalur karier, lalu mulai dari materi pertama.',
      waktu: 'Mulai',
      url: '/jalur',
    });
  }
  // Satu notifikasi per kelas per hari, supaya tidak membanjiri saat banyak modul terbit bersamaan.
  type Item = { sejak: string; n: Notifikasi };
  const item: Item[] = [];
  const grup = new Map<string, (ModulInfo & { sejak: string })[]>();
  for (const m of d.modulBaru) {
    const k = `${m.kelasId}|${m.sejak}`;
    grup.set(k, [...(grup.get(k) ?? []), m]);
  }
  for (const daftar of grup.values()) {
    const m = daftar[0];
    const jumlah = daftar.length;
    item.push({
      sejak: m.sejak,
      n: {
        id: jumlah === 1 ? `modul-baru-${m.id}` : `modul-baru-${m.kelasId}-${m.sejak}`,
        judul:
          jumlah === 1 ? `Modul baru: ${m.judul}` : jumlah === 2 ? `Modul baru: ${m.judul} dan ${daftar[1].judul}` : `${jumlah} modul baru di ${m.kelasJudul}`,
        isi:
          jumlah === 1
            ? `${m.kelasJudul} · sudah bisa dipelajari.`
            : jumlah === 2
              ? `Dua modul baru di ${m.kelasJudul} sudah bisa dipelajari.`
              : `Mulai dari ${m.judul}. Semuanya sudah bisa dipelajari.`,
        waktu: labelTanggal(m.sejak, d.hariIni),
        url: jumlah === 1 ? `/kelas/${m.kelasId}?modul=${m.id}` : `/kelas/${m.kelasId}`,
      },
    });
  }
  for (const q of d.quizLulus ?? []) {
    item.push({
      sejak: q.sejak,
      n: {
        id: `quiz-lulus-${q.modulId}`,
        judul: `Quiz ${q.judul} lulus`,
        isi: q.adaBerikutnya ? 'Modul berikutnya sudah terbuka.' : 'Semua modul di kelas ini sudah kamu lewati.',
        waktu: labelTanggal(q.sejak, d.hariIni),
        url: `/kelas/${q.kelasId}?modul=${q.modulId}`,
      },
    });
  }
  item.sort((a, b) => (a.sejak < b.sejak ? 1 : a.sejak > b.sejak ? -1 : 0));
  hasil.push(...item.map((x) => x.n));
  return hasil;
}

/**
 * Bandingkan modul terbit dengan yang pernah dilihat perangkat ini.
 * Kunjungan pertama: semua modul dianggap sudah dikenal (tidak membanjiri notifikasi).
 * Mengembalikan peta dikenal yang baru (id -> tanggal pertama terlihat, "" = sudah ada sejak awal).
 */
export function perbaruiModulDikenal(
  dikenal: Record<string, string> | null,
  idSekarang: string[],
  hariIni: string
): Record<string, string> {
  if (!dikenal) {
    return Object.fromEntries(idSekarang.map((id) => [id, '']));
  }
  const baru = { ...dikenal };
  for (const id of idSekarang) if (!(id in baru)) baru[id] = hariIni;
  return baru;
}

/**
 * Sama seperti perbaruiModulDikenal, untuk quiz yang lulus. Quiz lulus satu per satu,
 * jadi kalau banyak quiz muncul sekaligus (progres baru diunduh dari akun di perangkat lain)
 * semuanya dianggap lama dan tidak dijadikan notifikasi.
 */
export function perbaruiQuizDikenal(
  dikenal: Record<string, string> | null,
  idLulus: string[],
  hariIni: string
): Record<string, string> {
  const baru = { ...(dikenal ?? {}) };
  const belum = idLulus.filter((id) => !(id in baru));
  const tanggal = dikenal && belum.length === 1 ? hariIni : '';
  for (const id of belum) baru[id] = tanggal;
  return baru;
}
