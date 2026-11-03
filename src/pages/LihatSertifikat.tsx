import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { coursesData } from '../lib/content';
import { formatTanggalSertifikat, type DataSertifikat } from '../lib/sertifikat';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';

export function KartuSertifikat({
  sertifikat,
  namaKelas,
}: {
  sertifikat: DataSertifikat;
  namaKelas: string;
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const baseUrl = import.meta.env.BASE_URL || '/';
  const alamatCek = `${origin}${baseUrl}#/cek-sertifikat/${sertifikat.kode}`;

  return (
    <div
      className="area-cetak-sertifikat w-full max-w-[960px] aspect-[297/210] box-border p-3 sm:p-6 md:p-8 lg:p-10 bg-[var(--color-landing-card)] border-[4px] lg:border-[6px] border-[var(--color-text-main)] rounded-2xl shadow-[8px_8px_0_var(--color-text-main)] flex flex-col justify-between text-[var(--color-text-main)] relative overflow-hidden select-none"
    >
      {/* Frame dekoratif dalam */}
      <div className="w-full h-full border-2 border-[var(--color-text-main)] p-2 sm:p-5 md:p-6 lg:p-8 flex flex-col justify-between text-center relative">
        {/* Header / Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 bg-[var(--color-primary)] border-2 border-[var(--color-text-main)] font-bungee text-[9px] sm:text-[12px] md:text-[14px]">
            BISANGODING.COM
          </div>
          <div className="font-mono font-bold text-[8px] sm:text-[11px] md:text-[13px] text-[#5a5a5a] meta-sertifikat">
            KODE: <span className="text-[var(--color-text-main)]">{sertifikat.kode}</span>
          </div>
        </div>

        {/* Judul & Isi Utama */}
        <div className="my-auto flex flex-col items-center gap-1 sm:gap-2.5 md:gap-3 py-1">
          <h1 className="judul-sertifikat m-0 font-bungee text-[20px] sm:text-[32px] md:text-[44px] lg:text-[52px] tracking-wider text-[var(--color-text-main)] leading-none">
            SERTIFIKAT
          </h1>

          <p className="teks-sertifikat m-0 text-[9px] sm:text-[13px] md:text-[16px] text-[#5a5a5a]">
            diberikan kepada
          </p>

          <div className="nama-sertifikat font-space font-bold text-[15px] sm:text-[24px] md:text-[34px] lg:text-[42px] leading-tight text-[var(--color-text-main)] px-4 border-b-2 border-[var(--color-text-main)] pb-0.5 max-w-full truncate">
            {sertifikat.nama}
          </div>

          <p className="teks-sertifikat m-0 text-[9px] sm:text-[13px] md:text-[16px] text-[#5a5a5a]">
            telah menyelesaikan
          </p>

          <div className="kelas-sertifikat font-space font-bold text-[13px] sm:text-[20px] md:text-[28px] lg:text-[34px] text-[var(--color-text-main)] leading-tight">
            Kelas {namaKelas}
          </div>

          <p className="teks-sertifikat m-0 font-medium text-[8px] sm:text-[12px] md:text-[15px] text-[#3d3d3d]">
            di BisaNgoding.com
          </p>
        </div>

        {/* Footer Sertifikat */}
        <div className="pt-1.5 sm:pt-3 border-t-2 border-[var(--color-text-main)] flex flex-wrap items-end justify-between gap-2 text-left">
          <div className="flex flex-col gap-0.5">
            <span className="meta-sertifikat text-[7px] sm:text-[10px] md:text-[12px] text-[#5a5a5a]">
              Tanggal Terbit:
            </span>
            <span className="meta-sertifikat font-space font-bold text-[8px] sm:text-[12px] md:text-[14px]">
              {formatTanggalSertifikat(sertifikat.terbit)}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 text-right max-w-[60%]">
            <span className="meta-sertifikat text-[7px] sm:text-[10px] md:text-[12px] text-[#5a5a5a]">
              Cek Keaslian:
            </span>
            <span className="meta-sertifikat font-mono text-[7px] sm:text-[10px] md:text-[11px] truncate text-[#2447f5]">
              {alamatCek}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LihatSertifikat() {
  const { kode } = useParams();
  const { user } = useAuth();
  const [sertifikat, setSertifikat] = useState<DataSertifikat | null>(null);
  const [loading, setLoading] = useState(true);
  const [tidakDitemukan, setTidakDitemukan] = useState(false);

  useEffect(() => {
    let aktif = true;

    async function ambil() {
      if (!kode || !supabase || !user) {
        setLoading(false);
        setTidakDitemukan(true);
        return;
      }

      setLoading(true);
      setTidakDitemukan(false);

      try {
        const { data, error } = await supabase
          .from('sertifikat')
          .select('kode, user_id, kelas_id, nama, terbit')
          .eq('kode', kode.toUpperCase().trim())
          .maybeSingle();

        if (!aktif) return;

        if (error || !data || data.user_id !== user.id) {
          setTidakDitemukan(true);
          setSertifikat(null);
        } else {
          setSertifikat(data as DataSertifikat);
          setTidakDitemukan(false);
        }
      } catch {
        if (aktif) {
          setTidakDitemukan(true);
          setSertifikat(null);
        }
      } finally {
        if (aktif) setLoading(false);
      }
    }

    ambil();
    return () => {
      aktif = false;
    };
  }, [kode, user]);

  const handleCetak = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-main)]" />
      </div>
    );
  }

  if (tidakDitemukan || !sertifikat) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center flex flex-col items-center gap-5">
        <div className="p-6 border-[3px] border-[var(--color-text-main)] rounded-2xl bg-white shadow-[6px_6px_0_var(--color-text-main)] flex flex-col items-center gap-4 w-full">
          <h2 className="m-0 font-space text-[22px] font-bold">
            Sertifikat Tidak Ditemukan
          </h2>
          <p className="m-0 text-[15px] text-[#5a5a5a]">
            Sertifikat dengan kode ini tidak ditemukan atau bukan milik akunmu.
          </p>
          <Link
            to="/sertifikat"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-[var(--color-text-main)] border-[3px] border-[var(--color-text-main)] rounded-xl font-space font-bold text-[15px] shadow-[3px_3px_0_var(--color-text-main)] hover:translate-y-[-1px] no-underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Sertifikat
          </Link>
        </div>
      </div>
    );
  }

  const course = coursesData.find((c) => c.id === sertifikat.kelas_id);
  const rawName = course?.namaPendek ?? course?.title ?? sertifikat.kelas_id;
  const namaKelas = rawName.replace(/^Kelas\s+/, '');

  return (
    <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-6 lg:py-10 flex flex-col items-center gap-6">
      {/* Bar atas tombol unduh & kembali (sembunyi saat cetak) */}
      <div className="sembunyi-cetak w-full max-w-[960px] flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/sertifikat"
          className="inline-flex items-center gap-2 px-4 py-2 border-[2px] border-[var(--color-text-main)] rounded-xl bg-white font-space font-bold text-[14px] shadow-[2px_2px_0_var(--color-text-main)] hover:translate-y-[-1px] no-underline text-[var(--color-text-main)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Daftar Sertifikat
        </Link>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4">
          <span className="text-[13px] text-[#5a5a5a]">
            Pilih Simpan sebagai PDF di jendela cetak.
          </span>
          <button
            type="button"
            onClick={handleCetak}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-[var(--color-text-main)] border-[3px] border-[var(--color-text-main)] rounded-xl font-space font-bold text-[15px] shadow-[3px_3px_0_var(--color-text-main)] hover:translate-y-[-1px] active:translate-y-[1px]"
          >
            <Printer className="w-4 h-4" />
            UNDUH PDF
          </button>
        </div>
      </div>

      {/* Kartu Sertifikat */}
      <KartuSertifikat sertifikat={sertifikat} namaKelas={namaKelas} />

      {/* Teks bantuan di bawah tombol (sembunyi saat cetak) */}
      <div className="sembunyi-cetak text-center text-[13px] text-[#6b675e]">
        Sertifikat ini sah dan dapat diverifikasi kapan saja melalui kode verifikasi yang tertera.
      </div>
    </div>
  );
}
