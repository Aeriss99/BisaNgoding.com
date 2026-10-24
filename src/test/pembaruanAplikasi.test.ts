import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  pasangPembaruanOtomatis,
  sedangBelajar,
  versiLamaTerdeteksi,
  dengarVersiBaru,
  muatUlangSekarang,
  KUNCI_MUAT_ULANG,
  KUNCI_HARD_REFRESH,
  simpanCadanganMateri,
  ambilCadanganMateri,
  simpanCadanganQuiz,
  ambilCadanganQuiz,
  periksaPembaruanSaatPindahMateri,
  formatTanggalBuild,
  _resetStatePembaruan,
} from '../lib/pembaruanAplikasi';

function jendelaPalsu(hash: string, adaController = true, fetchResult?: any) {
  const dengar: Record<string, (() => void)[]> = {};
  const swDengar: Record<string, (() => void)[]> = {};
  const docDengar: Record<string, (() => void)[]> = {};
  const update = vi.fn(() => Promise.resolve());
  const unregister = vi.fn(() => Promise.resolve(true));
  const storageMap: Record<string, string> = {};
  const deletedCaches: string[] = [];

  const registrationMock = { update, unregister };
  const caches = {
    keys: vi.fn(() =>
      Promise.resolve(['workbox-precache-v1', 'suara-en', 'other-cache'])
    ),
    delete: vi.fn((key: string) => {
      deletedCaches.push(key);
      return Promise.resolve(true);
    }),
  };

  const defaultFetch = () =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ versi: 'test' }),
    });

  const win = {
    location: { hash, reload: vi.fn() },
    sessionStorage: {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
    },
    localStorage: {
      getItem: vi.fn((k: string) => storageMap[k] || null),
      setItem: vi.fn((k: string, v: string) => {
        storageMap[k] = v;
      }),
      removeItem: vi.fn((k: string) => {
        delete storageMap[k];
      }),
    },
    navigator: {
      serviceWorker: {
        controller: adaController ? {} : null,
        addEventListener: (n: string, f: () => void) =>
          ((swDengar[n] ||= []).push(f)),
        getRegistration: () => Promise.resolve(registrationMock),
        getRegistrations: () => Promise.resolve([registrationMock]),
      },
    },
    document: {
      visibilityState: 'visible',
      addEventListener: (n: string, f: () => void) =>
        ((docDengar[n] ||= []).push(f)),
    },
    addEventListener: (n: string, f: () => void) => ((dengar[n] ||= []).push(f)),
    setInterval: vi.fn(),
    setTimeout: (fn: any, ms: any) => setTimeout(fn, ms),
    caches,
    fetch: fetchResult !== undefined ? fetchResult : vi.fn(defaultFetch),
  };
  const picu = (peta: Record<string, (() => void)[]>, n: string) =>
    (peta[n] || []).forEach((f) => f());
  return {
    win,
    update,
    unregister,
    caches,
    deletedCaches,
    storageMap,
    sw: (n: string) => picu(swDengar, n),
    jendela: (n: string) => picu(dengar, n),
    dok: (n: string) => picu(docDengar, n),
  };
}

