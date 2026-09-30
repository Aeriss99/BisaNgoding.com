import { Link } from 'react-router-dom';
import { Check, Clock } from 'lucide-react';
import { coursesData, modulesData, getVisibleLessons } from '../lib/content';
import type { Course } from '../types/schema';

/** Pengelompokan kelas per bidang (urutan tampil). Kelas yang tidak disebut masuk "Lainnya". */
export const BIDANG: { judul: string; sub: string; warna: string; kelas: string[] }[] = [
  { judul: 'Fondasi', sub: 'Dipakai di semua jalur', warna: 'var(--color-landing-magenta)', kelas: ['git', 'english-it', 'linux'] },
  { judul: 'Bahasa pemrograman', sub: 'Pilih satu untuk mulai', warna: 'var(--color-primary)', kelas: ['java', 'javascript', 'typescript'] },
  { judul: 'Web frontend', sub: 'Tampilan website', warna: 'var(--color-landing-cyan)', kelas: ['html-css', 'tailwind', 'react'] },
  { judul: 'Backend dan database', sub: 'Server, API, dan data', warna: 'var(--color-primary)', kelas: ['mysql', 'spring-boot', 'nodejs'] },
  { judul: 'DevOps dan cloud', sub: 'Server, otomatisasi, cloud', warna: 'var(--color-landing-purple)', kelas: ['devops'] },
];

/** Warna lencana kode kelas. */
export const WARNA_KELAS: Record<string, string> = {
  java: 'var(--color-primary)',
  javascript: 'var(--color-primary)',
  'spring-boot': 'var(--color-primary)',
  nodejs: 'var(--color-primary)',
  mysql: 'var(--color-landing-cyan)',
  'html-css': 'var(--color-landing-cyan)',
  tailwind: 'var(--color-landing-cyan)',
  react: 'var(--color-landing-cyan)',
  typescript: 'var(--color-landing-cyan)',
  linux: 'var(--color-landing-purple)',
  devops: 'var(--color-landing-purple)',
  git: 'var(--color-landing-magenta)',
  'english-it': 'var(--color-landing-magenta)',
};

export function jumlahModulSiap(courseId: string): number {
  return modulesData.filter(
    (m) => (m.courseId || 'java') === courseId && m.status !== 'draft' && getVisibleLessons(m.id).length > 0
  ).length;
}

export function Lencana({ kode, warna, redup = false, ukuran = 44 }: { kode: string; warna: string; redup?: boolean; ukuran?: number }) {
  return (
    <div
      style={{ width: ukuran, height: ukuran, background: redup ? '#dcd7cc' : warna, fontSize: kode.length <= 2 ? Math.round(ukuran * 0.34) : Math.round(ukuran * 0.27) }}
      className="shrink-0 box-border border-2 border-[var(--color-text-main)] rounded-lg flex items-center justify-center font-bungee"
    >
      {kode}
    </div>
  );
}

function KartuKelas({ c }: { c: Course }) {
  const jumlah = jumlahModulSiap(c.id);
  const ada = c.status !== 'soon' && jumlah > 0;
  const isi = (
    <>
      <div className="flex items-center gap-3">
        <Lencana kode={c.short || c.title.charAt(0)} warna={WARNA_KELAS[c.id] || 'var(--color-primary)'} redup={!ada} />
        <div className="font-space text-xl font-bold">{c.title.replace(/^Kelas /, '')}</div>
      </div>
      <div className="text-[15px] leading-[22px] text-[#3d3d3d]">{c.ringkas || c.description}</div>
      {ada ? (
        <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-[var(--color-success)]">
          <Check className="w-4 h-4" strokeWidth={3} />
          <span>Tersedia · {jumlah} modul</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-[#5a5a5a]">
          <Clock className="w-4 h-4" strokeWidth={2.5} />
          <span>Segera hadir</span>
        </div>
      )}
    </>
  );
  if (!ada) {
    return (
      <div className="box-border p-5 border-[3px] border-dashed border-[var(--color-soon-border)] rounded-xl bg-[var(--color-soon)] flex flex-col gap-2.5">
        {isi}
      </div>
    );
  }
  return (
    <Link
      to={`/kelas/${c.id}`}
      className="box-border p-5 border-[3px] border-[var(--color-text-main)] rounded-xl bg-white shadow-[4px_4px_0_var(--color-text-main)] flex flex-col gap-2.5 no-underline text-[var(--color-text-main)] hover:-translate-y-0.5 transition-transform"
    >
      {isi}
    </Link>
  );
}

export default function SemuaKelas() {
  const dipakai = new Set(BIDANG.flatMap((b) => b.kelas));
  const lainnya = coursesData.filter((c) => !dipakai.has(c.id));
  const grup = [
    ...BIDANG.map((b) => ({ ...b, daftar: b.kelas.map((id) => coursesData.find((c) => c.id === id)).filter((c): c is Course => !!c) })),
    ...(lainnya.length ? [{ judul: 'Lainnya', sub: '', warna: 'var(--color-bg-card)', kelas: [], daftar: lainnya }] : []),
  ].filter((g) => g.daftar.length > 0);

  return (
    <div className="max-w-[1312px] mx-auto px-4 md:px-8 lg:px-16 py-8 lg:py-16 flex flex-col gap-10 lg:gap-11">
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 font-space text-4xl lg:text-[56px] lg:leading-[60px] font-bold">Semua kelas</h1>
        <p className="m-0 text-base lg:text-lg leading-7 text-[#3d3d3d]">
          Dikelompokkan menurut bidang. Satu kelas bisa dipakai di beberapa jalur karier.
        </p>
      </div>
      {grup.map((g) => (
        <section key={g.judul} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 pb-2.5 border-b-[3px] border-[var(--color-text-main)]">
            <div className="w-3.5 h-3.5 border-2 border-[var(--color-text-main)] self-center" style={{ background: g.warna }} />
            <h2 className="m-0 font-space text-2xl lg:text-[28px] font-bold">{g.judul}</h2>
            {g.sub && <span className="text-[15px] text-[#5a5a5a]">{g.sub}</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {g.daftar.map((c) => (
              <KartuKelas key={c.id} c={c} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
