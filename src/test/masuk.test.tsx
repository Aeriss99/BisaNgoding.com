import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Masuk from '../pages/Masuk';
import { petakanErrorAuth } from '../lib/authError';
import * as AuthContextModule from '../context/AuthContext';
import { AuthProvider, useAuth } from '../context/AuthContext';

const mockSignUp = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signUp: (...args: any[]) => mockSignUp(...args),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      verifyOtp: vi.fn(),
      resend: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

describe('petakanErrorAuth', () => {
  it('memetakan kode error Supabase ke pesan bahasa Indonesia', () => {
    expect(petakanErrorAuth('invalid_credentials')).toBe(
      'Email atau password salah. Kalau biasanya masuk dengan Google, pakai tombol Masuk dengan Google, atau buat password lewat Lupa password?'
    );
    expect(petakanErrorAuth({ code: 'invalid_credentials' })).toBe(
      'Email atau password salah. Kalau biasanya masuk dengan Google, pakai tombol Masuk dengan Google, atau buat password lewat Lupa password?'
    );

    expect(petakanErrorAuth('user_banned')).toBe(
      'Akunmu dibekukan 5 hari karena tidak membuka BisaNgoding selama 7 hari, dan progresnya sudah dihapus. Silakan masuk lagi setelah masa blokir selesai.'
    );
    expect(petakanErrorAuth({ code: 'user_banned' })).toBe(
      'Akunmu dibekukan 5 hari karena tidak membuka BisaNgoding selama 7 hari, dan progresnya sudah dihapus. Silakan masuk lagi setelah masa blokir selesai.'
    );

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

    expect(petakanErrorAuth('otp_expired')).toBe(
      'Kode salah atau sudah kedaluwarsa. Minta kode baru.'
    );
    expect(petakanErrorAuth({ code: 'otp_expired' })).toBe(
      'Kode salah atau sudah kedaluwarsa. Minta kode baru.'
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
      'Email atau password salah. Kalau biasanya masuk dengan Google, pakai tombol Masuk dengan Google, atau buat password lewat Lupa password?'
    );
    expect(petakanErrorAuth({ message: 'User is banned' })).toBe(
      'Akunmu dibekukan 5 hari karena tidak membuka BisaNgoding selama 7 hari, dan progresnya sudah dihapus. Silakan masuk lagi setelah masa blokir selesai.'
    );
    expect(petakanErrorAuth({ message: 'User already registered' })).toBe(
      'Email sudah terdaftar. Silakan masuk atau pakai Lupa password.'
    );
    expect(petakanErrorAuth({ message: 'Email not confirmed' })).toBe(
      'Email belum dikonfirmasi. Cek kotak masuk atau folder spam.'
    );
    expect(petakanErrorAuth({ message: 'Token has expired or is invalid' })).toBe(
      'Kode salah atau sudah kedaluwarsa. Minta kode baru.'
    );
  });
});

