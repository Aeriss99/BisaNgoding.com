import { coursesData } from '../lib/content';
import { jumlahModulTersedia, statusKartu } from '../lib/jalur';
import { BarisStatus, BungkusKartu, Lencana, WARNA_KELAS, warnaKelas } from '../components/kelas/KartuKelas';
import type { Course } from '../types/schema';

// Diekspor ulang supaya impor lama (halaman kelas) tetap jalan.
export { WARNA_KELAS, Lencana };
export const jumlahModulSiap = jumlahModulTersedia;

/** Pengelompokan kelas per bidang (urutan tampil). Kelas yang tidak disebut masuk "Lainnya". */
export const BIDANG: { judul: string; sub: string; warna: string; kelas: string[] }[] = [
  { judul: 'Fondasi', sub: 'Dipakai di semua jalur', warna: 'var(--color-landing-magenta)', kelas: ['git', 'english-it', 'linux'] },
  { judul: 'Bahasa pemrograman', sub: 'Pilih satu untuk mulai', warna: 'var(--color-primary)', kelas: ['java', 'javascript', 'typescript'] },
  { judul: 'Web frontend', sub: 'Tampilan website', warna: 'var(--color-landing-cyan)', kelas: ['html-css', 'tailwind', 'react'] },
  { judul: 'Backend dan database', sub: 'Server, API, dan data', warna: 'var(--color-primary)', kelas: ['mysql', 'spring-boot', 'nodejs'] },
  { judul: 'DevOps dan cloud', sub: 'Server, otomatisasi, cloud', warna: 'var(--color-landing-purple)', kelas: ['devops'] },
];

function KartuKelas({ c }: { c: Course }) {
  const st = statusKartu({ kelas: c.id });
  const ada = st.jenis === 'tersedia' || st.jenis === 'sebagian';
  const gaya = ada
    ? 'border-solid border-[var(--color-text-main)] bg-white shadow-[4px_4px_0_var(--color-text-main)]'
    : 'border-dashed border-[var(--color-soon-border)] bg-[var(--color-soon)]';
  return (
    <BungkusKartu url={st.url} className={`box-border p-5 border-[3px] rounded-xl flex flex-col gap-2.5 ${gaya}`}>
      <div className="flex items-center gap-3">
        <Lencana kode={st.kode} warna={warnaKelas(c.id)} redup={!ada} />
        <div className="font-space text-[20px] font-bold">{st.nama}</div>
      </div>
      <div className="text-[15px] leading-[22px] text-[#3d3d3d]">{c.ringkas || c.description}</div>
      <BarisStatus status={st} />
    </BungkusKartu>
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
    <div className="leading-[normal] max-w-[1440px] mx-auto px-4 md:px-8 xl:px-16 py-8 lg:py-16 flex flex-col gap-10 lg:gap-11">
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 font-space text-[36px] leading-10 lg:text-[56px] lg:leading-[60px] font-bold">Semua kelas</h1>
        <p className="m-0 text-[16px] leading-6 lg:text-[18px] lg:leading-7 text-[#3d3d3d]">
          Dikelompokkan menurut bidang. Satu kelas bisa dipakai di beberapa jalur karier.
        </p>
      </div>
      {grup.map((g) => (
        <section key={g.judul} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 pb-2.5 border-b-[3px] border-[var(--color-text-main)]">
            <div className="w-3.5 h-3.5 border-2 border-[var(--color-text-main)] self-center" style={{ background: g.warna }} />
            <h2 className="m-0 font-space text-[24px] lg:text-[28px] font-bold">{g.judul}</h2>
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