describe('pembaruan versi aplikasi', () => {
  beforeEach(() => {
    _resetStatePembaruan();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('halaman materi dan quiz dianggap sedang belajar', () => {
    expect(sedangBelajar('#/lesson/js-oop-01')).toBe(true);
    expect(sedangBelajar('#/quiz/js-oop')).toBe(true);
    expect(sedangBelajar('#/progres')).toBe(false);
    expect(sedangBelajar('#/')).toBe(false);
  });

  it('versi baru aktif: langsung dimuat ulang kalau tidak sedang belajar', () => {
    const j = jendelaPalsu('#/progres');
    pasangPembaruanOtomatis(j.win as unknown as Window);
    j.sw('controllerchange');
    expect(j.win.location.reload).toHaveBeenCalledTimes(1);
  });

  it('sedang mengerjakan materi: ditunda sampai pindah halaman', () => {
    const j = jendelaPalsu('#/lesson/java-dasar-01');
    pasangPembaruanOtomatis(j.win as unknown as Window);
    j.sw('controllerchange');
    expect(j.win.location.reload).not.toHaveBeenCalled();
    j.win.location.hash = '#/kelas/java';
    j.jendela('hashchange');
    expect(j.win.location.reload).toHaveBeenCalledTimes(1);
  });

  it('gambar materi gagal dimuat: cari versi baru dan muat ulang walaupun sedang di materi', async () => {
    const j = jendelaPalsu('#/lesson/gh-keamanan-02');
    pasangPembaruanOtomatis(j.win as unknown as Window);
    versiLamaTerdeteksi();
    await Promise.resolve();
    await Promise.resolve();
    expect(j.update).toHaveBeenCalled();
    expect(j.win.location.reload).not.toHaveBeenCalled();
    j.sw('controllerchange');
    expect(j.win.location.reload).toHaveBeenCalledTimes(1);
  });

  it('versi baru sudah aktif tapi tertunda di materi: gambar rusak langsung memicu muat ulang', () => {
    const j = jendelaPalsu('#/lesson/gh-keamanan-02');
    pasangPembaruanOtomatis(j.win as unknown as Window);
    j.sw('controllerchange');
    expect(j.win.location.reload).not.toHaveBeenCalled();
    versiLamaTerdeteksi();
    expect(j.win.location.reload).toHaveBeenCalledTimes(1);
  });

  it('tertunda di materi: notifikasi muncul, tombol Muat ulang memuat ulang', () => {
    const j = jendelaPalsu('#/lesson/spring-dasar-03');
    pasangPembaruanOtomatis(j.win as unknown as Window);
    const status: boolean[] = [];
    const berhenti = dengarVersiBaru((ada) => status.push(ada));
    j.sw('controllerchange');
    expect(status).toEqual([false, true]);
    expect(j.win.location.reload).not.toHaveBeenCalled();
    muatUlangSekarang();
    expect(j.win.location.reload).toHaveBeenCalledTimes(1);
    berhenti();
  });

  it('di quiz: notifikasi muncul, tombol Muat ulang memuat ulang', () => {
    const j = jendelaPalsu('#/quiz/spring-dasar');
    pasangPembaruanOtomatis(j.win as unknown as Window);
    j.sw('controllerchange');
    muatUlangSekarang();
    expect(j.win.location.reload).toHaveBeenCalledTimes(1);
  });

  it('kunjungan pertama (belum ada service worker) tidak memuat ulang', () => {
    const j = jendelaPalsu('#/', false);
    pasangPembaruanOtomatis(j.win as unknown as Window);
    j.sw('controllerchange');
    expect(j.win.location.reload).not.toHaveBeenCalled();
  });

  it('cek versi baru saat aplikasi dibuka lagi', async () => {
    const j = jendelaPalsu('#/');
    pasangPembaruanOtomatis(j.win as unknown as Window);
    j.dok('visibilitychange');
    await Promise.resolve();
    await Promise.resolve();
    expect(j.update).toHaveBeenCalled();
    expect(j.win.setInterval).toHaveBeenCalled();
  });

  /* ───────────────────────── Tes Wajib Fitur Baru ───────────────────────── */

  it('1. Versi server sama: tidak terjadi apa-apa', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ versi: 'test' }), // sama dengan __VERSI_APP__
      })
    );
    const j = jendelaPalsu('#/progres', true, fetchMock);
    pasangPembaruanOtomatis(j.win as unknown as Window);
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalled();
    expect(j.win.location.reload).not.toHaveBeenCalled();
  });

  it('2. Versi server beda di luar materi: setelah 60 detik terjadi hard refresh (cache dihapus kecuali suara-en, service worker di-unregister, lalu reload)', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ versi: 'v-baru-123' }),
      })
    );
    const j = jendelaPalsu('#/progres', true, fetchMock);
    pasangPembaruanOtomatis(j.win as unknown as Window);

    // Tunggu fetch selesai
    await Promise.resolve();
    await Promise.resolve();

    expect(j.update).toHaveBeenCalled();
    expect(j.win.location.reload).not.toHaveBeenCalled();

    // Majukan 60 detik
    await vi.advanceTimersByTimeAsync(60_000);

    expect(j.deletedCaches).toContain('workbox-precache-v1');
    expect(j.deletedCaches).toContain('other-cache');
    expect(j.deletedCaches).not.toContain('suara-en');
    expect(j.unregister).toHaveBeenCalled();
    expect(j.win.location.reload).toHaveBeenCalledTimes(1);
  });

  it('3. Versi server beda di halaman materi: tidak reload sebelum 30 menit. Setelah 30 menit, reload terjadi saat pindah kartu, dan cadangan tersimpan', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ versi: 'v-baru-materi' }),
      })
    );
    const j = jendelaPalsu('#/lesson/java-dasar-01', true, fetchMock);
    pasangPembaruanOtomatis(j.win as unknown as Window);

    await Promise.resolve();
    await Promise.resolve();

    // 60 detik berlalu (1 menit): masih di materi, tidak boleh reload
    await vi.advanceTimersByTimeAsync(60_000);
    expect(j.win.location.reload).not.toHaveBeenCalled();

    // 27 menit berlalu (total 28 menit): pindah kartu belum memicu reload (< 30 menit)
    await vi.advanceTimersByTimeAsync(27 * 60 * 1000);
    const pindahAwal = periksaPembaruanSaatPindahMateri(
      'java-dasar-01',
      2,
      { 1: 2 },
      j.win as unknown as Window
    );
    expect(pindahAwal).toBe(false);
    expect(j.win.location.reload).not.toHaveBeenCalled();

    // 3 menit lagi (total 31 menit): pindah kartu memicu reload dan menyimpan cadangan (>= 30 menit)
    await vi.advanceTimersByTimeAsync(3 * 60 * 1000);
    const pindahSetelah30Menit = periksaPembaruanSaatPindahMateri(
      'java-dasar-01',
      3,
      { 1: 2 },
      j.win as unknown as Window
    );
    expect(pindahSetelah30Menit).toBe(true);

    await vi.advanceTimersByTimeAsync(10);
    expect(j.win.location.reload).toHaveBeenCalledTimes(1);

    // Cadangan tersimpan dengan index kartu berikutnya (3)
    const cadangan = ambilCadanganMateri(
      'java-dasar-01',
      j.win.localStorage as unknown as Storage
    );
    expect(cadangan).toEqual({
      index: 3,
      attemptsPerCard: { 1: 2 },
    });
  });

  it('4. Pengaman: versi tujuan yang sama tidak di-hard-refresh dua kali dalam 10 menit', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ versi: 'v-berulang' }),
      })
    );
    const j = jendelaPalsu('#/progres', true, fetchMock);

    // Catat bahwa versi v-berulang baru saja di-hard-refresh 5 menit lalu
    j.storageMap[KUNCI_HARD_REFRESH] = JSON.stringify({
      versi: 'v-berulang',
      waktu: Date.now() - 5 * 60 * 1000,
    });

    pasangPembaruanOtomatis(j.win as unknown as Window);
    await Promise.resolve();
    await Promise.resolve();

    // Lewati 60 detik
    await vi.advanceTimersByTimeAsync(60_000);

    // Hard refresh ditahan oleh pengaman 10 menit
    expect(j.win.location.reload).not.toHaveBeenCalled();
  });

  it('5. Offline (fetch gagal): tidak terjadi apa-apa', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error('Network offline')));
    const j = jendelaPalsu('#/progres', true, fetchMock);

    expect(() => pasangPembaruanOtomatis(j.win as unknown as Window)).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    expect(j.win.location.reload).not.toHaveBeenCalled();
  });

  it('6. Cadangan materi dan quiz dipulihkan setelah reload, dan yang lebih tua dari 2 jam diabaikan', () => {
    const storage: Record<string, string> = {};
    const mockStorage = {
      getItem: (k: string) => storage[k] || null,
      setItem: (k: string, v: string) => {
        storage[k] = v;
      },
      removeItem: (k: string) => {
        delete storage[k];
      },
    } as unknown as Storage;

    // Materi: simpan dan pulihkan
    simpanCadanganMateri('js-dasar-05', 4, { 2: 1 }, mockStorage);
    const pulihMateri = ambilCadanganMateri('js-dasar-05', mockStorage);
    expect(pulihMateri).toEqual({ index: 4, attemptsPerCard: { 2: 1 } });
    // Setelah dipulihkan, cadangan harus dihapus
    expect(ambilCadanganMateri('js-dasar-05', mockStorage)).toBeNull();

    // Materi: cadangan lebih tua dari 2 jam diabaikan
    mockStorage.setItem(
      'bn_cadangan_materi',
      JSON.stringify({
        lessonId: 'js-dasar-05',
        index: 2,
        attemptsPerCard: {},
        waktu: Date.now() - 2 * 60 * 60 * 1000 - 1000,
      })
    );
    expect(ambilCadanganMateri('js-dasar-05', mockStorage)).toBeNull();

    // Quiz: simpan dan pulihkan
    simpanCadanganQuiz('java-dasar', 5, { 0: 1, 1: 3 }, mockStorage);
    const pulihQuiz = ambilCadanganQuiz('java-dasar', mockStorage);
    expect(pulihQuiz).toEqual({ index: 5, answers: { 0: 1, 1: 3 } });
    expect(ambilCadanganQuiz('java-dasar', mockStorage)).toBeNull();

    // Quiz: cadangan lebih tua dari 2 jam diabaikan
    mockStorage.setItem(
      'bn_cadangan_quiz',
      JSON.stringify({
        moduleId: 'java-dasar',
        index: 3,
        answers: { 0: 2 },
        waktu: Date.now() - 2 * 60 * 60 * 1000 - 1000,
      })
    );
    expect(ambilCadanganQuiz('java-dasar', mockStorage)).toBeNull();
  });

  it('formatTanggalBuild memformat ISO tanggal ke format Indonesia', () => {
    expect(formatTanggalBuild('2026-10-24T12:00:00.000Z')).toMatch(
      /24 Okt 2026/
    );
    expect(formatTanggalBuild('2026-01-05T00:00:00.000Z')).toMatch(
      /5 Jan 2026/
    );
  });
});
