import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import {
  KonfirmasiProvider,
  useKonfirmasi,
} from '../components/ui/DialogKonfirmasi';
import Profile from '../pages/Profile';
import * as AuthContextModule from '../context/AuthContext';
import * as ProgressContextModule from '../context/ProgressContext';

function KomponenUji({
  opsi,
  onHasil,
}: {
  opsi: any;
  onHasil: (hasil: boolean) => void;
}) {
  const konfirmasi = useKonfirmasi();

  const handleKlik = async () => {
    const res = await konfirmasi(opsi);
    onHasil(res);
  };

  return (
    <div>
      <button data-testid="tombol-buka" onClick={handleKlik}>
        Buka Dialog
      </button>
    </div>
  );
}

describe('DialogKonfirmasi', () => {
  const defaultOpsi = {
    judul: 'Konfirmasi Aksi',
    pesan: 'Apakah Anda yakin ingin melanjutkan?',
    teksYa: 'YA, LANJUTKAN',
    teksBatal: 'BATALKAN',
  };

  it('fokus awal di tombol Batal saat dialog dibuka', async () => {
    let hasil: boolean | null = null;
    render(
      <KonfirmasiProvider>
        <KomponenUji opsi={defaultOpsi} onHasil={(h) => (hasil = h)} />
      </KonfirmasiProvider>
    );

    fireEvent.click(screen.getByTestId('tombol-buka'));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Konfirmasi Aksi')).toBeInTheDocument();
    expect(screen.getByText('Apakah Anda yakin ingin melanjutkan?')).toBeInTheDocument();

    const tombolBatal = screen.getByRole('button', { name: 'BATALKAN' });
    await waitFor(() => {
      expect(document.activeElement).toBe(tombolBatal);
    });
    expect(hasil).toBeNull();
  });

  it('klik Ya mengembalikan true dan menutup dialog', async () => {
    let hasil: boolean | null = null;
    render(
      <KonfirmasiProvider>
        <KomponenUji opsi={defaultOpsi} onHasil={(h) => (hasil = h)} />
      </KonfirmasiProvider>
    );

    fireEvent.click(screen.getByTestId('tombol-buka'));

    const tombolYa = screen.getByRole('button', { name: 'YA, LANJUTKAN' });
    fireEvent.click(tombolYa);

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(hasil).toBe(true);
    });
  });

  it('klik Batal mengembalikan false dan menutup dialog', async () => {
    let hasil: boolean | null = null;
    render(
      <KonfirmasiProvider>
        <KomponenUji opsi={defaultOpsi} onHasil={(h) => (hasil = h)} />
      </KonfirmasiProvider>
    );

    fireEvent.click(screen.getByTestId('tombol-buka'));

    const tombolBatal = screen.getByRole('button', { name: 'BATALKAN' });
    fireEvent.click(tombolBatal);

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(hasil).toBe(false);
    });
  });

  it('menekan tombol Escape mengembalikan false dan menutup dialog', async () => {
    let hasil: boolean | null = null;
    render(
      <KonfirmasiProvider>
        <KomponenUji opsi={defaultOpsi} onHasil={(h) => (hasil = h)} />
      </KonfirmasiProvider>
    );

    fireEvent.click(screen.getByTestId('tombol-buka'));

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(hasil).toBe(false);
    });
  });

  it('klik latar belakang (backdrop) mengembalikan false dan menutup dialog', async () => {
    let hasil: boolean | null = null;
    render(
      <KonfirmasiProvider>
        <KomponenUji opsi={defaultOpsi} onHasil={(h) => (hasil = h)} />
      </KonfirmasiProvider>
    );

    fireEvent.click(screen.getByTestId('tombol-buka'));

    const backdrop = screen.getByTestId('dialog-konfirmasi-backdrop');
    fireEvent.click(backdrop);

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(hasil).toBe(false);
    });
  });

  it('warna tombol Ya magenta jika bahaya bernilai true', () => {
    render(
      <KonfirmasiProvider>
        <KomponenUji
          opsi={{ ...defaultOpsi, bahaya: true }}
          onHasil={() => {}}
        />
      </KonfirmasiProvider>
    );

    fireEvent.click(screen.getByTestId('tombol-buka'));

    const tombolYa = screen.getByRole('button', { name: 'YA, LANJUTKAN' });
    expect(tombolYa).toHaveClass('bg-[#ff3dcb]');
  });

  it('defaultKonfirmasi mencetak error dan mengembalikan false jika di luar Provider', async () => {
    const spyError = vi.spyOn(console, 'error').mockImplementation(() => {});
    let hasil: boolean | null = null;

    render(<KomponenUji opsi={defaultOpsi} onHasil={(h) => (hasil = h)} />);

    fireEvent.click(screen.getByTestId('tombol-buka'));

    await waitFor(() => {
      expect(hasil).toBe(false);
      expect(spyError).toHaveBeenCalledWith('KonfirmasiProvider belum dipasang');
    });

    spyError.mockRestore();
  });
});

