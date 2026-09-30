import { Navigate, useParams } from 'react-router-dom';
import CourseDetail from './CourseDetail';
import { coursesData } from '../lib/content';
import { pemakaianKelas } from '../lib/jalur';
import { Lencana, warnaKelas } from '../components/kelas/KartuKelas';
import type { Course } from '../types/schema';

/** Halaman rencana kelas baru (belum ada materi): daftar modul yang akan dibuat. */
export function RencanaKelas({ course }: { course: Course }) {
  const bagian = course.rencana ?? [];
  const jumlah = bagian.reduce((t, b) => t + b.modul.length, 0);
  const chips = [`${jumlah} modul`, ...(course.infoRencana ?? [])];
  const warna = warnaKelas(course.id);
  const jalur = pemakaianKelas(course.id);
  let no = 0;

  return (
    <div className="leading-[normal] max-w-[1440px] mx-auto px-4 md:px-8 xl:px-16 py-8 lg:py-16 flex flex-col lg:flex-row gap-10 lg:gap-14 lg:items-start">
      <div className="w-full lg:flex-1 lg:max-w-[880px] min-w-0 flex flex-col gap-8 lg:gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="hidden lg:block">
              <Lencana kode={course.short ?? ''} warna={warna} ukuran={72} />
            </div>
            <div className="lg:hidden">
              <Lencana kode={course.short ?? ''} warna={warna} ukuran={52} />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="self-start px-2.5 py-[3px] bg-[var(--color-text-main)] text-white font-mono text-[12px] font-bold rounded-md">
                KELAS BARU · SEGERA
              </div>
              <h1 className="m-0 font-space font-bold text-[30px] leading-[34px] lg:text-[52px] lg:leading-[56px]">
                {course.title.replace(/^Kelas /, '')}
              </h1>
            </div>
          </div>
          <p className="m-0 text-[16px] leading-[26px] lg:text-[18px] lg:leading-7 text-[#3d3d3d]">{course.description}</p>
          <div className="flex flex-wrap gap-2.5">
            {chips.map((c) => (
              <div key={c} className="px-3.5 py-2 border-2 border-[var(--color-text-main)] rounded-lg bg-white font-mono text-[13px] lg:text-[14px] font-bold">
                {c}
              </div>
            ))}
          </div>
        </div>

        {bagian.map((b) => (
          <section key={b.judul} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1 pb-2.5 border-b-[3px] border-[var(--color-text-main)]">
              <h2 className="m-0 font-space text-[24px] lg:text-[28px] font-bold">{b.judul}</h2>
              <span className="text-[15px] text-[#5a5a5a]">{b.sub}</span>
            </div>
            {b.modul.map((m) => {
              no += 1;
              return (
                <div
                  key={m.judul}
                  className="flex items-center gap-3 lg:gap-[18px] p-3 lg:px-5 lg:py-4 border-[3px] border-dashed border-[var(--color-soon-border)] rounded-xl bg-white"
                >
                  <div className="w-10 h-10 lg:w-[52px] lg:h-[52px] shrink-0 box-border border-2 border-[var(--color-text-main)] rounded-[10px] bg-[var(--color-soon)] flex items-center justify-center font-space text-[18px] lg:text-[22px] font-bold">
                    {no}
                  </div>
                  <div className="flex flex-col gap-1 grow min-w-0">
                    <div className="font-space text-[17px] lg:text-[20px] font-bold">{m.judul}</div>
                    <div className="text-[14px] leading-5 lg:text-[15px] lg:leading-[22px] text-[#3d3d3d]">{m.isi}</div>
                  </div>
                  <div className="hidden sm:block shrink-0 px-2.5 py-1 border-2 border-[var(--color-text-main)] rounded-md bg-[var(--color-purple-light)] font-mono text-[12px] font-bold">
                    RENCANA
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>

      <aside className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-5">
        {jalur.length > 0 && (
          <div
            style={{ background: warna }}
            className="p-[22px] border-[3px] border-[var(--color-text-main)] rounded-[14px] shadow-[6px_6px_0_var(--color-text-main)] flex flex-col gap-2.5"
          >
            <div className="font-mono text-[13px] font-bold tracking-[1px]">DIPAKAI DI JALUR</div>
            {jalur.map((j) => (
              <div
                key={j.judul}
                className="flex justify-between gap-3 px-3 py-2.5 bg-white border-2 border-[var(--color-text-main)] rounded-lg text-[15px]"
              >
                <b>{j.judul}</b>
                <span className="text-right">{j.keterangan}</span>
              </div>
            ))}
          </div>
        )}
        <div className="p-[22px] border-2 border-[var(--color-text-main)] rounded-xl flex flex-col gap-2 text-[15px] leading-[22px]">
          <div className="font-mono text-[13px] font-bold tracking-[1px]">CARA BELAJAR</div>
          <span>
            Teori singkat, contoh perintah beserta hasilnya, lalu latihan soal. Bisa diikuti tanpa memasang apa pun. Kalau punya komputer Linux
            atau WSL, kamu bisa mencoba langsung.
          </span>
        </div>
      </aside>
    </div>
  );
}

/** Rute /kelas/:courseId — kelas yang sudah ada ke halaman kelas, kelas baru ke halaman rencana. */
export default function HalamanKelas() {
  const { courseId } = useParams<{ courseId: string }>();
  const course = coursesData.find((c) => c.id === courseId);
  if (course && course.status === 'soon') {
    if (course.baru && course.rencana?.length) return <RencanaKelas course={course} />;
    return <Navigate to="/kelas" replace />;
  }
  return <CourseDetail />;
}
