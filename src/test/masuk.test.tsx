import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Masuk from '../pages/Masuk';
import { petakanErrorAuth } from '../lib/authError';
import * as AuthContextModule from '../context/AuthContext';

describe('petakanErrorAuth', () => {
  it('memetakan kode error Supabase ke pesan bahasa Indonesia', () => {
    expect(petakanErrorAuth('invalid_credentials')).toBe('Email atau password salah.');
    expect(petakanErrorAuth({ code: 'invalid_credentials' })).toBe('Email atau password salah.');

    expect(petakanErrorAuth('email_not_confirmed')).toBe(
      'Email belum dikonfirmasi. Cek kotak masuk atau folder spam.'
    );
    expect(petakanErrorAuth({ code: 'email_not_confirmed' })).toBe(
      'Email belum dikonfirmasi. Cek kotak masuk atau folder spam.'
    );

    expect(petakanErrorAuth('user_already_exists')).toBe(
      'Email sudah terdaftar. Silakan masuk atau pakai Lupa password.'
    );
    expect(petakanErrorAuth({ code: 'user_already_exists' })).toBe(
      'Email sudah terdaftar. Silakan masuk atau pakai Lupa password.'
    );

    expect(petakanErrorAuth('weak_password')).toBe(
      'Password terlalu lemah. Pakai minimal 8 karakter.'
    );
    expect(petakanErrorAuth({ code: 'weak_password' })).toBe(
      'Password terlalu lemah. Pakai minimal 8 karakter.'
    );

    expect(petakanErrorAuth('over_email_send_rate_limit')).toBe(
      'Terlalu sering meminta email. Coba lagi beberapa menit lagi.'
    );
    expect(petakanErrorAuth({ code: 'over_email_send_rate_limit' })).toBe(
      'Terlalu sering meminta email. Coba lagi beberapa menit lagi.'
    );

    expect(petakanErrorAuth('kode_acak_lainnya')).toBe('Gagal. Silakan coba lagi.');
    expect(petakanErrorAuth(null)).toBe('Gagal. Silakan coba lagi.');
    expect(petakanErrorAuth(undefined)).toBe('Gagal. Silakan coba lagi.');
  });

  it('memetakan error dari pesan jika code tidak ada', () => {
    expect(petakanErrorAuth({ message: 'Invalid login credentials' })).toBe(
      'Email atau password salah.'
    );
    expect(petakanErrorAuth({ message: 'User already registered' })).toBe(
      'Email sudah terdaftar. Silakan masuk atau pakai Lupa password.'
    );
    expect(petakanErrorAuth({ message: 'Email not confirmed' })).toBe(
      'Email belum dikonfirmasi. Cek kotak masuk atau folder spam.'
    );
  });
});

