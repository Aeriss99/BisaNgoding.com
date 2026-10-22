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
    verifikasiKodeDaftar,
    kirimUlangKodeDaftar,
    kirimResetPassword,
    verifikasiKodeReset,
    aturPassword,
  } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'masuk' | 'daftar'>('masuk');
  const [mode, setMode] = useState<
    'normal' | 'lupa-password' | 'otp-daftar' | 'otp-reset'
  >('normal');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ulangiPassword, setUlangiPassword] = useState('');
  const [kode, setKode] = useState('');

  const [lihatPassword, setLihatPassword] = useState(false);
  const [lihatUlangiPassword, setLihatUlangiPassword] = useState(false);

  const [sedangProses, setSedangProses] = useState(false);
  const [sedangProsesGoogle, setSedangProsesGoogle] = useState(false);
  const [sedangKirimUlang, setSedangKirimUlang] = useState(false);
  const [error, setError] = useState('');
  const [pesanSukses, setPesanSukses] = useState('');

  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (user && !sedangPulihkanPassword) {
      navigate('/', { replace: true });
    }
  }, [user, sedangPulihkanPassword, navigate]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      window.location.hash.startsWith('#')
        ? window.location.hash.substring(1).replace(/^\/?/, '')
        : window.location.hash
    );

    const errorCode = searchParams.get('error_code') || hashParams.get('error_code');
    const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');

    if (errorCode === 'user_banned' || (errorDesc && errorDesc.toLowerCase().includes('banned'))) {
      setError(petakanErrorAuth({ code: 'user_banned' }));
    } else if (errorCode) {
      setError(petakanErrorAuth({ code: errorCode, message: errorDesc }));
    }
  }, []);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  if (user && !sedangPulihkanPassword) {
    return <Navigate to="/" replace />;
  }

  const isValidEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

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
    } catch (err: any) {
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
      setSedangProses(false);
      setMode('otp-daftar');
      setKode('');
      setCountdown(60);
      setError('');
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
      setSedangProses(false);
      setMode('otp-reset');
      setKode('');
      setCountdown(60);
      setError('');
    } catch (err) {
      setError(petakanErrorAuth(err));
      setSedangProses(false);
    }
  };

  const handleKirimKodeVerifikasiDariLogin = async () => {
    setError('');
    setPesanSukses('');
    const emailBersih = email.trim();
    if (!isValidEmail(emailBersih)) {
      setError('Email tidak valid.');
      return;
    }
    setSedangProses(true);
    try {
      await kirimUlangKodeDaftar(emailBersih);
      setSedangProses(false);
      setMode('otp-daftar');
      setKode('');
      setCountdown(60);
    } catch (err) {
      setError(petakanErrorAuth(err));
      setSedangProses(false);
    }
  };

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
      if (mode === 'otp-daftar') {
        await verifikasiKodeDaftar(email.trim(), kode);
        navigate('/', { replace: true });
      } else if (mode === 'otp-reset') {
        await verifikasiKodeReset(email.trim(), kode);
      }
    } catch (err) {
      setError(petakanErrorAuth(err));
      setSedangProses(false);
    }
  };

  const handleKirimUlangKode = async () => {
    if (countdown > 0) return;
    setError('');
    setPesanSukses('');
    setSedangKirimUlang(true);
    try {
      if (mode === 'otp-daftar') {
        await kirimUlangKodeDaftar(email.trim());
      } else {
        await kirimResetPassword(email.trim());
      }
      setPesanSukses('Kode baru telah dikirim.');
      setCountdown(60);
    } catch (err) {
      setError(petakanErrorAuth(err));
    } finally {
      setSedangKirimUlang(false);
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
    <div className="min-h-screen bg-[var(--color-landing-bg)] text-[var(--color-landing-black)] font-space flex items-center justify-center p-4 sm:p-6 overflow-x-clip selection:bg-[var(--color-landing-cyan)]">
      {/* Kontainer relatif penampung stiker dan kartu */}
      <div className="relative w-full max-w-[440px] mt-[100px] xl:mt-0">
        {/* Stiker HP & Tablet (< 1100px) */}
        <div
          aria-hidden="true"
          className="xl:hidden pointer-events-none select-none absolute left-0 right-0 -top-[100px] h-[100px] overflow-visible"
        >
          {/* Stiker 1 */}
          <div
            style={{
              position: 'absolute',
              left: '-18px',
              top: '-22px',
              transform: 'rotate(-10deg) scale(0.6)',
              width: '140px',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '112px',
                height: '88px',
                background: '#ffe838',
                border: '3px solid #111111',
                borderRadius: '16px',
                boxShadow: '5px 5px 0 #111111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Bungee, sans-serif',
                fontSize: '44px',
                lineHeight: 1,
              }}
            >
              {'{ }'}
            </div>
          </div>
          {/* Stiker 10 */}
          <div
            style={{
              position: 'absolute',
              left: '110px',
              top: '-30px',
              transform: 'rotate(-4deg) scale(0.6)',
              width: '140px',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ position: 'relative', paddingBottom: '18px' }}>
              <div
                style={{
                  background: '#ffffff',
                  border: '3px solid #111111',
                  borderRadius: '16px',
                  boxShadow: '4px 4px 0 #111111',
                  padding: '12px 14px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: '16px',
                  whiteSpace: 'nowrap',
                }}
              >
                Halo, dunia!
              </div>
              <svg
                width="30"
                height="24"
                viewBox="0 0 30 24"
                style={{ position: 'absolute', left: '20px', bottom: 0 }}
                aria-hidden="true"
              >
                <path
                  d="M2 0v22L22 0"
                  fill="#ffffff"
                  stroke="#111111"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path d="M4 0h17" stroke="#ffffff" strokeWidth="4" />
              </svg>
            </div>
          </div>
          {/* Stiker 5 */}
          <div
            style={{
              position: 'absolute',
              left: '262px',
              top: '-20px',
              transform: 'rotate(8deg) scale(0.6)',
              width: '140px',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '108px',
                height: '108px',
                borderRadius: '50%',
                background: '#ffe7c7',
                border: '3px solid #111111',
                boxShadow: '5px 5px 0 #111111',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
            >
              <svg width="46" height="46" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 2c1 3.5-1.5 5-1.5 7.5 0 1.4 1 2.5 2.4 2.5 1.6 0 2.6-1.3 2.4-3.2C17.6 10.6 19 13 19 15.5 19 19.1 15.9 22 12 22s-7-2.9-7-6.5C5 10 10.5 7.5 12 2z"
                  fill="#f97316"
                  stroke="#111111"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 13.5c.6 1.6-1 2.2-1 3.4 0 .9.5 1.6 1.4 1.6 1.2 0 1.9-1 1.7-2.4"
                  fill="#ffe838"
                  stroke="#111111"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                style={{
                  fontFamily: 'Bungee, sans-serif',
                  fontSize: '15px',
                  color: '#111111',
                }}
              >
                7 HARI
              </span>
            </div>
          </div>
        </div>

        {/* Stiker Laptop (≥ 1100px) */}
        <div
          aria-hidden="true"
          className="hidden xl:block pointer-events-none select-none"
        >
          {/* Stiker 1 */}
          <div
            style={{
              position: 'absolute',
              left: '-190px',
              top: '54px',
              transform: 'rotate(-10deg)',
              width: '140px',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '112px',
                height: '88px',
                background: '#ffe838',
                border: '3px solid #111111',
                borderRadius: '16px',
                boxShadow: '5px 5px 0 #111111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Bungee, sans-serif',
                fontSize: '44px',
                lineHeight: 1,
              }}
            >
              {'{ }'}
            </div>
          </div>
          {/* Stiker 10 */}
          <div
            style={{
              position: 'absolute',
              left: '-280px',
              top: '314px',
              transform: 'rotate(-5deg)',
              width: '140px',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ position: 'relative', paddingBottom: '18px' }}>
              <div
                style={{
                  background: '#ffffff',
                  border: '3px solid #111111',
                  borderRadius: '16px',
                  boxShadow: '4px 4px 0 #111111',
                  padding: '12px 14px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: '16px',
                  whiteSpace: 'nowrap',
                }}
              >
                Halo, dunia!
              </div>
              <svg
                width="30"
                height="24"
                viewBox="0 0 30 24"
                style={{ position: 'absolute', left: '20px', bottom: 0 }}
                aria-hidden="true"
              >
                <path
                  d="M2 0v22L22 0"
                  fill="#ffffff"
                  stroke="#111111"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path d="M4 0h17" stroke="#ffffff" strokeWidth="4" />
              </svg>
            </div>
          </div>
          {/* Stiker 5 */}
          <div
            style={{
              position: 'absolute',
              left: '-175px',
              top: '544px',
              transform: 'rotate(8deg)',
              width: '140px',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '108px',
                height: '108px',
                borderRadius: '50%',
                background: '#ffe7c7',
                border: '3px solid #111111',
                boxShadow: '5px 5px 0 #111111',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
            >
              <svg width="46" height="46" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 2c1 3.5-1.5 5-1.5 7.5 0 1.4 1 2.5 2.4 2.5 1.6 0 2.6-1.3 2.4-3.2C17.6 10.6 19 13 19 15.5 19 19.1 15.9 22 12 22s-7-2.9-7-6.5C5 10 10.5 7.5 12 2z"
                  fill="#f97316"
                  stroke="#111111"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 13.5c.6 1.6-1 2.2-1 3.4 0 .9.5 1.6 1.4 1.6 1.2 0 1.9-1 1.7-2.4"
                  fill="#ffe838"
                  stroke="#111111"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                style={{
                  fontFamily: 'Bungee, sans-serif',
                  fontSize: '15px',
                  color: '#111111',
                }}
              >
                7 HARI
              </span>
            </div>
          </div>
          {/* Stiker 3 */}
          <div
            style={{
              position: 'absolute',
              left: '515px',
              top: '34px',
              transform: 'rotate(7deg)',
              width: '140px',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '128px',
                background: '#111111',
                border: '3px solid #111111',
                boxShadow: '5px 5px 0 #a78bfa',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  height: '20px',
                  background: '#ffffff',
                  borderBottom: '3px solid #111111',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '0 8px',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ff3dcb',
                    border: '1.5px solid #111111',
                  }}
                ></span>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ffe838',
                    border: '1.5px solid #111111',
                  }}
                ></span>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#2fe6f0',
                    border: '1.5px solid #111111',
                  }}
                ></span>
              </div>
              <div
                style={{
                  padding: '12px 12px 14px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: '30px',
                  lineHeight: 1,
                  color: '#2fe6f0',
                }}
              >
                &gt;_
              </div>
            </div>
          </div>
          {/* Stiker 7 */}
          <div
            style={{
              position: 'absolute',
              left: '590px',
              top: '294px',
              transform: 'rotate(-12deg)',
              width: '140px',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="132"
              height="132"
              viewBox="0 0 132 132"
              aria-hidden="true"
            >
              <g transform="translate(5 5)">
                <polygon
                  points="64.0,2.0 76.4,17.6 95.0,10.3 97.9,30.1 117.7,33.0 110.4,51.6 126.0,64.0 110.4,76.4 117.7,95.0 97.9,97.9 95.0,117.7 76.4,110.4 64.0,126.0 51.6,110.4 33.0,117.7 30.1,97.9 10.3,95.0 17.6,76.4 2.0,64.0 17.6,51.6 10.3,33.0 30.1,30.1 33.0,10.3 51.6,17.6"
                  fill="#111111"
                />
              </g>
              <polygon
                points="64.0,2.0 76.4,17.6 95.0,10.3 97.9,30.1 117.7,33.0 110.4,51.6 126.0,64.0 110.4,76.4 117.7,95.0 97.9,97.9 95.0,117.7 76.4,110.4 64.0,126.0 51.6,110.4 33.0,117.7 30.1,97.9 10.3,95.0 17.6,76.4 2.0,64.0 17.6,51.6 10.3,33.0 30.1,30.1 33.0,10.3 51.6,17.6"
                fill="#ff3dcb"
                stroke="#111111"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <text
                x="64"
                y="71"
                textAnchor="middle"
                fontFamily="Bungee, sans-serif"
                fontSize="19"
                fill="#111111"
              >
                GRATIS!
              </text>
            </svg>
          </div>
          {/* Stiker 8 */}
          <div
            style={{
              position: 'absolute',
              left: '505px',
              top: '554px',
              transform: 'rotate(12deg)',
              width: '140px',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="110"
              height="130"
              viewBox="0 0 110 130"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M45 104c0 10 5 18 10 22 5-4 10-12 10-22z"
                fill="#ffe838"
                stroke="#111111"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path d="M50 104c0 6 2 11 5 14 3-3 5-8 5-14z" fill="#f97316" />
              <path
                d="M36 70L18 92l20 4zM74 70l18 22-20 4z"
                fill="#a78bfa"
                stroke="#111111"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path
                d="M55 6C40 18 34 40 36 70l4 34h30l4-34c2-30-4-52-19-64z"
                fill="#ffffff"
                stroke="#111111"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <circle
                cx="55"
                cy="50"
                r="11"
                fill="#2fe6f0"
                stroke="#111111"
                strokeWidth="3.5"
              />
              <path
                d="M44 26c6-4 16-4 22 0"
                stroke="#111111"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Kartu login */}
        <div className="bg-[var(--color-landing-card)] border-[3px] border-[var(--color-landing-black)] shadow-[6px_6px_0_#111111] p-6 sm:p-8 w-full">
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
                <div
                  role="alert"
                  className="mb-4 p-3 bg-red-100 border-[2px] border-red-500 text-red-700 text-sm font-medium"
                >
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
                      aria-label={
                        lihatPassword
                          ? 'Sembunyikan password'
                          : 'Tampilkan password'
                      }
                      onClick={() => setLihatPassword(!lihatPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-black"
                    >
                      {lihatPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
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
                      aria-label={
                        lihatUlangiPassword
                          ? 'Sembunyikan password'
                          : 'Tampilkan password'
                      }
                      onClick={() =>
                        setLihatUlangiPassword(!lihatUlangiPassword)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-black"
                    >
                      {lihatUlangiPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sedangProses}
                  className="w-full min-h-[44px] bg-[var(--color-landing-cyan)] border-[3px] border-[var(--color-landing-black)] py-3 px-4 font-bungee text-base shadow-[4px_4px_0_#111111] hover:shadow-[2px_2px_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-75 disabled:cursor-wait mt-2 cursor-pointer"
                >
                  {sedangProses ? 'MEMPROSES...' : 'SIMPAN PASSWORD'}
                </button>
              </form>
            </div>
          ) : mode === 'otp-daftar' || mode === 'otp-reset' ? (
            <div>
              <h1 className="font-bungee text-xl text-center mb-4">
                Masukkan kode
              </h1>

              <p className="text-sm text-gray-700 text-center mb-6 leading-relaxed">
                Kami mengirim 6 angka ke{' '}
                <strong className="text-[var(--color-landing-black)] font-bold">
                  {email}
                </strong>{' '}
                dari bisangoding.notif@gmail.com. Cek juga folder spam.
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
                    htmlFor="kode-otp"
                    className="block font-bold text-sm mb-1 text-[var(--color-landing-black)] text-center"
                  >
                    Kode verifikasi
                  </label>
                  <input
                    id="kode-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={kode}
                    onChange={(e) =>
                      setKode(e.target.value.replace(/\D/g, ''))
                    }
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
                    onClick={handleKirimUlangKode}
                    className="text-sm font-bold text-[var(--color-landing-black)] disabled:text-gray-400 disabled:cursor-not-allowed hover:text-[var(--color-accent)] min-h-[44px] flex items-center justify-center cursor-pointer"
                  >
                    {countdown > 0
                      ? `Kirim ulang kode (${countdown}s)`
                      : 'Kirim ulang kode'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'otp-reset' ? 'lupa-password' : 'normal');
                      setError('');
                      setPesanSukses('');
                      setKode('');
                    }}
                    className="text-sm font-bold text-[var(--color-landing-black)] underline hover:text-[var(--color-accent)] min-h-[44px] flex items-center justify-center cursor-pointer"
                  >
                    Ganti email
                  </button>
                </div>
              </form>
            </div>
          ) : mode === 'lupa-password' ? (
            <div>
              <h1 className="font-bungee text-xl text-center mb-6">
                Lupa password?
              </h1>

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
                  className="w-full min-h-[44px] bg-[var(--color-landing-cyan)] border-[3px] border-[var(--color-landing-black)] py-3 px-4 font-bungee text-base shadow-[4px_4px_0_#111111] hover:shadow-[2px_2px_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-75 disabled:cursor-wait mt-2 cursor-pointer"
                >
                  {sedangProses ? 'MEMPROSES...' : 'KIRIM KODE RESET'}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('normal');
                      setError('');
                      setPesanSukses('');
                    }}
                    className="text-sm font-bold text-[var(--color-landing-black)] underline hover:text-[var(--color-accent)] min-h-[44px] flex items-center justify-center mx-auto cursor-pointer"
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
                  className={`flex-1 py-2.5 font-bungee text-base min-h-[44px] transition-colors cursor-pointer ${
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
                  className={`flex-1 py-2.5 font-bungee text-base min-h-[44px] border-l-[3px] border-[var(--color-landing-black)] transition-colors cursor-pointer ${
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
                className="w-full min-h-[44px] bg-white border-[3px] border-[var(--color-landing-black)] py-3 px-4 font-bungee text-sm sm:text-base shadow-[4px_4px_0_#111111] hover:shadow-[2px_2px_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-3 disabled:opacity-75 disabled:cursor-wait cursor-pointer"
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
                <span>
                  {sedangProsesGoogle
                    ? 'MEMBUKA GOOGLE...'
                    : 'MASUK DENGAN GOOGLE'}
                </span>
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
                <div
                  role="alert"
                  className="mb-4 p-3 bg-red-100 border-[2px] border-red-500 text-red-700 text-sm font-medium"
                >
                  {error.includes('Lupa password?') ? (
                    <p>
                      Email atau password salah. Kalau biasanya masuk dengan Google, pakai tombol{' '}
                      <strong className="font-bold">Masuk dengan Google</strong>, atau buat password lewat{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('lupa-password');
                          setError('');
                          setPesanSukses('');
                        }}
                        className="underline font-bold text-[var(--color-accent)] hover:text-blue-900 cursor-pointer inline"
                      >
                        Lupa password?
                      </button>
                    </p>
                  ) : (
                    <p>{error}</p>
                  )}
                  {error.includes('Email belum dikonfirmasi') && (
                    <button
                      type="button"
                      onClick={handleKirimKodeVerifikasiDariLogin}
                      disabled={sedangProses}
                      className="mt-2 text-sm font-bold underline text-[var(--color-accent)] hover:text-blue-900 block cursor-pointer"
                    >
                      Kirim kode verifikasi
                    </button>
                  )}
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
                        aria-label={
                          lihatPassword
                            ? 'Sembunyikan password'
                            : 'Tampilkan password'
                        }
                        onClick={() => setLihatPassword(!lihatPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-black cursor-pointer"
                      >
                        {lihatPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={sedangProses}
                    className="w-full min-h-[44px] bg-[var(--color-landing-cyan)] border-[3px] border-[var(--color-landing-black)] py-3 px-4 font-bungee text-base shadow-[4px_4px_0_#111111] hover:shadow-[2px_2px_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-75 disabled:cursor-wait mt-2 cursor-pointer"
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
                      className="text-sm font-bold text-[var(--color-landing-black)] underline hover:text-[var(--color-accent)] min-h-[44px] inline-flex items-center cursor-pointer"
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
                        aria-label={
                          lihatPassword
                            ? 'Sembunyikan password'
                            : 'Tampilkan password'
                        }
                        onClick={() => setLihatPassword(!lihatPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-black cursor-pointer"
                      >
                        {lihatPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
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
                        aria-label={
                          lihatUlangiPassword
                            ? 'Sembunyikan password'
                            : 'Tampilkan password'
                        }
                        onClick={() =>
                          setLihatUlangiPassword(!lihatUlangiPassword)
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-black cursor-pointer"
                      >
                        {lihatUlangiPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={sedangProses}
                    className="w-full min-h-[44px] bg-[var(--color-landing-cyan)] border-[3px] border-[var(--color-landing-black)] py-3 px-4 font-bungee text-base shadow-[4px_4px_0_#111111] hover:shadow-[2px_2px_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-75 disabled:cursor-wait mt-2 cursor-pointer"
                  >
                    {sedangProses ? 'MEMPROSES...' : 'DAFTAR'}
                  </button>
                </form>
              )}

              <p className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-600 leading-relaxed text-center">
                Pernah masuk dengan Google? Klik{' '}
                <strong className="text-[var(--color-landing-black)]">
                  Lupa password?
                </strong>{' '}
                dan pakai email Google yang sama untuk membuat password. Akun dan
                progresmu tetap sama.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
