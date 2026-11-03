import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { coursesData } from '../lib/content';
import { formatTanggalSertifikat } from '../lib/sertifikat';
import { Loader2, Search, CheckCircle2, XCircle } from 'lucide-react';

interface HasilCek {
  nama: string;
  kelas_id: string;
  terbit: string;
}

export default function CekSertifikat() {
  const { kode: kodeParam } = useParams<{ kode?: string }>();
  const navigate = useNavigate();

  const [inputKode, setInputKode] = useState(kodeParam || '');
  const [kodeAktif, setKodeAktif] = useState(kodeParam || '');
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilCek | null>(null);
  const [tidakDitemukan, setTidakDitemukan] = useState(false);
  const [sudahCek, setSudahCek] = useState(false);

  useEffect(() => {
    if (kodeParam) {
      setInputKode(kodeParam);
      setKodeAktif(kodeParam);
    }
  }, [kodeParam]);

  useEffect(() => {
    let aktif = true;

    async function cek(kode: string) {
      const kodeBersih = kode.trim().toUpperCase();
      if (!kodeBersih) {
        setHasil(null);
        setTidakDitemukan(false);
        setSudahCek(false);
        return;
      }

      setLoading(true);
      setSudahCek(true);

      if (!supabase) {
        setLoading(false);
        setTidakDitemukan(true);
        setHasil(null);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('cek_sertifikat', {
          p_kode: kodeBersih,
        });

        if (!aktif) return;

        if (error || !data || !Array.isArray(data) || data.length === 0) {
          setTidakDitemukan(true);
          setHasil(null);
        } else {
          setHasil(data[0] as HasilCek);
          setTidakDitemukan(false);
        }
      } catch {
        if (aktif) {
          setTidakDitemukan(true);
          setHasil(null);
        }
      } finally {
        if (aktif) setLoading(false);
      }
    }

    if (kodeAktif) {
      cek(kodeAktif);
    } else {
      setHasil(null);
      setTidakDitemukan(false);
      setSudahCek(false);
    }

    return () => {
      aktif = false;
    };
  }, [kodeAktif]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const kodeBersih = inputKode.trim().toUpperCase();
    if (!kodeBersih) return;
    setKodeAktif(kodeBersih);
    navigate(`/cek-sertifikat/${kodeBersih}`, { replace: true });
  };

  const course = hasil ? coursesData.find((c) => c.id === hasil.kelas_id) : null;
  const rawName = course?.namaPendek ?? course?.title ?? hasil?.kelas_id;
  const namaKelas = rawName ? rawName.replace(/^Kelas\s+/, '') : '';

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-main)] flex flex-col">
      {/* Header publik */}
      <header className="h-[68px] px-6 lg:px-12 bg-white border-b-[4px] border-[var(--color-text-main)] flex items-center justify-between">
        <Link
          to="/"
          className="font-bungee text-[18px] px-2 py-0.5 bg-[var(--color-primary)] text-[var(--color-text-main)] border-2 border-[var(--color-text-main)] no-underline"
        >
          BISANGODING
        </Link>
        <Link
          to="/masuk"
          className="font-space font-bold text-[14px] px-4 py-1.5 border-2 border-[var(--color-text-main)] rounded-lg bg-white shadow-[2px_2px_0_var(--color-text-main)] hover:translate-y-[-1px] no-underline text-[var(--color-text-main)]"
        >
          Masuk
        </Link>
      </header>

      {/* Konten Utama */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10 lg:py-16 flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center items-center">
          <h1 className="m-0 font-space text-[30px] lg:text-[40px] font-bold">
            Cek Keaslian Sertifikat
          </h1>
          <p className="m-0 text-[15px] lg:text-[16px] text-[#5a5a5a] max-w-lg">
            Masukkan kode sertifikat BisaNgoding untuk memverifikasi keaslian dan status kelulusan.
          </p>
        </div>

        {/* Form Isian Kode */}
        <form
          onSubmit={handleSubmit}
          className="box-border p-4 sm:p-6 border-[3px] border-[var(--color-text-main)] rounded-2xl bg-white shadow-[6px_6px_0_var(--color-text-main)] flex flex-col sm:flex-row gap-3"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputKode}
              onChange={(e) => setInputKode(e.target.value)}
              placeholder="Contoh: BN-ABCD-EF23"
              className="w-full px-4 py-3 border-[2px] border-[var(--color-text-main)] rounded-xl font-mono text-[16px] uppercase tracking-wider outline-none focus:bg-[#fffde6]"
              aria-label="Kode Sertifikat"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !inputKode.trim()}
            className="px-6 py-3 bg-[var(--color-primary)] border-[2px] border-[var(--color-text-main)] rounded-xl font-space font-bold text-[16px] shadow-[3px_3px_0_var(--color-text-main)] hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            CEK
          </button>
        </form>

        {/* Hasil Pencarian */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-main)]" />
            <span className="font-space text-[15px] text-[#5a5a5a]">
              Memeriksa keaslian kode...
            </span>
          </div>
        ) : sudahCek && hasil ? (
          /* Ditemukan */
          <div className="box-border p-6 sm:p-8 border-[3px] border-[var(--color-text-main)] rounded-2xl bg-[var(--color-success-light)] shadow-[6px_6px_0_var(--color-text-main)] flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-[var(--color-success)] shrink-0" />
              <h2 className="m-0 font-space text-[22px] lg:text-[26px] font-bold text-[var(--color-success)]">
                ✓ Sertifikat asli
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t-2 border-[var(--color-text-main)]">
              <div className="flex flex-col gap-1">
                <span className="text-[13px] text-[#5a5a5a]">Nama Penerima:</span>
                <span className="font-space font-bold text-[18px] text-[var(--color-text-main)]">
                  {hasil.nama}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[13px] text-[#5a5a5a]">Kelas:</span>
                <span className="font-space font-bold text-[18px] text-[var(--color-text-main)]">
                  Kelas {namaKelas}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[13px] text-[#5a5a5a]">Tanggal Terbit:</span>
                <span className="font-space font-bold text-[16px] text-[var(--color-text-main)]">
                  {formatTanggalSertifikat(hasil.terbit)}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[13px] text-[#5a5a5a]">Kode Verifikasi:</span>
                <span className="font-mono font-bold text-[16px] text-[var(--color-text-main)]">
                  {kodeAktif.trim().toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ) : sudahCek && tidakDitemukan ? (
          /* Tidak ditemukan */
          <div className="box-border p-6 sm:p-8 border-[3px] border-[var(--color-text-main)] rounded-2xl bg-[var(--color-danger-light)] shadow-[6px_6px_0_var(--color-text-main)] flex items-start gap-4">
            <XCircle className="w-7 h-7 text-[var(--color-danger)] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="m-0 font-space font-bold text-[17px] text-[var(--color-danger)]">
                Sertifikat dengan kode ini tidak ditemukan.
              </p>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