describe('Halaman Masuk', () => {
  const mockMasukGoogle = vi.fn();
  const mockMasukEmail = vi.fn();
  const mockDaftarEmail = vi.fn();
  const mockVerifikasiKodeDaftar = vi.fn();
  const mockKirimUlangKodeDaftar = vi.fn();
  const mockKirimResetPassword = vi.fn();
  const mockVerifikasiKodeReset = vi.fn();
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
      verifikasiKodeDaftar: mockVerifikasiKodeDaftar,
      kirimUlangKodeDaftar: mockKirimUlangKodeDaftar,
      kirimResetPassword: mockKirimResetPassword,
      verifikasiKodeReset: mockVerifikasiKodeReset,
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

  it('invalid_credentials -> pesan baru yang menyebut Google dan Lupa password; klik tautannya membuka form lupa password dengan email terisi', async () => {
    mockMasukEmail.mockRejectedValue({ code: 'invalid_credentials' });
    renderMasuk();

    const inputEmail = screen.getByLabelText(/^email$/i);
    const inputPassword = screen.getByLabelText(/^password$/i);
    const tombolMasuk = screen.getByRole('button', { name: /^masuk$/i });

    fireEvent.change(inputEmail, { target: { value: 'user@test.com' } });
    fireEvent.change(inputPassword, { target: { value: 'password123' } });
    fireEvent.click(tombolMasuk);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Email atau password salah/i);
      expect(screen.getByRole('alert')).toHaveTextContent(/Masuk dengan Google/i);
    });

    const linkLupaInAlert = screen.getByRole('alert').querySelector('button');
    expect(linkLupaInAlert).toHaveTextContent('Lupa password?');
    fireEvent.click(linkLupaInAlert!);

    expect(screen.getByText('Lupa password?')).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toHaveValue('user@test.com');
  });

  it('email_not_confirmed -> tombol Kirim kode verifikasi -> form kode', async () => {
    mockMasukEmail.mockRejectedValue({ code: 'email_not_confirmed' });
    mockKirimUlangKodeDaftar.mockResolvedValue({});
    renderMasuk();

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'unconfirmed@test.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /^masuk$/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Email belum dikonfirmasi.');
    });

    const btnKirimKode = screen.getByRole('button', { name: /kirim kode verifikasi/i });
    fireEvent.click(btnKirimKode);

    await waitFor(() => {
      expect(mockKirimUlangKodeDaftar).toHaveBeenCalledWith('unconfirmed@test.com');
      expect(screen.getByText('Masukkan kode')).toBeInTheDocument();
    });
  });

  it('user_banned -> pesan akun dibekukan 5 hari', async () => {
    mockMasukEmail.mockRejectedValue({ code: 'user_banned' });
    renderMasuk();

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'banned@test.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /^masuk$/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Akunmu dibekukan 5 hari/i);
    });
  });

  it('memanggil masukGoogle saat tombol Google diklik', async () => {
    mockMasukGoogle.mockResolvedValue(undefined);
    renderMasuk();

    const tombolGoogle = screen.getByRole('button', { name: /masuk dengan google/i });
    fireEvent.click(tombolGoogle);

    expect(mockMasukGoogle).toHaveBeenCalledTimes(1);
  });

  it('memiliki role tablist dan aria-label pada tab masuk dan daftar', () => {
    renderMasuk();
    const tablist = screen.getByRole('tablist', { name: /pilih masuk atau daftar/i });
    expect(tablist).toBeInTheDocument();
  });

  it('daftar berhasil -> form Masukkan kode tampil dengan email pengguna', async () => {
    mockDaftarEmail.mockResolvedValue({ user: { id: 'u1', identities: [{ id: '1' }] } });
    renderMasuk();

    const tombolTabDaftar = screen.getByRole('tab', { name: /^daftar$/i });
    fireEvent.click(tombolTabDaftar);

    const inputEmail = screen.getByLabelText(/^email$/i);
    const inputPassword = screen.getByLabelText(/^password$/i);
    const inputUlangi = screen.getByLabelText(/ulangi password/i);
    const tombolDaftar = screen.getByRole('button', { name: /^daftar$/i });

    fireEvent.change(inputEmail, { target: { value: 'calon@test.com' } });
    fireEvent.change(inputPassword, { target: { value: 'password123' } });
    fireEvent.change(inputUlangi, { target: { value: 'password123' } });
    fireEvent.click(tombolDaftar);

    await waitFor(() => {
      expect(screen.getByText('Masukkan kode')).toBeInTheDocument();
      expect(screen.getByText(/Kami mengirim 6 angka ke/i)).toHaveTextContent('calon@test.com');
      expect(screen.getByLabelText(/kode verifikasi/i)).toBeInTheDocument();
    });
  });

  it('daftar dengan user_already_exists -> error tampil dan form kode tidak tampil', async () => {
    const err: any = new Error('User already registered');
    err.code = 'user_already_exists';
    mockDaftarEmail.mockRejectedValue(err);

    renderMasuk();

    const tombolTabDaftar = screen.getByRole('tab', { name: /^daftar$/i });
    fireEvent.click(tombolTabDaftar);

    const inputEmail = screen.getByLabelText(/^email$/i);
    const inputPassword = screen.getByLabelText(/^password$/i);
    const inputUlangi = screen.getByLabelText(/ulangi password/i);
    const tombolDaftar = screen.getByRole('button', { name: /^daftar$/i });

    fireEvent.change(inputEmail, { target: { value: 'terdaftar@test.com' } });
    fireEvent.change(inputPassword, { target: { value: 'password123' } });
    fireEvent.change(inputUlangi, { target: { value: 'password123' } });
    fireEvent.click(tombolDaftar);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Email sudah terdaftar. Silakan masuk atau pakai Lupa password.'
      );
    });

    expect(screen.queryByText('Masukkan kode')).not.toBeInTheDocument();
  });

  it('kode bukan 6 angka -> Kode harus 6 angka dan Supabase tidak dipanggil', async () => {
    mockDaftarEmail.mockResolvedValue({});
    renderMasuk();

    // Masuk ke form kode
    fireEvent.click(screen.getByRole('tab', { name: /^daftar$/i }));
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/ulangi password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /^daftar$/i }));

    await waitFor(() => {
      expect(screen.getByText('Masukkan kode')).toBeInTheDocument();
    });

    const inputKode = screen.getByLabelText(/kode verifikasi/i);
    fireEvent.change(inputKode, { target: { value: '123' } });

    // Submit form langsung
    fireEvent.submit(inputKode.closest('form')!);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Kode harus 6 angka.');
    });

    expect(mockVerifikasiKodeDaftar).not.toHaveBeenCalled();
  });

  it('otp_expired -> pesan kode salah/kedaluwarsa', async () => {
    mockDaftarEmail.mockResolvedValue({});
    const err: any = new Error('Token has expired');
    err.code = 'otp_expired';
    mockVerifikasiKodeDaftar.mockRejectedValue(err);

    renderMasuk();

    // Masuk ke form kode
    fireEvent.click(screen.getByRole('tab', { name: /^daftar$/i }));
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/ulangi password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /^daftar$/i }));

    await waitFor(() => {
      expect(screen.getByText('Masukkan kode')).toBeInTheDocument();
    });

    const inputKode = screen.getByLabelText(/kode verifikasi/i);
    fireEvent.change(inputKode, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /^verifikasi$/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Kode salah atau sudah kedaluwarsa. Minta kode baru.'
      );
    });
  });

  it('tombol Kirim ulang kode disabled selama 60 detik', async () => {
    vi.useFakeTimers();
    mockDaftarEmail.mockResolvedValue({});
    renderMasuk();

    // Masuk ke form kode
    fireEvent.click(screen.getByRole('tab', { name: /^daftar$/i }));
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'timer@test.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/ulangi password/i), { target: { value: 'password123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^daftar$/i }));
    });

    expect(screen.getByText('Masukkan kode')).toBeInTheDocument();

    const tombolKirimUlang = screen.getByRole('button', { name: /kirim ulang kode/i });
    expect(tombolKirimUlang).toBeDisabled();
    expect(tombolKirimUlang).toHaveTextContent(/kirim ulang kode \(60s\)/i);

    // Majukan waktu 30 detik
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(tombolKirimUlang).toBeDisabled();
    expect(tombolKirimUlang).toHaveTextContent(/kirim ulang kode \(30s\)/i);

    // Majukan waktu 30 detik lagi (total 60s)
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(tombolKirimUlang).not.toBeDisabled();
    expect(tombolKirimUlang).toHaveTextContent('Kirim ulang kode');

    vi.useRealTimers();
  });

  it('lupa password -> kode benar -> form Buat password baru tampil', async () => {
    vi.restoreAllMocks();
    mockSignUp.mockClear();

    // Mock supabase calls
    const mockReset = vi.fn().mockResolvedValue({ data: {}, error: null });
    const mockOtp = vi.fn().mockResolvedValue({ data: {}, error: null });
    const supabaseModule = await import('../lib/supabase');
    supabaseModule.supabase!.auth.resetPasswordForEmail = mockReset as any;
    supabaseModule.supabase!.auth.verifyOtp = mockOtp as any;

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/masuk']}>
          <Routes>
            <Route path="/masuk" element={<Masuk />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    // Klik Lupa password?
    fireEvent.click(screen.getByRole('button', { name: /lupa password\?/i }));
    expect(screen.getByText('Lupa password?')).toBeInTheDocument();

    // Masukkan email dan kirim kode reset
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'reset@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /kirim kode reset/i }));

    await waitFor(() => {
      expect(screen.getByText('Masukkan kode')).toBeInTheDocument();
    });

    // Masukkan kode 6 digit
    const inputKode = screen.getByLabelText(/kode verifikasi/i);
    fireEvent.change(inputKode, { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: /^verifikasi$/i }));

    await waitFor(() => {
      expect(mockOtp).toHaveBeenCalledWith({
        email: 'reset@test.com',
        token: '654321',
        type: 'recovery',
      });
      expect(screen.getByText('Buat password baru')).toBeInTheDocument();
    });
  });
});

