import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { coursesData } from '../lib/content';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { apakahModeLokal } from '../lib/modeLokal';
import {
  syaratSertifikat,
  buatKodeSertifikat,
  formatTanggalSertifikat,
  type DataSertifikat,
} from '../lib/sertifikat';
import { useKonfirmasi } from '../components/ui/DialogKonfirmasi';
import { Lencana, warnaKelas } from '../components/kelas/KartuKelas';
import { Ikon } from '../components/ui/IkonDesain';
import { Loader2 } from 'lucide-react';

export default function Sertifikat() {
  const { progress } = useProgress();
  const { user } = useAuth();
  const konfirmasi = useKonfirmasi();

  const [sertifikatList, setSertifikatList] = useState<DataSertifikat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog terbitkan sertifikat
  const [targetKelasId, setTargetKelasId] = useState<string | null>(null);
  const [inputNama, setInputNama] = useState('');
  const [namaError, setNamaError] = useState<string | null>(null);
  const [sedangKirim, setSedangKirim] = useState(false);

  const triggerRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const modeLokal = apakahModeLokal() || !supabase;

  const muatSertifikat = useCallback(async () => {
    if (!supabase || apakahModeLokal()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('sertifikat')
        .select('kode, user_id, kelas_id, nama, terbit');

      if (err) {
        setError('Daftar sertifikat belum bisa dimuat. Periksa koneksi lalu coba lagi.');
      } else {
        setSertifikatList((data as DataSertifikat[]) || []);
      }
    } catch {
      setError('Daftar sertifikat belum bisa dimuat. Periksa koneksi lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    muatSertifikat();
  }, [muatSertifikat]);

  const tutupDialogTerbit = useCallback(() => {
    if (sedangKirim) return;
    setTargetKelasId(null);
    setInputNama('');
    setNamaError(null);
    setTimeout(() => {
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      }
    }, 0);
  }, [sedangKirim]);

  const bukaDialogTerbit = (kelasId: string) => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    const defaultNama =
      (user?.user_metadata?.full_name as string) ||
      (user?.user_metadata?.name as string) ||
      '';
    setInputNama(defaultNama);
    setNamaError(null);
    setTargetKelasId(kelasId);
  };

  useEffect(() => {
    if (targetKelasId) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [targetKelasId]);

  useEffect(() => {
    if (!targetKelasId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!sedangKirim) {
          e.preventDefault();
          tutupDialogTerbit();
        }
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]), button:not([disabled]), [tabindex="0"]'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [targetKelasId, sedangKirim, tutupDialogTerbit]);

  const handleTerbitkan = async () => {
    if (!targetKelasId || modeLokal || !supabase || !user) return;

    const namaDiTrim = inputNama.trim();
    if (namaDiTrim.length < 3 || namaDiTrim.length > 60) {
      setNamaError('Nama harus terdiri dari 3 sampai 60 karakter.');
      return;
    }

    const setuju = await konfirmasi({
      judul: 'Terbitkan Sertifikat',
      pesan: 'Nama tidak bisa diubah setelah sertifikat terbit.',
      teksYa: 'Terbitkan',
      teksBatal: 'Batal',
    });

    if (!setuju) return;

    setSedangKirim(true);
    setNamaError(null);

    try {
      let berhasil = false;
      let bentrokSudahAda = false;

      // Coba maksimal 3 kali jika kode bentrok
      for (let i = 0; i < 3; i++) {
        const kodeBaru = buatKodeSertifikat();
        const { error: errInsert } = await supabase.from('sertifikat').insert({
          kode: kodeBaru,
          user_id: user.id,
          kelas_id: targetKelasId,
          nama: namaDiTrim,
        });

        if (!errInsert) {
          berhasil = true;
          break;
        }

        const teksErr = `${errInsert.message || ''} ${(errInsert as any).details || ''}`;

        // Akun sudah punya sertifikat untuk kelas ini: jangan diulang
        if (teksErr.includes('sertifikat_user_id_kelas_id_key')) {
          bentrokSudahAda = true;
          break;
        }

        // Bentrok kode primary key: coba buat kode baru dan ulang
        if (
          errInsert.code === '23505' &&
          (teksErr.includes('sertifikat_pkey') || teksErr.includes('kode'))
        ) {
          continue;
        }

        // Galat lain: jangan ulang
        break;
      }

      if (berhasil || bentrokSudahAda) {
        tutupDialogTerbit();
        await muatSertifikat();
      } else {
        setNamaError('Sertifikat belum bisa diterbitkan. Periksa koneksi lalu coba lagi.');
      }
    } catch {
      setNamaError('Sertifikat belum bisa diterbitkan. Periksa koneksi lalu coba lagi.');
    } finally {
      setSedangKirim(false);
    }
  };

  // Daftar kelas yang siap, urut courses.json
  const kelasSiap = coursesData
    .filter((c) => c.status !== 'soon')
    .sort((a, b) => a.order - b.order);

  const targetCourse = targetKelasId
    ? coursesData.find((c) => c.id === targetKelasId)
    : null;
  const targetNamaKelas = targetCourse
    ? (targetCourse.namaPendek ?? targetCourse.title).replace(/^Kelas\s+/, '')
    : '';

  return (
    <div className="leading-[normal] max-w-[1440px] mx-auto px-4 md:px-8 xl:px-16 py-8 lg:py-16 flex flex-col gap-8">
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 font-space text-[36px] leading-10 lg:text-[56px] lg:leading-[60px] font-bold">
          Sertifikat
        </h1>
        <p className="m-0 text-[16px] leading-6 lg:text-[18px] lg:leading-7 text-[#3d3d3d]">
          Selesaikan seluruh materi dan quiz di suatu kelas untuk memperoleh sertifikat kelulusan.
        </p>
      </div>

      {modeLokal && (
        <div className="p-4 border-[3px] border-[var(--color-text-main)] rounded-xl bg-[var(--color-primary-light)] shadow-[4px_4px_0_var(--color-text-main)] font-semibold text-[15px] flex items-center gap-3">
          <Ikon nama="award" ukuran={24} />
          <span>Sertifikat hanya bisa diterbitkan di situs bisangoding.com.</span>
        </div>
      )}

      {loading && !modeLokal ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-main)]" />
        </div>
      ) : error ? (
        <div className="p-6 border-[3px] border-[var(--color-text-main)] rounded-xl bg-[var(--color-danger-light)] shadow-[4px_4px_0_var(--color-text-main)] flex flex-col items-start gap-4">
          <p className="m-0 font-bold text-[16px] text-[var(--color-danger)]">{error}</p>
          <button
            type="button"
            onClick={muatSertifikat}
            className="px-5 py-2.5 border-[3px] border-[var(--color-text-main)] rounded-xl bg-white font-space font-bold text-[15px] shadow-[3px_3px_0_var(--color-text-main)] hover:translate-y-[-1px] active:translate-y-[1px]"
          >
            COBA LAGI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {kelasSiap.map((c) => {
            const syarat = syaratSertifikat(c.id, progress);
            const sertifikat = sertifikatList.find((s) => s.kelas_id === c.id);
            const namaKelas = syarat?.namaKelas ?? (c.namaPendek ?? c.title).replace(/^Kelas\s+/, '');

            return (
              <div
                key={c.id}
                className="box-border p-5 border-[3px] border-[var(--color-text-main)] rounded-xl bg-white shadow-[4px_4px_0_var(--color-text-main)] flex flex-col gap-4 justify-between"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Lencana kode={c.short ?? ''} warna={warnaKelas(c.id)} />
                    <div className="font-space text-[20px] font-bold min-w-0 truncate">
                      {namaKelas}
                    </div>
                  </div>

                  {sertifikat ? (
                    /* Sudah terbit */
                    <div className="flex flex-col gap-2 pt-2 border-t-2 border-[#e8e4da]">
                      <div className="text-[14px] text-[#5a5a5a]">
                        Diterbitkan untuk:{' '}
                        <span className="font-bold text-[var(--color-text-main)]">
                          {sertifikat.nama}
                        </span>
                      </div>
                      <div className="text-[13px] text-[#5a5a5a]">
                        Tanggal:{' '}
                        <span className="font-mono font-bold text-[var(--color-text-main)]">
                          {formatTanggalSertifikat(sertifikat.terbit)}
                        </span>
                      </div>
                      <div className="text-[13px] text-[#5a5a5a]">
                        Kode:{' '}
                        <span className="font-mono font-bold text-[var(--color-text-main)]">
                          {sertifikat.kode}
                        </span>
                      </div>
                    </div>
                  ) : syarat?.lulus ? (
                    /* Lulus, belum terbit */
                    <div className="flex flex-col gap-2 pt-2 border-t-2 border-[#e8e4da]">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--color-success-light)] border border-[var(--color-success)] text-[var(--color-success)] text-[13px] font-bold self-start">
                        <Ikon nama="check" ukuran={16} />
                        Lulus semua modul & quiz
                      </div>
                      <p className="m-0 text-[14px] text-[#5a5a5a]">
                        Kamu sudah menyelesaikan kelas ini dan berhak memperoleh sertifikat.
                      </p>
                    </div>
                  ) : (
                    /* Belum lulus */
                    <div className="flex flex-col gap-2.5 pt-2 border-t-2 border-[#e8e4da]">
                      <div className="flex justify-between items-center text-[14px]">
                        <span className="font-space font-bold">{syarat?.persen ?? 0}%</span>
                        <span className="font-mono text-[13px] text-[#5a5a5a]">
                          {syarat?.modulBelum ?? 0} modul lagi
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={syarat?.persen ?? 0}
                        className="h-3 border-2 border-[var(--color-text-main)] rounded-full bg-white overflow-hidden"
                      >
                        <div
                          className="h-full bg-[var(--color-text-main)]"
                          style={{ width: `${syarat?.persen ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Tombol aksi */}
                <div className="pt-2">
                  {sertifikat ? (
                    <Link
                      to={`/sertifikat/${sertifikat.kode}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-primary)] text-[var(--color-text-main)] border-[3px] border-[var(--color-text-main)] rounded-xl font-space font-bold text-[15px] shadow-[3px_3px_0_var(--color-text-main)] hover:translate-y-[-1px] active:translate-y-[1px] no-underline"
                    >
                      LIHAT & UNDUH
                    </Link>
                  ) : syarat?.lulus ? (
                    <button
                      type="button"
                      disabled={modeLokal}
                      onClick={() => bukaDialogTerbit(c.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-primary)] text-[var(--color-text-main)] border-[3px] border-[var(--color-text-main)] rounded-xl font-space font-bold text-[15px] shadow-[3px_3px_0_var(--color-text-main)] hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      TERBITKAN SERTIFIKAT
                    </button>
                  ) : (
                    <Link
                      to={`/kelas/${c.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-[var(--color-text-main)] border-[3px] border-[var(--color-text-main)] rounded-xl font-space font-bold text-[15px] shadow-[3px_3px_0_var(--color-text-main)] hover:translate-y-[-1px] active:translate-y-[1px] no-underline"
                    >
                      LANJUTKAN BELAJAR
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog input nama sebelum konfirmasi */}
      {targetKelasId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-terbit-judul"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div
            ref={dialogRef}
            className="w-full max-w-lg bg-white border-[4px] border-[var(--color-text-main)] rounded-2xl shadow-[8px_8px_0_var(--color-text-main)] p-6 lg:p-8"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleTerbitkan();
              }}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col gap-1.5">
                <h2
                  id="dialog-terbit-judul"
                  className="m-0 font-space text-[22px] lg:text-[26px] font-bold"
                >
                  Terbitkan Sertifikat
                </h2>
                <p className="m-0 text-[14px] lg:text-[15px] text-[#5a5a5a]">
                  Kelas {targetNamaKelas}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="input-nama-sertifikat"
                  className="font-space font-bold text-[15px]"
                >
                  Nama di sertifikat
                </label>
                <input
                  ref={inputRef}
                  id="input-nama-sertifikat"
                  type="text"
                  value={inputNama}
                  onChange={(e) => {
                    setInputNama(e.target.value);
                    setNamaError(null);
                  }}
                  maxLength={60}
                  placeholder="Nama lengkapmu"
                  className="w-full px-4 py-3 border-[3px] border-[var(--color-text-main)] rounded-xl font-sans text-[16px] outline-none focus:bg-[#fffde6]"
                />
                <p className="m-0 text-[13px] text-[#6b675e]">
                  Nama tidak bisa diubah setelah sertifikat terbit.
                </p>
                {namaError && (
                  <p className="m-0 text-[13px] font-bold text-[var(--color-danger)]">
                    {namaError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={tutupDialogTerbit}
                  disabled={sedangKirim}
                  className="px-5 py-2.5 border-[3px] border-[var(--color-text-main)] rounded-xl bg-white font-space font-bold text-[15px] shadow-[3px_3px_0_var(--color-text-main)] hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangKirim}
                  className="px-6 py-2.5 border-[3px] border-[var(--color-text-main)] rounded-xl bg-[var(--color-primary)] font-space font-bold text-[15px] shadow-[3px_3px_0_var(--color-text-main)] hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-50 flex items-center gap-2"
                >
                  {sedangKirim && <Loader2 className="w-4 h-4 animate-spin" />}
                  Terbitkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
