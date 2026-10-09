import { describe, it, expect, vi } from 'vitest';
import { pasangPembaruanOtomatis, sedangBelajar } from '../lib/pembaruanAplikasi';

function jendelaPalsu(hash: string, adaController = true) {
  const dengar: Record<string, (() => void)[]> = {};
  const swDengar: Record<string, (() => void)[]> = {};
  const docDengar: Record<string, (() => void)[]> = {};
  const update = vi.fn(() => Promise.resolve());
  const win = {
    location: { hash, reload: vi.fn() },
    navigator: {
      serviceWorker: {
        controller: adaController ? {} : null,
        addEventListener: (n: string, f: () => void) => ((swDengar[n] ||= []).push(f)),
        getRegistration: () => Promise.resolve({ update }),
      },
    },
    document: { visibilityState: 'visible', addEventListener: (n: string, f: () => void) => ((docDengar[n] ||= []).push(f)) },
    addEventListener: (n: string, f: () => void) => ((dengar[n] ||= []).push(f)),
    setInterval: vi.fn(),
  };
  const picu = (peta: Record<string, (() => void)[]>, n: string) => (peta[n] || []).forEach((f) => f());
  return { win, update, sw: (n: string) => picu(swDengar, n), jendela: (n: string) => picu(dengar, n), dok: (n: string) => picu(docDengar, n) };
}

describe('pembaruan versi aplikasi', () => {
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
    await Promise.resolve(); await Promise.resolve();
    expect(j.update).toHaveBeenCalled();
    expect(j.win.setInterval).toHaveBeenCalled();
  });
});