describe('AuthContext - verifikasi email & OTP', () => {
  it('melempar error user_already_exists jika identities kosong saat daftarEmail', async () => {
    vi.restoreAllMocks();
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'user-123', identities: [] } },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await expect(
      result.current.daftarEmail('googleuser@test.com', 'password123')
    ).rejects.toMatchObject({
      code: 'user_already_exists',
    });
  });

  it('RPC mengembalikan error -> verifikasiKodeDaftar melempar error dan status tidak menjadi true', async () => {
    vi.restoreAllMocks();
    const supabaseModule = await import('../lib/supabase');
    supabaseModule.supabase!.auth.verifyOtp = vi.fn().mockResolvedValue({ data: {}, error: null }) as any;
    supabaseModule.supabase!.rpc = vi.fn().mockResolvedValue({ error: new Error('Gagal RPC') }) as any;

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await expect(
      result.current.verifikasiKodeDaftar('test@test.com', '123456')
    ).rejects.toThrow('Gagal RPC');

    expect(result.current.sudahVerifikasiEmail).not.toBe(true);
  });

  it('select verifikasi_email gagal 3 kali -> dianggap true untuk sesi ini', async () => {
    vi.restoreAllMocks();
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') }),
      }),
    });
    const supabaseModule = await import('../lib/supabase');
    (supabaseModule.supabase!.from as any).mockImplementation((table: string) => {
      if (table === 'verifikasi_email') return { select: mockSelect };
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }) }) };
    });

    supabaseModule.supabase!.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: { user: { id: 'user-net-err' } } },
    }) as any;

    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    // Wait for the 3 attempts (each has 1s delay in-between)
    await waitFor(
      () => {
        expect(result.current.sudahVerifikasiEmail).toBe(true);
      },
      { timeout: 4000 }
    );

    expect(spyConsole).toHaveBeenCalledWith(
      expect.stringContaining('Gagal memeriksa status verifikasi email setelah 3 percobaan')
    );
    spyConsole.mockRestore();
  });

  it('respons select lama yang datang terlambat tidak menimpa true setelah tandaiEmailTerverifikasi', async () => {
    vi.restoreAllMocks();
    let resolveSlowSelect: (val: any) => void;
    const slowPromise = new Promise((resolve) => {
      resolveSlowSelect = resolve;
    });

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockReturnValue(slowPromise),
      }),
    });

    const supabaseModule = await import('../lib/supabase');
    (supabaseModule.supabase!.from as any).mockImplementation((table: string) => {
      if (table === 'verifikasi_email') return { select: mockSelect };
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }) }) };
    });

    supabaseModule.supabase!.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: { user: { id: 'user-race' } } },
    }) as any;
    supabaseModule.supabase!.rpc = vi.fn().mockResolvedValue({ error: null }) as any;

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    // Panggil tandaiEmailTerverifikasi yang sukses
    await act(async () => {
      await result.current.tandaiEmailTerverifikasi();
    });
    expect(result.current.sudahVerifikasiEmail).toBe(true);

    // Sekarang respons select lama selesai dan mengembalikan data: null (belum verifikasi)
    await act(async () => {
      resolveSlowSelect!({ data: null, error: null });
    });

    // Harus tetap true, tidak tertimpa
    expect(result.current.sudahVerifikasiEmail).toBe(true);
  });
});
