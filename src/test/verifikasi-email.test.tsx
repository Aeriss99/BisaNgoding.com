import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VerifikasiEmail from '../pages/VerifikasiEmail';
import * as AuthContextModule from '../context/AuthContext';

const mockSignInWithOtp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockRpc = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: (...args: any[]) => mockSignInWithOtp(...args),
      verifyOtp: (...args: any[]) => mockVerifyOtp(...args),
    },
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

describe('Halaman Verifikasi Email', () => {
  const mockTandaiEmailTerverifikasi = vi.fn();
  const mockKeluar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  const renderVerifikasi = (authOverrides = {}, initialRoute = '/verifikasi-email') => {
    const authValue = {
      user: { id: 'u123', email: 'pengguna@test.com' },
      isAdmin: false,
      loading: false,
      sedangPulihkanPassword: false,
      sudahVerifikasiEmail: false,
      tandaiEmailTerverifikasi: mockTandaiEmailTerverifikasi,
      keluar: mockKeluar,
      isSupabaseConfigured: true,
      ...authOverrides,
    };

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(authValue as any);

    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/verifikasi-email" element={<VerifikasiEmail />} />
          <Route path="/" element={<div data-testid="beranda">Halaman Beranda</div>} />
          <Route path="/masuk" element={<div data-testid="masuk">Halaman Masuk</div>} />
          <Route path="/tujuan-khusus" element={<div data-testid="tujuan-khusus">Tujuan Khusus</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('user login + belum verifikasi: kode dikirim sekali saat pertama dibuka', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });

    const { rerender } = renderVerifikasi();

    expect(screen.getByText('Verifikasi Email')).toBeInTheDocument();
    expect(screen.getByText(/pengguna@test.com/i)).toBeInTheDocument();
    expect(mockSignInWithOtp).toHaveBeenCalledTimes(1);
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'pengguna@test.com',
      options: { shouldCreateUser: false },
    });

    // Re-render tidak memanggil signInWithOtp lagi
    rerender(
      <MemoryRouter initialEntries={['/verifikasi-email']}>
        <Routes>
          <Route path="/verifikasi-email" element={<VerifikasiEmail />} />
        </Routes>
      </MemoryRouter>
    );
    expect(mockSignInWithOtp).toHaveBeenCalledTimes(1);
  });

  it('kode tidak dikirim saat sudahVerifikasiEmail null atau true', () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });

    // Saat null
    const { unmount } = renderVerifikasi({ sudahVerifikasiEmail: null });
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
    unmount();

    // Saat true
    renderVerifikasi({ sudahVerifikasiEmail: true });
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it('muat ulang dalam 60 detik tidak mengirim lagi (memakai sessionStorage bn_otp_terkirim:<userId>)', () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    // Set 30 detik lalu sudah dikirim
    sessionStorage.setItem('bn_otp_terkirim:u123', (Date.now() - 30000).toString());

    renderVerifikasi();

    expect(mockSignInWithOtp).not.toHaveBeenCalled();
    // Tombol hitung mundur menunjukkan sisa waktu sekitar 30 detik
    const btnKirimUlang = screen.getByRole('button', { name: /kirim ulang kode/i });
    expect(btnKirimUlang).toBeDisabled();
    expect(btnKirimUlang).toHaveTextContent(/kirim ulang kode \(\d+s\)/i);
  });

  it('{ error } dari signInWithOtp tampil sebagai pesan error', async () => {
    mockSignInWithOtp.mockResolvedValue({
      error: { code: 'over_email_send_rate_limit' },
    });

    renderVerifikasi();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Terlalu sering meminta email. Coba lagi beberapa menit lagi.'
      );
    });
  });

  it('kode benar -> rpc dipanggil -> ke tujuan', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    mockVerifyOtp.mockResolvedValue({ error: null });
    mockTandaiEmailTerverifikasi.mockResolvedValue(undefined);

    sessionStorage.setItem('bn_tujuan', '/tujuan-khusus');

    renderVerifikasi();

    const inputKode = screen.getByLabelText(/kode verifikasi/i);
    fireEvent.change(inputKode, { target: { value: '123456' } });

    const btnVerifikasi = screen.getByRole('button', { name: /^verifikasi$/i });
    fireEvent.click(btnVerifikasi);

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: 'pengguna@test.com',
        token: '123456',
        type: 'email',
      });
      expect(mockTandaiEmailTerverifikasi).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('tujuan-khusus')).toBeInTheDocument();
    });
  });

  it('sudah verifikasi -> diarahkan langsung dan tidak melihat /verifikasi-email', () => {
    renderVerifikasi({ sudahVerifikasiEmail: true });

    expect(screen.getByTestId('beranda')).toBeInTheDocument();
    expect(screen.queryByText('Verifikasi Email')).not.toBeInTheDocument();
  });
});
