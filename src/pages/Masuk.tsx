import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { petakanErrorAuth } from '../lib/authError';

export default function Masuk() {
  const {
    user,
    sedangPulihkanPassword,
    masukGoogle,
    masukEmail,
    daftarEmail,
    kirimResetPassword,
    aturPassword,
  } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'masuk' | 'daftar'>('masuk');
  const [mode, setMode] = useState<'normal' | 'lupa-password'>('normal');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ulangiPassword, setUlangiPassword] = useState('');

  const [lihatPassword, setLihatPassword] = useState(false);
  const [lihatUlangiPassword, setLihatUlangiPassword] = useState(false);

  const [sedangProses, setSedangProses] = useState(false);
  const [sedangProsesGoogle, setSedangProsesGoogle] = useState(false);
  const [error, setError] = useState('');
  const [pesanSukses, setPesanSukses] = useState('');

  useEffect(() => {
    if (user && !sedangPulihkanPassword) {
      navigate('/', { replace: true });
    }
  }, [user, sedangPulihkanPassword, navigate]);

  if (user && !sedangPulihkanPassword) {
    return <Navigate to="/" replace />;
  }

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleGoogleLogin = async () => {
    setError('');
    setPesanSukses('');
    setSedangProsesGoogle(true);
    try {
      await masukGoogle();
    } catch (err) {
      setError(petakanErrorAuth(err));
      setSedangProsesGoogle(false);
    }
  };

  const handleMasukEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPesanSukses('');

    const emailBersih = email.trim();
    if (!isValidEmail(emailBersih)) {
      setError('Email tidak valid.');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setSedangProses(true);
    try {
      await masukEmail(emailBersih, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(petakanErrorAuth(err));
      setSedangProses(false);
    }
  };

  const handleDaftarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPesanSukses('');

    const emailBersih = email.trim();
    if (!isValidEmail(emailBersih)) {
      setError('Email tidak valid.');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    if (password !== ulangiPassword) {
      setError('Ulangi password harus sama.');
      return;
    }

    setSedangProses(true);
    try {
      await daftarEmail(emailBersih, password);
      setPesanSukses('Cek email kamu dan klik link konfirmasi. Buka link-nya di browser ini juga.');
      setSedangProses(false);
    } catch (err) {
      setError(petakanErrorAuth(err));
      setSedangProses(false);
    }
  };

  const handleLupaPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPesanSukses('');

    const emailBersih = email.trim();
    if (!isValidEmail(emailBersih)) {
      setError('Email tidak valid.');
      return;
    }

    setSedangProses(true);
    try {
      await kirimResetPassword(emailBersih);
      setPesanSukses('Cek email kamu dan klik link konfirmasi untuk reset password. Buka link-nya di browser ini juga.');
      setSedangProses(false);
    } catch (err) {
      setError(petakanErrorAuth(err));
      setSedangProses(false);
    }
  };

  const handleAturPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPesanSukses('');

    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    if (password !== ulangiPassword) {
      setError('Ulangi password harus sama.');
      return;
    }

    setSedangProses(true);
    try {
      await aturPassword(password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(petakanErrorAuth(err));
      setSedangProses(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-landing-bg)] text-[var(--color-landing-black)] font-sans flex items-center justify-center p-4 sm:p-6 selection:bg-[var(--color-landing-cyan)]">
      <div className="bg-[var(--color-landing-card)] border-[3px] border-[var(--color-landing-black)] shadow-[4px_4px_0_#111111] p-6 sm:p-8 w-full max-w-[440px]">
        <Link
          to="/"
          className="text-2xl sm:text-3xl font-bungee tracking-wide text-center block mb-6 hover:opacity-90 transition-opacity"
          style={{ textShadow: '2px 2px 0 var(--color-landing-hero)' }}
        >
          BisaNgoding.com
        </Link>

        {sedangPulihkanPassword ? (
          <div>
            <h1 className="font-bungee text-xl text-center mb-6">
              Buat password baru
            </h1>

            {error && (
              <div role="alert" className="mb-4 p-3 bg-red-100 border-[2px] border-red-500 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <form noValidate onSubmit={handleAturPassword} className="space-y-4">
              <div>
                <label
                  htmlFor="password-baru"
                  className="block font-bold text-sm mb-1 text-[var(--color-landing-black)]"
                >
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    id="password-baru"
                    type={lihatPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3 py-2 pr-10 border-[2px] border-[var(--color-landing-black)] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-landing-cyan)]"
                  />
                  <button
                    type="button"
                    aria-label={lihatPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    onClick={() => setLihatPassword(!lihatPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-black"
                  >
                    {lihatPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="ulangi-password-baru"
                  className="block font-bold text-sm mb-1 text-[var(--color-landing-black)]"
                >
                  Ulangi Password
                </label>
                <div className="relative">
                  <input
                    id="ulangi-password-baru"
                    type={lihatUlangiPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={ulangiPassword}
                    onChange={(e) => setUlangiPassword(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3 py-2 pr-10 border-[2px] border-[var(--color-landing-black)] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-landing-cyan)]"
                  />
                  <button
                    type="button"
                    aria-label={lihatUlangiPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    onClick={() => setLihatUlangiPassword(!lihatUlangiPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-black"
                  >
                    {lihatUlangiPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={sedangProses}
                className="w-full min-h-[44px] bg-[var(--color-landing-cyan)] border-[3px] border-[var(--color-landing-black)] py-3 px-4 font-bungee text-base shadow-[4px_4px_0_#111111] hover:shadow-[2px_2px_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-75 disabled:cursor-wait mt-2"
              >
                {sedangProses ? 'MEMPROSES...' : 'SIMPAN PASSWORD'}
              </button>
            </form>
          </div>
        ) : mode === 'lupa-password' ? (
          <div>
            <h1 className="font-bungee text-xl text-center mb-6">
              Lupa password?
            </h1>

            {error && (
              <div role="alert" className="mb-4 p-3 bg-red-100 border-[2px] border-red-500 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}
            {pesanSukses && (
              <div role="status" className="mb-4 p-3 bg-green-100 border-[2px] border-green-600 text-green-800 text-sm font-medium">
                {pesanSukses}
              </div>
            )}

            <form noValidate onSubmit={handleLupaPassword} className="space-y-4">
              <div>
                <label
                  htmlFor="email-lupa"
                  className="block font-bold text-sm mb-1 text-[var(--color-landing-black)]"
                >
                  Email
                </label>
                <input
                  id="email-lupa"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@email.com"
                  className="w-full min-h-[44px] px-3 py-2 border-[2px] border-[var(--color-landing-black)] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-landing-cyan)]"
                />
              </div>

              <button
                type="submit"
                disabled={sedangProses}
                className="w-full min-h-[44px] bg-[var(--color-landing-cyan)] border-[3px] border-[var(--color-landing-black)] py-3 px-4 font-bungee text-base shadow-[4px_4px_0_#111111] hover:shadow-[2px_2px_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-75 disabled:cursor-wait mt-2"
              >
                {sedangProses ? 'MEMPROSES...' : 'KIRIM LINK RESET'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('normal');
                    setError('');
                    setPesanSukses('');
                  }}
                  className="text-sm font-bold text-[var(--color-landing-black)] underline hover:text-[var(--color-accent)] min-h-[44px] flex items-center justify-center mx-auto"
                >
                  Kembali ke Masuk
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div
              role="tablist"
              aria-label="Pilih masuk atau daftar"
              className="flex border-[3px] border-[var(--color-landing-black)] mb-6 bg-white"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'masuk'}
                onClick={() => {
                  setTab('masuk');
                  setError('');
                  setPesanSukses('');
                }}
                className={`flex-1 py-2.5 font-bungee text-base min-h-[44px] transition-colors ${
                  tab === 'masuk'
                    ? 'bg-[var(--color-landing-hero)] text-[var(--color-landing-black)]'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                MASUK
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'daftar'}
                onClick={() => {
                  setTab('daftar');
                  setError('');
                  setPesanSukses('');
                }}
                className={`flex-1 py-2.5 font-bungee text-base min-h-[44px] border-l-[3px] border-[var(--color-landing-black)] transition-colors ${
                  tab === 'daftar'
                    ? 'bg-[var(--color-landing-hero)] text-[var(--color-landing-black)]'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                DAFTAR
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={sedangProsesGoogle}
              className="w-full min-h-[44px] bg-white border-[3px] border-[var(--color-landing-black)] py-3 px-4 font-bungee text-sm sm:text-base shadow-[4px_4px_0_#111111] hover:shadow-[2px_2px_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-3 disabled:opacity-75 disabled:cursor-wait"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{sedangProsesGoogle ? 'MEMBUKA GOOGLE...' : 'MASUK DENGAN GOOGLE'}</span>
            </button>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-[2px] border-[var(--color-landing-black)]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[var(--color-landing-card)] px-3 font-bungee text-xs text-gray-500 uppercase tracking-wider">
                  atau
                </span>
              </div>
            </div>

            {error && (
              <div role="alert" className="mb-4 p-3 bg-red-100 border-[2px] border-red-500 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}
            {pesanSukses && (
              <div role="status" className="mb-4 p-3 bg-green-100 border-[2px] border-green-600 text-green-800 text-sm font-medium">
                {pesanSukses}
              </div>
            )}

            {tab === 'masuk' ? (
              <form noValidate onSubmit={handleMasukEmail} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block font-bold text-sm mb-1 text-[var(--color-landing-black)]"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="nama@email.com"
                    className="w-full min-h-[44px] px-3 py-2 border-[2px] border-[var(--color-landing-black)] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-landing-cyan)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block font-bold text-sm mb-1 text-[var(--color-landing-black)]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={lihatPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full min-h-[44px] px-3 py-2 pr-10 border-[2px] border-[var(--color-landing-black)] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-landing-cyan)]"
                    />
                    <button
                      type="button"
                      aria-label={lihatPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      onClick={() => setLihatPassword(!lihatPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-black"
                    >
                      {lihatPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sedangProses}
                  className="w-full min-h-[44px] bg-[var(--color-landing-cyan)] border-[3px] border-[var(--color-landing-black)] py-3 px-4 font-bungee text-base shadow-[4px_4px_0_#111111] hover:shadow-[2px_2px_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-75 disabled:cursor-wait mt-2"
                >
                  {sedangProses ? 'MEMPROSES...' : 'MASUK'}
                </button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('lupa-password');
                      setError('');
                      setPesanSukses('');
                    }}
                    className="text-sm font-bold text-[var(--color-landing-black)] underline hover:text-[var(--color-accent)] min-h-[44px] inline-flex items-center"
                  >
                    Lupa password?
                  </button>
                </div>
              </form>
            ) : (
              <form noValidate onSubmit={handleDaftarEmail} className="space-y-4">
                <div>
                  <label
                    htmlFor="daftar-email"
                    className="block font-bold text-sm mb-1 text-[var(--color-landing-black)]"
                  >
                    Email
                  </label>
                  <input
                    id="daftar-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="nama@email.com"
                    className="w-full min-h-[44px] px-3 py-2 border-[2px] border-[var(--color-landing-black)] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-landing-cyan)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="daftar-password"
                    className="block font-bold text-sm mb-1 text-[var(--color-landing-black)]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="daftar-password"
                      type={lihatPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full min-h-[44px] px-3 py-2 pr-10 border-[2px] border-[var(--color-landing-black)] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-landing-cyan)]"
                    />
                    <button
                      type="button"
                      aria-label={lihatPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      onClick={() => setLihatPassword(!lihatPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-black"
                    >
                      {lihatPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="daftar-ulangi-password"
                    className="block font-bold text-sm mb-1 text-[var(--color-landing-black)]"
                  >
                    Ulangi password
                  </label>
                  <div className="relative">
                    <input
                      id="daftar-ulangi-password"
                      type={lihatUlangiPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={ulangiPassword}
                      onChange={(e) => setUlangiPassword(e.target.value)}
                      required
                      className="w-full min-h-[44px] px-3 py-2 pr-10 border-[2px] border-[var(--color-landing-black)] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-landing-cyan)]"
                    />
                    <button
                      type="button"
                      aria-label={lihatUlangiPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      onClick={() => setLihatUlangiPassword(!lihatUlangiPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-black"
                    >
                      {lihatUlangiPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sedangProses}
                  className="w-full min-h-[44px] bg-[var(--color-landing-cyan)] border-[3px] border-[var(--color-landing-black)] py-3 px-4 font-bungee text-base shadow-[4px_4px_0_#111111] hover:shadow-[2px_2px_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-75 disabled:cursor-wait mt-2"
                >
                  {sedangProses ? 'MEMPROSES...' : 'DAFTAR'}
                </button>
              </form>
            )}

            <p className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-600 leading-relaxed text-center">
              Pernah masuk dengan Google? Klik <strong className="text-[var(--color-landing-black)]">Lupa password?</strong> dan pakai email Google yang sama untuk membuat password. Akun dan progresmu tetap sama.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
