import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { daftarAktif, type ItemLatihanAktif } from '../lib/latihanUlang';
import { acakOpsi } from '../lib/quizLogic';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { ekstensiBahasa } from '../lib/editorBahasa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';

export default function LatihanUlang() {
  const { progress, catatJawabanLatihan } = useProgress();

  // Daftar soal untuk putaran saat ini
  const [antrean, setAntrean] = useState<ItemLatihanAktif[]>(() => daftarAktif(progress));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [terjawab, setTerjawab] = useState(false);
  const [sudahMenjawab, setSudahMenjawab] = useState(false);
  const [ringkasanSelesai, setRingkasanSelesai] = useState<{
    selesai: number;
    ulang: number;
  } | null>(null);

  useEffect(() => {
    if (antrean.length === 0 && !sudahMenjawab && !ringkasanSelesai) {
      const aktif = daftarAktif(progress);
      if (aktif.length > 0) {
        setAntrean(aktif);
      }
    }
  }, [progress, antrean.length, sudahMenjawab, ringkasanSelesai]);

  const itemAktif = antrean[currentIdx];

  // Acak pilihan jawaban saat soal berganti
  const soalAcak = useMemo(() => {
    if (!itemAktif) return null;
    return acakOpsi(itemAktif.soal);
  }, [itemAktif]);

  const handlePilih = (idx: number) => {
    if (terjawab || !itemAktif || !soalAcak) return;
    setSudahMenjawab(true);
    setSelected(idx);
    setTerjawab(true);
    const benar = idx === soalAcak.answer;
    catatJawabanLatihan(itemAktif.kunci, benar);
  };

  const handleLanjut = () => {
    if (currentIdx < antrean.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelected(null);
      setTerjawab(false);
    } else {
      // Putaran selesai: hitung berapa yang selesai dan berapa yang masih perlu diulang
      // dari status terbaru di progress
      const kunciPutaran = new Set(antrean.map((a) => a.kunci));
      let selesaiCount = 0;
      let ulangCount = 0;

      for (const kunci of kunciPutaran) {
        const entri = progress.latihanUlang?.[kunci];
        if (entri?.selesai) {
          selesaiCount++;
        } else {
          ulangCount++;
        }
      }

      setRingkasanSelesai({ selesai: selesaiCount, ulang: ulangCount });
    }
  };

  const handleUlangiPutaran = () => {
    const aktifBaru = daftarAktif(progress);
    setAntrean(aktifBaru);
    setCurrentIdx(0);
    setSelected(null);
    setTerjawab(false);
    setSudahMenjawab(false);
    setRingkasanSelesai(null);
  };

  return (
    <div className="leading-[normal] max-w-[1000px] mx-auto px-4 md:px-8 py-8 lg:py-14 flex flex-col gap-6 lg:gap-8">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-space text-[32px] leading-9 lg:text-[48px] lg:leading-[52px] font-bold">
          Latihan Ulang
        </h1>
        <p className="m-0 text-[15px] leading-6 lg:text-[17px] text-[#3d3d3d]">
          Soal yang pernah kamu jawab salah. Jawab benar 2 kali berturut-turut supaya soal selesai.
        </p>
      </div>

      {/* Tampilan Ringkasan Setelah Satu Putaran */}
      {ringkasanSelesai ? (
        <div className="box-border p-6 lg:p-8 border-[3px] border-[var(--color-text-main)] rounded-2xl bg-white shadow-[6px_6px_0_var(--color-text-main)] flex flex-col items-center text-center gap-6">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary-light)] border-[3px] border-[var(--color-text-main)] flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[var(--color-text-main)]" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="m-0 font-space text-[24px] lg:text-[28px] font-bold">
              Putaran Selesai!
            </h2>
            <p className="m-0 font-space text-[18px] lg:text-[20px] font-bold text-[#3d3d3d]">
              {ringkasanSelesai.selesai} soal selesai, {ringkasanSelesai.ulang} soal masih perlu diulang
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {ringkasanSelesai.ulang > 0 && (
              <button
                type="button"
                onClick={handleUlangiPutaran}
                className="px-6 py-3 bg-[var(--color-primary)] border-[3px] border-[var(--color-text-main)] rounded-xl font-space font-bold text-[16px] shadow-[3px_3px_0_var(--color-text-main)] hover:translate-y-[-1px] active:translate-y-[1px] flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                ULANGI
              </button>
            )}
            <Link
              to="/progres"
              className="px-6 py-3 bg-white border-[3px] border-[var(--color-text-main)] rounded-xl font-space font-bold text-[16px] shadow-[3px_3px_0_var(--color-text-main)] hover:translate-y-[-1px] active:translate-y-[1px] no-underline text-[var(--color-text-main)]"
            >
              Kembali ke Progres
            </Link>
          </div>
        </div>
      ) : antrean.length === 0 ? (
        /* State Kosong */
        <div className="box-border p-8 border-[3px] border-[var(--color-text-main)] rounded-2xl bg-white shadow-[6px_6px_0_var(--color-text-main)] flex flex-col items-center text-center gap-5">
          <p className="m-0 text-[16px] lg:text-[18px] text-[#5a5a5a] max-w-md">
            Belum ada soal untuk diulang. Soal cek pemahaman dan quiz yang dijawab salah akan muncul di sini.
          </p>
          <Link
            to="/kelas"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] border-[3px] border-[var(--color-text-main)] rounded-xl font-space font-bold text-[16px] shadow-[3px_3px_0_var(--color-text-main)] hover:translate-y-[-1px] no-underline text-[var(--color-text-main)]"
          >
            Lanjut belajar
          </Link>
        </div>
      ) : soalAcak && itemAktif ? (
        /* Layar Soal */
        <div className="box-border p-5 lg:p-8 border-[3px] border-[var(--color-text-main)] rounded-2xl bg-white shadow-[6px_6px_0_var(--color-text-main)] flex flex-col gap-6">
          {/* Header Soal: Asal & Penanda Benar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-[#e8e4da]">
            <div className="flex items-center gap-2 text-[14px] text-[#5a5a5a]">
              <span className="font-space font-bold text-[var(--color-text-main)]">
                {itemAktif.soal.namaKelas}
              </span>
              <span>·</span>
              <span className="truncate max-w-[260px] sm:max-w-none">
                {itemAktif.soal.asalJudul}
              </span>
            </div>

            {/* Penanda Benar */}
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-mono text-[#5a5a5a]">
                Soal {currentIdx + 1} dari {antrean.length}
              </span>
              {terjawab ? (
                selected === soalAcak.answer ? (
                  itemAktif.entri.benar + 1 >= 2 ? (
                    <span className="px-2.5 py-1 bg-[var(--color-success-light)] border-2 border-[var(--color-success)] text-[var(--color-success)] rounded-lg font-space font-bold text-[13px]">
                      Selesai ✓
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-[var(--color-primary-light)] border-2 border-[var(--color-text-main)] rounded-lg font-space font-bold text-[13px]">
                      Benar {itemAktif.entri.benar + 1} dari 2
                    </span>
                  )
                ) : (
                  <span className="px-2.5 py-1 bg-[var(--color-danger-light)] border-2 border-[var(--color-danger)] text-[var(--color-danger)] rounded-lg font-space font-bold text-[13px]">
                    Benar 0 dari 2
                  </span>
                )
              ) : (
                <span className="px-2.5 py-1 bg-[var(--color-bg-base)] border-2 border-[var(--color-text-main)] rounded-lg font-space font-bold text-[13px]">
                  Benar {itemAktif.entri.benar} dari 2
                </span>
              )}
            </div>
          </div>

          {/* Teks Soal */}
          <h2 className="m-0 font-space font-bold text-[19px] lg:text-[23px] leading-snug">
            {soalAcak.question}
          </h2>

          {/* Kode jika ada */}
          {soalAcak.code && (
            <div className="border-2 border-[var(--color-text-main)] rounded-xl overflow-hidden">
              <CodeMirror
                value={soalAcak.code}
                extensions={[
                  ...ekstensiBahasa(itemAktif.soal.bahasa || 'java'),
                  EditorView.lineWrapping,
                ]}
                theme="light"
                readOnly={true}
                basicSetup={{ lineNumbers: true }}
              />
            </div>
          )}

          {/* Pilihan Jawaban */}
          <div className="flex flex-col gap-3">
            {soalAcak.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrectOption = i === soalAcak.answer;

              let kelasTombol =
                'border-[2px] border-[var(--color-text-main)] bg-white hover:bg-[var(--color-bg-base)] shadow-[2px_2px_0_var(--color-text-main)]';

              if (terjawab) {
                if (isCorrectOption) {
                  kelasTombol =
                    'border-[3px] border-[var(--color-success)] bg-[var(--color-success-light)] font-bold shadow-[2px_2px_0_var(--color-success)]';
                } else if (isSelected) {
                  kelasTombol =
                    'border-[3px] border-[var(--color-danger)] bg-[var(--color-danger-light)] opacity-75 shadow-[2px_2px_0_var(--color-danger)]';
                } else {
                  kelasTombol =
                    'border-2 border-[#d9d3c6] bg-white opacity-40 shadow-none';
                }
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled={terjawab}
                  onClick={() => handlePilih(i)}
                  className={`w-full text-left p-4 rounded-xl transition-transform font-sans font-medium text-[15px] lg:text-[16px] whitespace-pre-wrap [overflow-wrap:anywhere] active:translate-y-[1px] disabled:cursor-default ${kelasTombol}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Penjelasan dan Hasil */}
          {terjawab && (
            <div
              role="status"
              className="mt-2 flex flex-col gap-4 p-5 rounded-xl border-[3px] border-[var(--color-text-main)] bg-white shadow-[4px_4px_0_var(--color-text-main)]"
            >
              <div className="flex items-center gap-2.5">
                {selected === soalAcak.answer ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-[var(--color-success)]" />
                    <span className="font-space font-bold text-[18px] text-[var(--color-success)]">
                      Benar!
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-[var(--color-danger)]" />
                    <span className="font-space font-bold text-[18px] text-[var(--color-danger)]">
                      Jawaban belum tepat
                    </span>
                  </>
                )}
              </div>

              {soalAcak.explanation && (
                <div className="text-[14px] lg:text-[15px] leading-relaxed text-[#3d3d3d]">
                  {soalAcak.explanation}
                </div>
              )}

              {soalAcak.remedial && selected !== soalAcak.answer && (
                <div className="p-3.5 border-2 border-[var(--color-text-main)] rounded-lg bg-[var(--color-primary-light)] text-[14px] leading-relaxed prose prose-sm prose-black max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {soalAcak.remedial}
                  </ReactMarkdown>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleLanjut}
                  className="px-6 py-3 bg-[var(--color-primary)] border-[3px] border-[var(--color-text-main)] rounded-xl font-space font-bold text-[16px] shadow-[3px_3px_0_var(--color-text-main)] hover:translate-y-[-1px] active:translate-y-[1px] flex items-center gap-2"
                >
                  LANJUT <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
