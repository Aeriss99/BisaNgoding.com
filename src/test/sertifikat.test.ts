import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import {
  syaratSertifikat,
  buatKodeSertifikat,
  formatTanggalSertifikat,
} from '../lib/sertifikat';
import { modulesData, getVisibleLessons, getQuizQuestions } from '../lib/content';
import type { UserProgress } from '../types/schema';
import Sertifikat from '../pages/Sertifikat';
import CekSertifikat from '../pages/CekSertifikat';
import LihatSertifikat, { KartuSertifikat } from '../pages/LihatSertifikat';

// Mock mode lokal agar pengujian halaman berjalan dalam mode situs/cloud
vi.mock('../lib/modeLokal', () => ({
  apakahModeLokal: () => false,
}));

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockRpc = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'sertifikat') {
        return {
          select: mockSelect,
          insert: mockInsert,
        };
      }
      return {
        select: vi.fn(),
        insert: vi.fn(),
      };
    }),
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

let mockProgressValue: UserProgress;

vi.mock('../context/ProgressContext', () => ({
  useProgress: () => ({
    progress: mockProgressValue,
  }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      email: 'pelajar@bisangoding.com',
      user_metadata: { full_name: 'Budi Santoso' },
    },
    loading: false,
  }),
}));

const mockKonfirmasi = vi.fn().mockResolvedValue(true);
vi.mock('../components/ui/DialogKonfirmasi', () => ({
  useKonfirmasi: () => mockKonfirmasi,
}));

function buatProgresLengkap(courseId: string, nilaiQuiz = 100): UserProgress {
  const mods = modulesData.filter(
    (m) => (m.courseId || 'java') === courseId && m.status !== 'draft'
  );
  const completedLessons = mods.flatMap((m) =>
    getVisibleLessons(m.id).map((l) => l.id)
  );
  const quizScores: UserProgress['quizScores'] = {};
  for (const m of mods) {
    if (getQuizQuestions(m.id)?.length) {
      quizScores[m.id] = { score: nilaiQuiz, passed: nilaiQuiz >= 70 };
    }
  }
  return {
    completedLessons,
    passedChecks: [],
    moduleStatus: {},
    quizScores,
    xp: 1000,
    streak: 10,
    lastActiveDate: '2026-11-04',
  };
}

describe('syaratSertifikat', () => {
  it('progres kosong → lulus: false', () => {
    const kosong: UserProgress = {
      completedLessons: [],
      passedChecks: [],
      moduleStatus: {},
      quizScores: {},
      xp: 0,
      streak: 0,
      lastActiveDate: '2026-11-04',
    };
    const res = syaratSertifikat('java', kosong);
    expect(res).not.toBeNull();
    expect(res?.lulus).toBe(false);
    expect(res?.modulBelum).toBeGreaterThan(0);
    expect(res?.namaKelas).toBe('Java');
  });

  it('semua materi selesai tapi satu quiz belum lulus → false', () => {
    const p = buatProgresLengkap('java');
    const mods = modulesData.filter(
      (m) => (m.courseId || 'java') === 'java' && m.status !== 'draft'
    );
    const modsDenganQuiz = mods.filter((m) => (getQuizQuestions(m.id)?.length ?? 0) > 0);
    const modTerakhir = modsDenganQuiz[modsDenganQuiz.length - 1];
    p.quizScores[modTerakhir.id] = { score: 50, passed: false };

    const res = syaratSertifikat('java', p);
    expect(res).not.toBeNull();
    expect(res?.lulus).toBe(false);
    expect(res?.modulBelum).toBe(1);
  });

  it('semua materi + quiz lulus → true', () => {
    const p = buatProgresLengkap('java');
    const res = syaratSertifikat('java', p);
    expect(res).not.toBeNull();
    expect(res?.lulus).toBe(true);
    expect(res?.modulBelum).toBe(0);
    expect(res?.persen).toBe(100);
    expect(res?.namaKelas).toBe('Java');
  });

  it('Git tanpa git-proyek-akhir selesai → false', () => {
    const p = buatProgresLengkap('git');
    const materiProyek = getVisibleLessons('git-proyek-akhir').map((l) => l.id);
    expect(materiProyek.length).toBeGreaterThan(0);
    p.completedLessons = p.completedLessons.filter((id) => !materiProyek.includes(id));

    const res = syaratSertifikat('git', p);
    expect(res).not.toBeNull();
    expect(res?.lulus).toBe(false);
    expect(res?.modulBelum).toBeGreaterThanOrEqual(1);
    expect(res?.namaKelas).toBe('Git & GitHub');
  });

  it('unlockAll tanpa progres → false', () => {
    const adminTanpaProgres: UserProgress = {
      completedLessons: [],
      passedChecks: [],
      moduleStatus: {},
      quizScores: {},
      xp: 0,
      streak: 0,
      lastActiveDate: '2026-11-04',
      unlockAll: true,
    };
    const res = syaratSertifikat('java', adminTanpaProgres);
    expect(res).not.toBeNull();
    expect(res?.lulus).toBe(false);
  });

  it('kelas yang tidak ada → null', () => {
    const p = buatProgresLengkap('java');
    const res = syaratSertifikat('tidak-ada', p);
    expect(res).toBeNull();
  });
});

