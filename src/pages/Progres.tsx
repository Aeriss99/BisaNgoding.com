import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { Ikon } from '../components/ui/IkonDesain';
import { Lencana, warnaKelas } from '../components/kelas/KartuKelas';
import { ringkasanProgres, PASSING_SCORE, type ProgresKelas } from '../lib/progres';

const angka = (n: number) => n.toLocaleString('id-ID');

function KotakAngka({ label, nilai, sub, latar }: { label: string; nilai: string; sub: string; latar: string }) {
  return (
    <div
      style={{ background: latar }}
      className="box-border p-4 lg:p-5 border-[3px] border-[var(--color-text-main)] rounded-xl shadow-[4px_4px_0_var(--color-text-main)] flex flex-col gap-1"
    >
      <div className="font-mono text-[12px] lg:text-[13px] font-bold tracking-[1px]">{label}</div>
      <div className="font-space text-[28px] leading-8 lg:text-[36px] lg:leading-10 font-bold">{nilai}</div>
      <div className="text-[13px] lg:text-[14px] text-[#3d3d3d]">{sub}</div>
    </div>
  );
}

function Bar({ persen, tinggi = 'h-3.5' }: { persen: number; tinggi?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={persen}
      className={`${tinggi} border-2 border-[var(--color-text-main)] rounded-full bg-white overflow-hidden`}
    >
      <div className="h-full bg-[var(--color-text-main)]" style={{ width: `${persen}%` }} />
    </div>
  );
}

function KartuKelas({ k }: { k: ProgresKelas }) {
  const selesai = !k.lanjut && k.totalSelesai > 0 && k.totalSelesai === k.totalMateri;
  const judulTombol = selesai ? 'Kelas selesai' : k.totalSelesai === 0 ? 'Mulai belajar' : 'Lanjutkan belajar';
  const keterangan = selesai ? 'Ulangi dari materi pertama' : k.lanjut?.keterangan ?? 'Buka halaman kelas';
  const tujuan = selesai ? k.materiPertama ?? `/kelas/${k.course.id}` : k.lanjut?.url ?? `/kelas/${k.course.id}`;
  return (
    <div className="box-border p-4 lg:p-5 border-[3px] border-[var(--color-text-main)] rounded-[14px] bg-white shadow-[4px_4px_0_var(--color-text-main)] flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Lencana kode={k.course.short ?? ''} warna={warnaKelas(k.course.id)} />
        <Link to={`/kelas/${k.course.id}`} className="grow min-w-0 font-space text-[18px] lg:text-[20px] font-bold text-[var(--color-text-main)] no-underline hover:underline">
          {k.course.namaPendek ?? k.course.title.replace(/^Kelas /, '')}
        </Link>
        <div className="font-space text-[20px] lg:text-[22px] font-bold shrink-0">{k.persen}%</div>
      </div>
      <Bar persen={k.persen} />
      <div className="font-mono text-[13px] font-bold text-[#3d3d3d]">
        {k.totalSelesai}/{k.totalMateri} materi · {k.modulSelesai}/{k.jumlahModul} modul selesai
      </div>
      <Link
        to={tujuan}
        className="flex items-center justify-between gap-3 px-4 py-3 bg-[var(--color-text-main)] text-white rounded-xl no-underline"
      >
        <span className="flex flex-col gap-0.5 min-w-0">
          <span className="font-space text-[16px] lg:text-[17px] font-bold">{judulTombol}</span>
          <span className="text-[13px] text-[#e8e4da] truncate">{keterangan}</span>
        </span>
        <Ikon nama="arrow" ukuran={22} warna="#ffffff" tebal={2.5} />
      </Link>
    </div>
  );
}

function JudulBagian({ judul, sub }: { judul: string; sub?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pb-2.5 border-b-[3px] border-[var(--color-text-main)]">
      <h2 className="m-0 font-space text-[22px] lg:text-[28px] font-bold">{judul}</h2>
      {sub && <span className="text-[13px] lg:text-[15px] text-[#5a5a5a]">{sub}</span>}
    </div>
  );
}