describe('Halaman Masuk', () => {
  const mockMasukGoogle = vi.fn();
  const mockMasukEmail = vi.fn();
  const mockDaftarEmail = vi.fn();
  const mockKirimResetPassword = vi.fn();
  const mockAturPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderMasuk = (authOverrides = {}) => {
    const authValue = {
      user: null,
      isAdmin: false,
      loading: false,
      sedangPulihkanPassword: false,
      masukGoogle: mockMasukGoogle,
      masukEmail: mockMasukEmail,
      daftarEmail: mockDaftarEmail,
      kirimResetPassword: mockKirimResetPassword,
      aturPassword: mockAturPassword,
      keluar: vi.fn(),
      isSupabaseConfigured: true,
      ...authOverrides,
    };

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(authValue as any);

    return render(
      <MemoryRouter initialEntries={['/masuk']}>
        <Routes>
          <Route path="/masuk" element={<Masuk />} />
          <Route path="/" element={<div data-testid="beranda">Halaman Beranda</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('mengarahkan ke / kalau pengguna sudah login', () => {
    renderMasuk({
      user: { id: 'u123', email: 'user@example.com' },
      sedangPulihkanPassword: false,
    });

    expect(screen.getByTestId('beranda')).toBeInTheDocument();
  });

  it('menampilkan validasi password kurang dari 8 karakter di tab masuk', async () => {
    renderMasuk();

    const inputEmail = screen.getByLabelText(/^email$/i);
    const inputPassword = screen.getByLabelText(/^password$/i);
    const tombolMasuk = screen.getByRole('button', { name: /^masuk$/i });

    fireEvent.change(inputEmail, { target: { value: 'pengguna@test.com' } });
    fireEvent.change(inputPassword, { target: { value: '123' } });
    fireEvent.click(tombolMasuk);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Password minimal 8 karakter.');
    });

    expect(mockMasukEmail).not.toHaveBeenCalled();
  });

  it('menampilkan validasi password tidak sama di tab daftar', async () => {
    renderMasuk();

    const tombolTabDaftar = screen.getByRole('tab', { name: /^daftar$/i });
    fireEvent.click(tombolTabDaftar);

    const inputEmail = screen.getByLabelText(/^email$/i);
    const inputPassword = screen.getByLabelText(/^password$/i);
    const inputUlangi = screen.getByLabelText(/ulangi password/i);
    const tombolDaftar = screen.getByRole('button', { name: /^daftar$/i });

    fireEvent.change(inputEmail, { target: { value: 'pengguna@test.com' } });
    fireEvent.change(inputPassword, { target: { value: 'password123' } });
    fireEvent.change(inputUlangi, { target: { value: 'passwordBeda' } });
    fireEvent.click(tombolDaftar);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Ulangi password harus sama.');
    });

    expect(mockDaftarEmail).not.toHaveBeenCalled();
  });

  it('menampilkan validasi email tidak valid', async () => {
    renderMasuk();

    const inputEmail = screen.getByLabelText(/^email$/i);
    const inputPassword = screen.getByLabelText(/^password$/i);
    const tombolMasuk = screen.getByRole('button', { name: /^masuk$/i });

    fireEvent.change(inputEmail, { target: { value: 'bukan-email' } });
    fireEvent.change(inputPassword, { target: { value: 'password123' } });
    fireEvent.click(tombolMasuk);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Email tidak valid.');
    });

    expect(mockMasukEmail).not.toHaveBeenCalled();
  });

  it('menampilkan pesan error dari Supabase jika login gagal', async () => {
    mockMasukEmail.mockRejectedValue({ code: 'invalid_credentials' });
    renderMasuk();

    const inputEmail = screen.getByLabelText(/^email$/i);
    const inputPassword = screen.getByLabelText(/^password$/i);
    const tombolMasuk = screen.getByRole('button', { name: /^masuk$/i });

    fireEvent.change(inputEmail, { target: { value: 'user@test.com' } });
    fireEvent.change(inputPassword, { target: { value: 'password123' } });
    fireEvent.click(tombolMasuk);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Email atau password salah.');
    });
  });

  it('memanggil masukGoogle saat tombol Google diklik', async () => {
    mockMasukGoogle.mockResolvedValue(undefined);
    renderMasuk();

    const tombolGoogle = screen.getByRole('button', { name: /masuk dengan google/i });
    fireEvent.click(tombolGoogle);

    expect(mockMasukGoogle).toHaveBeenCalledTimes(1);
  });

  it('menampilkan form reset password saat sedangPulihkanPassword bernilai true', async () => {
    mockAturPassword.mockResolvedValue(undefined);
    renderMasuk({
      user: { id: 'u1' },
      sedangPulihkanPassword: true,
    });

    expect(screen.getByText('Buat password baru')).toBeInTheDocument();

    const inputPasswordBaru = screen.getByLabelText('Password Baru');
    const inputUlangi = screen.getByLabelText('Ulangi Password');
    const tombolSimpan = screen.getByRole('button', { name: /simpan password/i });

    fireEvent.change(inputPasswordBaru, { target: { value: 'passbaru123' } });
    fireEvent.change(inputUlangi, { target: { value: 'passbaru123' } });
    fireEvent.click(tombolSimpan);

    await waitFor(() => {
      expect(mockAturPassword).toHaveBeenCalledWith('passbaru123');
    });
  });

  it('mengirim link reset password di mode lupa password', async () => {
    mockKirimResetPassword.mockResolvedValue(undefined);
    renderMasuk();

    const linkLupa = screen.getByRole('button', { name: /lupa password\?/i });
    fireEvent.click(linkLupa);

    expect(screen.getByText('Lupa password?')).toBeInTheDocument();

    const inputEmailLupa = screen.getByLabelText(/^email$/i);
    fireEvent.change(inputEmailLupa, { target: { value: 'reset@test.com' } });

    const tombolKirim = screen.getByRole('button', { name: /kirim link reset/i });
    fireEvent.click(tombolKirim);

    await waitFor(() => {
      expect(mockKirimResetPassword).toHaveBeenCalledWith('reset@test.com');
      expect(screen.getByRole('status')).toHaveTextContent(
        'Cek email kamu dan klik link konfirmasi untuk reset password. Buka link-nya di browser ini juga.'
      );
    });
  });
});
