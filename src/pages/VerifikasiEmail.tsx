import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { petakanErrorAuth } from '../lib/authError';

export default function VerifikasiEmail() {
  const {
    user,
    sudahVerifikasiEmail,
    tandaiEmailTerverifikasi,
    keluar,
  } = useAuth();
  const navigate = useNavigate();

  const [kode, setKode] = useState('');
  const [sedangProses, setSedangProses] = useState(false);
  const [sedangKirimUlang, setSedangKirimUlang] = useState(false);
  const [error, setError] = useState('');
  const [pesanSukses, setPesanSukses] = useState('');
  const [countdown, setCountdown] = useState(60);

  const initialSentRef = useRef(false);

  // Kirim kode otomatis satu kali saat pertama dibuka
  useEffect(() => {
    if (!user?.email || initialSentRef.current) return;
    initialSentRef.current = true;

    if (supabase) {
      supabase.auth.signInWithOtp({
        email: user.email,
        options: { shouldCreateUser: false },
      }).catch((err) => {
        setError(petakanErrorAuth(err));
      });
    }
  }, [user]);

  // Timer hitung mundur kirim ulang
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Jika sudah terverifikasi, langsung ke tujuan / beranda
  if (user && sudahVerifikasiEmail === true) {
    let tujuan: string | null = null;
    try {
      tujuan = sessionStorage.getItem('bn_tujuan');
      sessionStorage.removeItem('bn_tujuan');
    } catch {}
    const dest = tujuan && tujuan.startsWith('/') && !tujuan.startsWith('//') ? tujuan : '/';
    return <Navigate to={dest} replace />;
  }

  // Jika belum login, ke /masuk
  if (!user) {
    return <Navigate to="/masuk" replace />;
  }

  const handleVerifikasiKode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPesanSukses('');

    if (kode.length !== 6) {
      setError('Kode harus 6 angka.');
      return;
    }

    setSedangProses(true);
    try {
      if (supabase) {
        const { error: errOtp } = await supabase.auth.verifyOtp({
          email: user.email!,
          token: kode,
          type: 'email',
        });
        if (errOtp) throw errOtp;
      }

      await tandaiEmailTerverifikasi();

      let tujuan: string | null = null;
      try {
        tujuan = sessionStorage.getItem('bn_tujuan');
        sessionStorage.removeItem('bn_tujuan');
      } catch {}
      const dest =
        tujuan && tujuan.startsWith('/') && !tujuan.startsWith('//')
          ? tujuan
          : '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(petakanErrorAuth(err));
      setSedangProses(false);
    }
  };

  const handleKirimUlang = async () => {
    if (countdown > 0 || !user?.email) return;
    setError('');
    setPesanSukses('');
    setSedangKirimUlang(true);
    try {
      if (supabase) {
        const { error: errOtp } = await supabase.auth.signInWithOtp({
          email: user.email,
          options: { shouldCreateUser: false },
        });
        if (errOtp) throw errOtp;
      }
      setPesanSukses('Kode baru telah dikirim.');
      setCountdown(60);
    } catch (err) {
      setError(petakanErrorAuth(err));
    } finally {
      setSedangKirimUlang(false);
    }
  };

  const handleKeluar = async () => {
    await keluar();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--color-landing-bg)] text-[var(--color-landing-black)] font-space flex items-center justify-center p-4 sm:p-6 overflow-x-clip selection:bg-[var(--color-landing-cyan)]">
      <div className="relative w-full max-w-[440px]">
        <div className="bg-[var(--color-landing-card)] border-[3px] border-[var(--color-landing-black)] shadow-[6px_6px_0_#111111] p-6 sm:p-8 w-full">
          <Link
            to="/"
            className="text-2xl sm:text-3xl font-bungee tracking-wide text-center block mb-6 hover:opacity-90 transition-opacity"
            style={{ textShadow: '2px 2px 0 var(--color-landing-hero)' }}
          >
            BisaNgoding.com
          </Link>

          <h1 className="font-bungee text-xl text-center mb-3">
            Verifikasi Email
          </h1>

          <p className="text-sm text-gray-700 text-center mb-6 leading-relaxed">
            Satu langkah lagi. Kami mengirim 6 angka ke{' '}
            <strong className="text-[var(--color-landing-black)] font-bold">
              {user.email}
            </strong>{' '}
            dari bisangoding.notif@gmail.com untuk memastikan email ini milikmu. Ini hanya sekali.
          </p>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 bg-red-100 border-[2px] border-red-500 text-red-700 text-sm font-medium"
            >
              {error}
            </div>
          )}
          {pesanSukses && (
            <div
              role="status"
              className="mb-4 p-3 bg-green-100 border-[2px] border-green-600 text-green-800 text-sm font-medium"
            >
              {pesanSukses}
            </div>
          )}

          <form noValidate onSubmit={handleVerifikasiKode} className="space-y-4">
            <div>
              <label
                htmlFor="kode-verifikasi-email"
                className="block font-bold text-sm mb-1 text-[var(--color-landing-black)] text-center"
              >
                Kode verifikasi
              </label>
              <input
                id="kode-verifikasi-email"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={kode}
                onChange={(e) => setKode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                className="w-full min-h-[52px] px-3 py-2 border-[2px] border-[var(--color-landing-black)] bg-white font-mono text-2xl font-bold tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-landing-cyan)]"
              />
            </div>

            <button
              type="submit"
              disabled={kode.length !== 6 || sedangProses}
              className="w-full min-h-[44px] bg-[var(--color-landing-cyan)] border-[3px] border-[var(--color-landing-black)] py-3 px-4 font-bungee text-base shadow-[4px_4px_0_#111111] hover:shadow-[2px_2px_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
            >
              {sedangProses ? 'MEMPROSES...' : 'VERIFIKASI'}
            </button>

            <div className="flex flex-col items-center gap-2 mt-4 pt-3 border-t border-gray-200">
              <button
                type="button"
                disabled={countdown > 0 || sedangKirimUlang}
                onClick={handleKirimUlang}
                className="text-sm font-bold text-[var(--color-landing-black)] disabled:text-gray-400 disabled:cursor-not-allowed hover:text-[var(--color-accent)] min-h-[44px] flex items-center justify-center cursor-pointer"
              >
                {countdown > 0
                  ? `Kirim ulang kode (${countdown}s)`
                  : 'Kirim ulang kode'}
              </button>
              <button
                type="button"
                onClick={handleKeluar}
                className="text-sm font-bold text-red-600 hover:text-red-800 min-h-[44px] flex items-center justify-center cursor-pointer"
              >
                Keluar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