describe('buatKodeSertifikat', () => {
  it('cocok /^BN-[A-Z2-9]{4}-[A-Z2-9]{4}$/ dan tidak mengandung 0, O, 1, I', () => {
    const regex = /^BN-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
    for (let i = 0; i < 50; i++) {
      const kode = buatKodeSertifikat();
      expect(kode).toMatch(regex);
      expect(kode).not.toMatch(/[0O1I]/);
    }
  });
});

describe('formatTanggalSertifikat', () => {
  it('memformat tanggal ke bahasa Indonesia "3 November 2026"', () => {
    const hasil = formatTanggalSertifikat('2026-11-03T10:00:00Z');
    expect(hasil).toBe('3 November 2026');
  });
});

describe('Halaman Sertifikat & Cek Keaslian', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('kelas lulus menampilkan TERBITKAN SERTIFIKAT dan terbit memanggil insert dengan nama yang sudah di-trim', async () => {
    mockProgressValue = buatProgresLengkap('java');
    mockSelect.mockResolvedValue({ data: [], error: null });
    mockInsert.mockResolvedValue({ error: null });

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/sertifikat'] },
        React.createElement(Sertifikat, null)
      )
    );

    await waitFor(() => {
      expect(mockSelect).toHaveBeenCalled();
    });

    const tombolTerbitkan = await screen.findByRole('button', {
      name: /TERBITKAN SERTIFIKAT/i,
    });
    expect(tombolTerbitkan).toBeInTheDocument();

    fireEvent.click(tombolTerbitkan);

    const inputNama = screen.getByLabelText(/Nama di sertifikat/i);
    expect(inputNama).toBeInTheDocument();

    fireEvent.change(inputNama, { target: { value: '   Lingga Pratama   ' } });

    const tombolSubmit = screen.getByRole('button', { name: /^Terbitkan$/i });
    fireEvent.click(tombolSubmit);

    await waitFor(() => {
      expect(mockKonfirmasi).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });

    const argumenInsert = mockInsert.mock.calls[0][0];
    expect(argumenInsert.user_id).toBe('user-123');
    expect(argumenInsert.nama).toBe('Lingga Pratama');
    expect(argumenInsert.kode).toMatch(/^BN-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it('/cek-sertifikat/BN-AAAA-BBBB memanggil rpc(cek_sertifikat, ...) dan menampilkan "Sertifikat asli"', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          nama: 'Budi Santoso',
          kelas_id: 'git',
          terbit: '2026-11-04T12:00:00Z',
        },
      ],
      error: null,
    });

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/cek-sertifikat/BN-AAAA-BBBB'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: '/cek-sertifikat/:kode',
            element: React.createElement(CekSertifikat, null),
          })
        )
      )
    );

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('cek_sertifikat', {
        p_kode: 'BN-AAAA-BBBB',
      });
    });

    expect(await screen.findByText(/✓ Sertifikat asli/i)).toBeInTheDocument();
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('Git & GitHub')).toBeInTheDocument();
    expect(screen.queryByText('Kelas Git & GitHub')).not.toBeInTheDocument();
    expect(screen.getByText('4 November 2026')).toBeInTheDocument();
  });

  it('/cek-sertifikat dengan kode tidak valid menampilkan pesan tidak ditemukan', async () => {
    mockRpc.mockResolvedValue({
      data: [],
      error: null,
    });

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/cek-sertifikat/BN-XXXX-XXXX'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: '/cek-sertifikat/:kode',
            element: React.createElement(CekSertifikat, null),
          })
        )
      )
    );

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('cek_sertifikat', {
        p_kode: 'BN-XXXX-XXXX',
      });
    });

    expect(
      await screen.findByText(/Sertifikat dengan kode ini tidak ditemukan\./i)
    ).toBeInTheDocument();
  });

  it('Nama 60 karakter: elemen nama tidak punya kelas truncate dan memakai kelas ukuran untuk nama panjang', () => {
    const nama60 = 'Muhammad Rizky Pratama Wijaya Kusumanegara Simanjuntak Hadie';
    expect(nama60.length).toBe(60);
    const sertifikatMock = {
      kode: 'BN-TEST-1234',
      user_id: 'user-123',
      kelas_id: 'java',
      nama: nama60,
      terbit: '2026-11-04T00:00:00Z',
    };
    render(
      React.createElement(KartuSertifikat, {
        sertifikat: sertifikatMock,
        namaKelas: 'Java',
      })
    );
    const elNama = screen.getByText(nama60);
    expect(elNama).toBeInTheDocument();
    expect(elNama.className).not.toContain('truncate');
    expect(elNama.className).toContain('nama-sangat-panjang');
    expect(elNama.className).toContain('break-words');
  });

  it('Insert gagal dengan sertifikat_user_id_kelas_id_key: insert dipanggil sekali, daftar dimuat ulang, dan teks bahasa Inggris tidak tampil', async () => {
    mockProgressValue = buatProgresLengkap('java');
    mockSelect.mockResolvedValue({ data: [], error: null });
    mockInsert.mockResolvedValue({
      error: {
        code: '23505',
        message:
          'duplicate key value violates unique constraint "sertifikat_user_id_kelas_id_key"',
      },
    });

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/sertifikat'] },
        React.createElement(Sertifikat, null)
      )
    );

    await waitFor(() => {
      expect(mockSelect).toHaveBeenCalledTimes(1);
    });

    const tombolTerbitkan = await screen.findByRole('button', {
      name: /TERBITKAN SERTIFIKAT/i,
    });
    fireEvent.click(tombolTerbitkan);

    const tombolSubmit = screen.getByRole('button', { name: /^Terbitkan$/i });
    fireEvent.click(tombolSubmit);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(1);
      // Daftar dimuat ulang
      expect(mockSelect).toHaveBeenCalledTimes(2);
    });

    // Dialog sudah tertutup
    expect(screen.queryByRole('dialog')).toBeNull();
    // Teks bahasa Inggris error dari Supabase tidak tampil
    expect(screen.queryByText(/duplicate key value/i)).toBeNull();
  });

  it('Insert gagal dengan sertifikat_pkey dua kali lalu berhasil: insert dipanggil 3 kali dengan kode berbeda', async () => {
    mockProgressValue = buatProgresLengkap('java');
    mockSelect.mockResolvedValue({ data: [], error: null });
    const errPkey = {
      code: '23505',
      message:
        'duplicate key value violates unique constraint "sertifikat_pkey"',
    };
    mockInsert
      .mockResolvedValueOnce({ error: errPkey })
      .mockResolvedValueOnce({ error: errPkey })
      .mockResolvedValueOnce({ error: null });

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/sertifikat'] },
        React.createElement(Sertifikat, null)
      )
    );

    await waitFor(() => {
      expect(mockSelect).toHaveBeenCalledTimes(1);
    });

    const tombolTerbitkan = await screen.findByRole('button', {
      name: /TERBITKAN SERTIFIKAT/i,
    });
    fireEvent.click(tombolTerbitkan);

    const tombolSubmit = screen.getByRole('button', { name: /^Terbitkan$/i });
    fireEvent.click(tombolSubmit);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(3);
    });

    const kodes = mockInsert.mock.calls.map((c: any) => c[0].kode);
    expect(new Set(kodes).size).toBe(3); // 3 kode berbeda
  });

  it('Dialog nama: Esc menutup dialog; Enter di isian memanggil konfirmasi', async () => {
    mockProgressValue = buatProgresLengkap('java');
    mockSelect.mockResolvedValue({ data: [], error: null });
    mockInsert.mockResolvedValue({ error: null });

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/sertifikat'] },
        React.createElement(Sertifikat, null)
      )
    );

    const tombolTerbitkan = await screen.findByRole('button', {
      name: /TERBITKAN SERTIFIKAT/i,
    });
    fireEvent.click(tombolTerbitkan);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Tekan Escape -> dialog tertutup
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Buka lagi
    fireEvent.click(tombolTerbitkan);
    const inputNama = screen.getByLabelText(/Nama di sertifikat/i);

    // Tekan Enter di dalam form/input
    fireEvent.submit(inputNama.closest('form')!);

    await waitFor(() => {
      expect(mockKonfirmasi).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  it('setelah LihatSertifikat dirender, document.head berisi <style> dengan size: A4 landscape; setelah di-unmount, style hilang dan body tidak punya kelas halaman-cetak-sertifikat', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            kode: 'BN-AAAA-BBBB',
            user_id: 'user-123',
            kelas_id: 'java',
            nama: 'Budi Santoso',
            terbit: '2026-11-04T00:00:00Z',
          },
          error: null,
        }),
      }),
    });

    const { unmount } = render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/sertifikat/BN-AAAA-BBBB'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: '/sertifikat/:kode',
            element: React.createElement(LihatSertifikat, null),
          })
        )
      )
    );

    expect(document.body.classList.contains('halaman-cetak-sertifikat')).toBe(true);
    const styles = Array.from(document.head.querySelectorAll('style'));
    expect(styles.some((s) => s.textContent?.includes('size: A4 landscape'))).toBe(true);

    unmount();

    expect(document.body.classList.contains('halaman-cetak-sertifikat')).toBe(false);
    const stylesAfter = Array.from(document.head.querySelectorAll('style'));
    expect(stylesAfter.some((s) => s.textContent?.includes('size: A4 landscape'))).toBe(false);
  });
});