/** Halaman Progres belajar (dari menu profil): angka utama, progres tiap kelas, dan hasil quiz. */
export default function Progres() {
  const { progress } = useProgress();
  const r = ringkasanProgres(progress);
  const persenTotal = r.totalMateri ? Math.round((r.totalSelesai / r.totalMateri) * 100) : 0;
  const dimulai = r.kelas.filter((k) => k.totalSelesai > 0);
  const belum = r.kelas.filter((k) => k.totalSelesai === 0);

  return (
    <div className="leading-[normal] max-w-[1440px] mx-auto px-4 md:px-8 xl:px-16 py-8 lg:py-16 flex flex-col gap-9 lg:gap-11">
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 font-space text-[36px] leading-10 lg:text-[56px] lg:leading-[60px] font-bold">Progres belajar</h1>
        <p className="m-0 text-[16px] leading-6 lg:text-[18px] lg:leading-7 text-[#3d3d3d]">
          Semua kelas yang sudah kamu mulai, materi yang selesai, dan hasil quiz.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <KotakAngka label="STREAK" nilai={`${r.streak} hari`} sub="Belajar tiap hari menjaga streak" latar="var(--color-streak-bg)" />
        <KotakAngka label="XP" nilai={angka(r.xp)} sub="Dari materi dan latihan" latar="var(--color-primary-light)" />
        <KotakAngka label="MATERI SELESAI" nilai={angka(r.totalSelesai)} sub={`dari ${angka(r.totalMateri)} materi · ${persenTotal}%`} latar="#ffffff" />
        <KotakAngka label="QUIZ LULUS" nilai={angka(r.quizLulus)} sub={`Lulus kalau skor ≥ ${PASSING_SCORE}`} latar="var(--color-success-light)" />
      </div>

      <section className="flex flex-col gap-4">
        <JudulBagian judul="Sedang dipelajari" sub={dimulai.length ? `${dimulai.length} kelas` : undefined} />
        {dimulai.length === 0 ? (
          <div className="p-5 border-2 border-dashed border-[var(--color-soon-border)] rounded-xl bg-[var(--color-soon)] text-[15px] flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>Belum ada materi yang selesai.</span>
            <Link to="/jalur" className="font-space font-bold underline text-[var(--color-text-main)] flex items-center gap-1.5">
              Pilih jalur karier <Ikon nama="arrow" ukuran={16} tebal={2} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
            {dimulai.map((k) => (
              <KartuKelas key={k.course.id} k={k} />
            ))}
          </div>
        )}
      </section>

      {belum.length > 0 && (
        <section className="flex flex-col gap-4">
          <JudulBagian judul="Belum dimulai" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
            {belum.map((k) => (
              <KartuKelas key={k.course.id} k={k} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <JudulBagian judul="Hasil quiz" sub={r.quiz.length ? `${r.quiz.length} quiz dikerjakan` : undefined} />
        {r.quiz.length === 0 ? (
          <div className="text-[15px] text-[#5a5a5a]">Belum ada quiz yang dikerjakan. Quiz terbuka setelah semua materi sebuah modul selesai.</div>
        ) : (
          <div className="border-[3px] border-[var(--color-text-main)] rounded-[14px] bg-white overflow-hidden">
            {r.quiz.map((q, i) => (
              <Link
                key={q.modulId}
                to={`/kelas/${q.kelasId}?modul=${q.modulId}`}
                className={`flex items-center gap-3 px-4 lg:px-5 py-3.5 no-underline text-[var(--color-text-main)] hover:bg-[var(--color-bg-base)] ${i > 0 ? 'border-t border-[#d9d3c6]' : ''}`}
              >
                <span
                  className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center ${q.lulus ? 'bg-[var(--color-success)]' : 'border-2 border-[var(--color-soon-border)] bg-white'}`}
                >
                  {q.lulus && <Ikon nama="check" ukuran={16} warna="#ffffff" tebal={3} />}
                </span>
                <span className="flex flex-col gap-0.5 grow min-w-0">
                  <span className="text-[15px] lg:text-[16px] font-semibold truncate">{q.judul}</span>
                  <span className="text-[13px] text-[#5a5a5a]">{q.kelasJudul}</span>
                </span>
                <span
                  className={`shrink-0 px-2.5 py-1 border-2 rounded-full font-mono text-[12px] font-bold ${
                    q.lulus
                      ? 'border-[var(--color-success)] bg-[var(--color-success-light)] text-[var(--color-success)]'
                      : 'border-[var(--color-danger)] bg-[var(--color-danger-light)] text-[var(--color-danger)]'
                  }`}
                >
                  {q.lulus ? 'LULUS' : 'BELUM'} · {q.skor}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
