import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VerifikasiEmail from '../pages/VerifikasiEmail';
import * as AuthContextModule from '../context/AuthContext';
import * as SupabaseModule from '../lib/supabase';

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