describe('Profil - Keluar konfirmasi saat flushKeCloud gagal', () => {
  const mockKeluar = vi.fn();
  const mockFlushKeCloud = vi.fn();

  const renderProfile = () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'u1',
        email: 'user@test.com',
        user_metadata: {
          full_name: 'User Uji',
          avatar_url: 'https://example.com/avatar.jpg',
        },
      },
      isAdmin: false,
      loading: false,
      sedangPulihkanPassword: false,
      sudahVerifikasiEmail: true,
      masukGoogle: vi.fn(),
      masukEmail: vi.fn(),
      daftarEmail: vi.fn(),
      verifikasiKodeDaftar: vi.fn(),
      kirimUlangKodeDaftar: vi.fn(),
      kirimResetPassword: vi.fn(),
      verifikasiKodeReset: vi.fn(),
      tandaiEmailTerverifikasi: vi.fn(),
      aturPassword: vi.fn(),
      keluar: mockKeluar,
      isSupabaseConfigured: true,
    } as any);

    vi.spyOn(ProgressContextModule, 'useProgress').mockReturnValue({
      progress: {
        completedLessons: [],
        passedChecks: [],
        moduleStatus: {},
        quizScores: {},
        xp: 100,
        streak: 2,
        lastActiveDate: '2026-10-22',
        maxSeenDate: '2026-10-22',
      },
      markLessonCompleted: vi.fn(),
      markCheckPassed: vi.fn(),
      importProgress: vi.fn(),
      toggleUnlockAll: vi.fn(),
      addXP: vi.fn(),
      saveQuizScore: vi.fn(),
      touchActivity: vi.fn(),
      streakHariIni: 2,
      flushKeCloud: mockFlushKeCloud,
      syncStatus: 'Offline, tersimpan di perangkat ini',
    } as any);

    return render(
      <KonfirmasiProvider>
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<div data-testid="beranda">Beranda</div>} />
          </Routes>
        </MemoryRouter>
      </KonfirmasiProvider>
    );
  };

  it('muncul DialogKonfirmasi saat flushKeCloud gagal; KELUAR SAJA memanggil keluar()', async () => {
    mockFlushKeCloud.mockResolvedValue(false);
    mockKeluar.mockResolvedValue(undefined);

    renderProfile();

    const tombolKeluar = screen.getByRole('button', { name: /keluar/i });
    fireEvent.click(tombolKeluar);

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('Progres belum tersimpan')).toBeInTheDocument();
      expect(
        screen.getByText(/Koneksi sedang bermasalah. Progres tetap aman di perangkat ini/i)
      ).toBeInTheDocument();
    });

    const tombolKeluarSaja = screen.getByRole('button', { name: 'KELUAR SAJA' });
    fireEvent.click(tombolKeluarSaja);

    await waitFor(() => {
      expect(mockKeluar).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('muncul DialogKonfirmasi saat flushKeCloud gagal; COBA LAGI memanggil flushKeCloud lagi', async () => {
    mockFlushKeCloud.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockKeluar.mockResolvedValue(undefined);

    renderProfile();

    const tombolKeluar = screen.getByRole('button', { name: /keluar/i });
    fireEvent.click(tombolKeluar);

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    expect(mockFlushKeCloud).toHaveBeenCalledTimes(1);

    const tombolCobaLagi = screen.getByRole('button', { name: 'COBA LAGI' });
    fireEvent.click(tombolCobaLagi);

    await waitFor(() => {
      expect(mockFlushKeCloud).toHaveBeenCalledTimes(2);
      expect(mockKeluar).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
});
