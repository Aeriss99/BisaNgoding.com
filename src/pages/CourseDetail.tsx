import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, Navigate, useSearchParams } from 'react-router-dom';
import MenuAtas from '../components/layout/MenuAtas';
import { Ikon } from '../components/ui/IkonDesain';
import { useProgress } from '../context/ProgressContext';
import { WARNA_KELAS } from './SemuaKelas';
import { ringkasanKelas, jalurKelas, formatDurasi } from '../lib/kelas';
import type { StatusModul } from '../lib/kelas';

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { progress } = useProgress();
  
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  
  const moduleRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const summary = courseId ? ringkasanKelas(courseId, progress) : null;

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!summary) return;
    
    const modId = searchParams.get('modul');
    
    if (modId) {
      const mod = summary.modul.find(m => m.mod.id === modId);
      if (mod && mod.status !== 'terkunci') {
        setOpenModuleId(modId);
        
        // Let React render first
        setTimeout(() => {
          const el = moduleRefs.current[modId];
          if (el) {
            el.scrollIntoView({ block: 'start', behavior: 'smooth' });
          }
        }, 100);
      }
    } else if (isDesktop) {
      const sedang = summary.modul.find(m => m.status === 'sedang');
      if (sedang) {
        setOpenModuleId(sedang.mod.id);
      }
    } else {
      setOpenModuleId(null);
    }
  }, [searchParams, isDesktop]); // Removed summary dependency to prevent infinite loops, assume stable enough on mount

  const toggleModule = (modId: string, status: StatusModul) => {
    if (status === 'terkunci') return;
    if (openModuleId === modId) {
      setOpenModuleId(null);
      setSearchParams(new URLSearchParams(), { replace: true });
    } else {
      setOpenModuleId(modId);
      setSearchParams({ modul: modId }, { replace: true });
      if (!isDesktop) {
        setTimeout(() => {
          const el = moduleRefs.current[modId];
          if (el) {
            el.scrollIntoView({ block: 'start', behavior: 'smooth' });
          }
        }, 100);
      }
    }
  };

  if (!summary) {
    return <Navigate to="/kelas" replace />;
  }

  const { course, modul, totalMateri, totalSelesai, persen, totalMenit, lanjut } = summary;
  const paths = courseId ? jalurKelas(courseId) : [];

  let jenisKelas = 'Praktik di komputer sendiri';
  if (course.language === 'java' || course.language === 'javascript') {
    jenisKelas = 'Latihan jalan di browser';
  } else if (course.language === 'english') {
    jenisKelas = '5 menit sehari';
  }

  const courseColor = WARNA_KELAS[course.id as keyof typeof WARNA_KELAS] || 'var(--color-primary)';

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-main">
      <MenuAtas />
      
      {/* Desktop Wrapper */}
      <div className="hidden lg:flex max-w-[1440px] mx-auto px-8 xl:px-16 pt-10 pb-16 flex-col gap-7 leading-[normal]">
        <Link to="/kelas" className="self-start flex items-center gap-1.5 text-[15px] font-semibold">
          <Ikon nama="back" ukuran={18} tebal={2.5} />
          Semua kelas
        </Link>
        
        <div className="flex gap-14 items-start">
          <div className="flex-1 min-w-0 max-w-[880px] flex flex-col gap-9">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-[18px]">
                <div 
                  className="w-[72px] h-[72px] shrink-0 border-2 rounded-lg flex items-center justify-center font-bungee text-[15px]"
                  style={{ backgroundColor: courseColor }}
                >
                  {course.short}
                </div>
                <h1 className="m-0 font-space font-bold text-[52px] leading-[56px]">{course.title}</h1>
              </div>
              <p className="m-0 text-[18px] leading-7 text-[#3d3d3d]">{course.description}</p>
              <div className="flex flex-wrap gap-2.5">
                <div className="px-3.5 py-2 border-2 rounded-lg bg-white font-mono text-[14px] font-bold">{modul.length} modul</div>
                <div className="px-3.5 py-2 border-2 rounded-lg bg-white font-mono text-[14px] font-bold">{totalMateri} materi</div>
                <div className="px-3.5 py-2 border-2 rounded-lg bg-white font-mono text-[14px] font-bold">{formatDurasi(totalMenit)}</div>
                <div className="px-3.5 py-2 border-2 rounded-lg bg-white font-mono text-[14px] font-bold">{jenisKelas}</div>
              </div>
            </div>

            <section className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between pb-2.5 border-b-[3px]">
                <h2 className="m-0 font-space text-[28px] font-bold">Daftar modul</h2>
                <span className="text-[15px] text-[#5a5a5a]">Klik modul untuk membuka materinya</span>
              </div>
              
              {modul.map((m) => {
                const isExpanded = openModuleId === m.mod.id;
                let subTitle = null;
                if (course.language === 'english') {
                  const isFirstEnD = m.mod.id.startsWith('en-d') && modul.findIndex(mx => mx.mod.id.startsWith('en-d')) === (m.nomor - 1);
                  const isFirstEnU = m.mod.id.startsWith('en-u') && modul.findIndex(mx => mx.mod.id.startsWith('en-u')) === (m.nomor - 1);
                  if (isFirstEnD) subTitle = <h3 className="m-0 mt-2 font-space text-[20px] font-bold">English Dasar</h3>;
                  if (isFirstEnU) subTitle = <h3 className="m-0 mt-2 font-space text-[20px] font-bold">English untuk Dunia IT</h3>;
                }

                return (
                  <React.Fragment key={m.mod.id}>
                    {subTitle}
                    <div 
                      ref={(el) => { moduleRefs.current[m.mod.id] = el; }}
                      className="scroll-mt-[92px]"
                    >
                      <DesktopModuleCard mod={m} isExpanded={isExpanded} onToggle={() => toggleModule(m.mod.id, m.status)} />
                    </div>
                  </React.Fragment>
                );
              })}
            </section>
          </div>
          
          <aside className="w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-[22px] sticky top-[100px]">
            <div className="p-[22px] border-[3px] rounded-[14px] bg-[#ffd93d] shadow-[6px_6px_0_#111111] flex flex-col gap-3.5">
              <div className="font-mono text-[13px] font-bold tracking-[1px]">PROGRES KAMU</div>
              <div className="flex items-baseline gap-2">
                <span className="font-space text-[44px] leading-[44px] font-bold">{persen}%</span>
                <span className="text-[15px]">{totalSelesai} dari {totalMateri} materi</span>
              </div>
              <div className="h-3.5 border-2 rounded-full bg-white overflow-hidden">
                <div className="h-full bg-[#111111]" style={{ width: `${persen}%` }}></div>
              </div>
              
              <Link 
                to={lanjut ? lanjut.url : `/lesson/${modul[0]?.materi[0]?.lesson.id || ''}`}
                className="flex items-center justify-between gap-3 px-[18px] py-4 bg-[#111111] text-white rounded-xl"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="font-space text-[20px] font-bold">
                    {lanjut ? 'Lanjutkan belajar' : 'Kelas selesai'}
                  </div>
                  <div className="text-[14px] leading-5 text-[#e8e4da]">
                    {lanjut ? lanjut.keterangan : 'Ulangi dari materi pertama'}
                  </div>
                </div>
                <Ikon nama="arrow" ukuran={26} warna="#ffffff" tebal={2.5} />
              </Link>
            </div>

            {paths.length > 0 && (
              <div className="p-5 border-2 rounded-xl bg-white flex flex-col gap-2.5">
                <div className="font-mono text-[13px] font-bold tracking-[1px]">DIPAKAI DI JALUR</div>
                {paths.map((p, i) => (
                  <div key={i} className="flex justify-between gap-3 px-3 py-2.5 bg-[#fff3b8] border-2 rounded-lg text-[15px]">
                    <b>{p.judul}</b>
                    <span>{p.keterangan}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="p-5 border-2 rounded-xl flex flex-col gap-2 text-[15px] leading-[22px]">
              <div className="font-mono text-[13px] font-bold tracking-[1px]">CARA BELAJAR</div>
              <div>Buka modul, pilih materi, selesaikan latihannya. Modul berikutnya terbuka setelah semua materi dan quiz modul ini selesai.</div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile & Tablet Wrapper */}
      <div className="lg:hidden px-4 pt-3 pb-[120px] flex flex-col gap-4 leading-[normal]">
        <Link to="/kelas" className="self-start flex items-center gap-1 min-h-[44px] text-[14px] font-semibold">
          <Ikon nama="back" ukuran={18} tebal={2.5} />
          Semua kelas
        </Link>
        
        <div className="flex items-center gap-3">
          <div 
            className="w-[52px] h-[52px] shrink-0 border-2 rounded-lg flex items-center justify-center font-bungee text-[15px]"
            style={{ backgroundColor: courseColor }}
          >
            {course.short}
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="m-0 font-space text-[28px] leading-8 font-bold">{course.title}</h1>
            <div className="font-mono text-[12px] font-bold text-[#5a5a5a]">
              {modul.length} MODUL · {totalMateri} MATERI · {formatDurasi(totalMenit).toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="p-3.5 border-[3px] rounded-xl bg-[#ffd93d] flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[12px] font-bold tracking-[1px]">PROGRES KAMU</span>
            <span className="font-space text-[22px] font-bold">{persen}%</span>
          </div>
          <div className="h-3 border-2 rounded-full bg-white overflow-hidden">
            <div className="h-full bg-[#111111]" style={{ width: `${persen}%` }}></div>
          </div>
          <div className="text-[13px]">{totalSelesai} dari {totalMateri} materi selesai</div>
        </div>

        <div className="flex items-baseline justify-between">
          <h2 className="m-0 font-space text-[20px] font-bold">Daftar modul</h2>
          <span className="text-[13px] text-[#5a5a5a]">Ketuk untuk membuka</span>
        </div>
        
        <div className="flex flex-col gap-2.5">
          {modul.map((m) => {
            const isExpanded = openModuleId === m.mod.id;
            let subTitle = null;
            if (course.language === 'english') {
              const isFirstEnD = m.mod.id.startsWith('en-d') && modul.findIndex(mx => mx.mod.id.startsWith('en-d')) === (m.nomor - 1);
              const isFirstEnU = m.mod.id.startsWith('en-u') && modul.findIndex(mx => mx.mod.id.startsWith('en-u')) === (m.nomor - 1);
              if (isFirstEnD) subTitle = <h3 className="m-0 mt-2 font-space text-[17px] font-bold">English Dasar</h3>;
              if (isFirstEnU) subTitle = <h3 className="m-0 mt-2 font-space text-[17px] font-bold">English untuk Dunia IT</h3>;
            }

            return (
              <React.Fragment key={m.mod.id}>
                {subTitle}
                <div 
                  ref={(el) => { moduleRefs.current[m.mod.id] = el; }}
                  className="scroll-mt-[76px]"
                >
                  <MobileModuleCard mod={m} isExpanded={isExpanded} onToggle={() => toggleModule(m.mod.id, m.status)} />
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
      
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 px-4 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))] bg-bg-base border-t-[3px]">
        <Link 
          to={lanjut ? lanjut.url : `/lesson/${modul[0]?.materi[0]?.lesson.id || ''}`}
          className="flex items-center justify-between gap-2.5 min-h-[56px] px-4 py-2.5 bg-[#111111] text-white rounded-xl"
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="font-space text-[17px] font-bold">
              {lanjut ? 'Lanjutkan belajar' : 'Kelas selesai'}
            </div>
            <div className="text-[13px] text-[#e8e4da] truncate">
              {lanjut ? lanjut.keterangan : 'Ulangi dari materi pertama'}
            </div>
          </div>
          <Ikon nama="arrow" ukuran={24} warna="#ffffff" tebal={2.5} />
        </Link>
      </div>
    </div>
  );
}

function DesktopModuleCard({ mod, isExpanded, onToggle }: { mod: any, isExpanded: boolean, onToggle: () => void }) {
  if (mod.status === 'terkunci') {
    return (
      <div className="flex items-center gap-[18px] px-5 py-4 border-2 border-dashed border-soon-border rounded-[14px] bg-soon text-[#4d4a44]">
        <div className="w-[52px] h-[52px] shrink-0 border-2 border-soon-border rounded-[10px] bg-[#e4dfd4] flex items-center justify-center">
          <Ikon nama="lock" ukuran={22} warna="#6b665c" tebal={2.5} />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="font-space text-[20px] font-bold">{mod.nomor}. {mod.mod.title}</div>
          <div className="text-[14px]">
            {mod.jumlahMateri} materi &middot; {formatDurasi(mod.menit)} &middot; Selesaikan <b dangerouslySetInnerHTML={{__html: mod.syaratJudul || 'modul sebelumnya'}} /> dulu
          </div>
        </div>
        <div className="px-2.5 py-1 border-2 border-soon-border rounded-full bg-[#e4dfd4] text-[#4d4a44] font-mono text-[12px] font-bold">TERKUNCI</div>
      </div>
    );
  }

  if (isExpanded) {
    const isSedang = mod.status === 'sedang';
    const bgClass = isSedang ? 'bg-primary-light' : 'bg-white';
    return (
      <div className="border-[3px] rounded-[14px] bg-white shadow-[6px_6px_0_#111111] overflow-hidden">
        <button 
          type="button" 
          onClick={onToggle}
          aria-expanded="true"
          className={`w-full flex items-center gap-[18px] px-5 py-[18px] border-b-[3px] text-left ${bgClass}`}
        >
          <div className={`w-[52px] h-[52px] shrink-0 border-[3px] rounded-[10px] flex items-center justify-center font-space text-[22px] font-bold ${mod.status === 'selesai' ? 'bg-[#1b7a3e]' : (isSedang ? 'bg-primary' : 'bg-white')}`}>
            {mod.status === 'selesai' ? <Ikon nama="check" ukuran={26} warna="#ffffff" tebal={3} /> : mod.nomor}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="font-space text-[22px] font-bold">{mod.mod.title}</div>
              {mod.status === 'selesai' && <div className="px-2.5 py-1 border-2 border-[#1b7a3e] rounded-full bg-[#dff3e6] text-[#1b7a3e] font-mono text-[12px] font-bold">SELESAI</div>}
              {isSedang && <div className="px-2.5 py-1 border-2 rounded-full bg-primary font-mono text-[12px] font-bold">{mod.jumlahSelesai > 0 ? 'SEDANG' : 'MULAI'}</div>}
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-[260px] h-2.5 border-2 rounded-full bg-white overflow-hidden">
                <div className="h-full bg-[#111111]" style={{ width: `${(mod.jumlahSelesai / mod.jumlahMateri) * 100}%` }}></div>
              </div>
              <div className="font-mono text-[13px] font-bold">
                {mod.jumlahSelesai}/{mod.jumlahMateri} materi &middot; {formatDurasi(mod.menit)}
              </div>
            </div>
          </div>
          <Ikon nama="down" ukuran={24} tebal={3} />
        </button>
        <div className="flex flex-col">
          {mod.materi.map((mat: any) => <DesktopMateriRow key={mat.lesson.id} mat={mat} />)}
          <DesktopQuizRow mod={mod} />
        </div>
      </div>
    );
  }

  // Not expanded, not terkunci -> A or C
  if (mod.status === 'sedang') {
    // C. Modul sedang yang ditutup
    return (
      <div className="border-[3px] rounded-[14px] bg-white shadow-[6px_6px_0_#111111] overflow-hidden">
        <button 
          type="button" 
          onClick={onToggle}
          aria-expanded="false"
          className="w-full flex items-center gap-[18px] px-5 py-[18px] text-left bg-primary-light"
        >
          <div className="w-[52px] h-[52px] shrink-0 border-[3px] rounded-[10px] flex items-center justify-center font-space text-[22px] font-bold bg-primary">
            {mod.nomor}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="font-space text-[22px] font-bold">{mod.mod.title}</div>
              <div className="px-2.5 py-1 border-2 rounded-full bg-primary font-mono text-[12px] font-bold">{mod.jumlahSelesai > 0 ? 'SEDANG' : 'MULAI'}</div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-[260px] h-2.5 border-2 rounded-full bg-white overflow-hidden">
                <div className="h-full bg-[#111111]" style={{ width: `${(mod.jumlahSelesai / mod.jumlahMateri) * 100}%` }}></div>
              </div>
              <div className="font-mono text-[13px] font-bold">
                {mod.jumlahSelesai}/{mod.jumlahMateri} materi &middot; {formatDurasi(mod.menit)}
              </div>
            </div>
          </div>
          <Ikon nama="right" ukuran={22} tebal={3} />
        </button>
      </div>
    );
  }

  // A. Modul tertutup, status selesai atau terbuka
  return (
    <button type="button" onClick={onToggle} aria-expanded="false" className="w-full flex items-center gap-[18px] px-5 py-4 border-[3px] rounded-[14px] bg-white shadow-[4px_4px_0_#111111] text-left">
      <div className={`w-[52px] h-[52px] shrink-0 border-2 rounded-[10px] flex items-center justify-center ${mod.status === 'selesai' ? 'bg-[#1b7a3e]' : 'bg-white font-space text-[22px] font-bold'}`}>
        {mod.status === 'selesai' ? <Ikon nama="check" ukuran={26} warna="#ffffff" tebal={3} /> : mod.nomor}
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="font-space text-[20px] font-bold">{mod.nomor}. {mod.mod.title}</div>
        <div className="text-[14px] text-[#3d3d3d]">
          {mod.status === 'selesai' 
            ? `${mod.jumlahMateri} materi · ${formatDurasi(mod.menit)}${mod.quiz === 'lulus' ? ' · Quiz lulus' : ''}`
            : `${mod.jumlahMateri} materi · ${formatDurasi(mod.menit)} · ${mod.jumlahSelesai}/${mod.jumlahMateri} selesai`}
        </div>
      </div>
      {mod.status === 'selesai' && <div className="px-2.5 py-1 border-2 border-[#1b7a3e] rounded-full bg-[#dff3e6] text-[#1b7a3e] font-mono text-[12px] font-bold">SELESAI</div>}
      <Ikon nama="right" ukuran={22} tebal={3} />
    </button>
  );
}

function DesktopMateriRow({ mat, isMobile = false }: { mat: any, isMobile?: boolean }) {
  const px = isMobile ? 'px-3.5' : 'px-5';
  const titleText = isMobile ? 'text-[15px]' : 'text-[16px]';
  const durasiClass = `font-mono text-[13px] text-[#5a5a5a] whitespace-nowrap`;
  
  if (mat.status === 'selesai') {
    return (
      <Link to={`/lesson/${mat.lesson.id}`} className={`flex items-center gap-3.5 min-h-[52px] ${px} py-3 border-t border-[#d9d3c6] bg-white text-[#3d3d3d]`}>
        <div className="w-[28px] h-[28px] shrink-0 rounded-full flex items-center justify-center bg-[#1b7a3e]">
          <Ikon nama="check" ukuran={16} warna="#ffffff" tebal={3} />
        </div>
        <div className="font-mono text-[13px] text-[#5a5a5a] w-[34px] shrink-0">{mat.nomor}</div>
        <div className={`flex-1 ${titleText} leading-[21px] font-medium`}>{mat.lesson.title}</div>
        <div className={durasiClass}>{mat.lesson.estimatedMinutes || 5} mnt</div>
      </Link>
    );
  }

  if (mat.status === 'sekarang') {
    return (
      <Link to={`/lesson/${mat.lesson.id}`} className={`flex items-center gap-3.5 min-h-[52px] ${px} py-3 border-t border-[#d9d3c6] bg-primary-light shadow-[inset_4px_0_0_#111111] text-text-main`}>
        <div className="w-[28px] h-[28px] shrink-0 rounded-full flex items-center justify-center border-2 bg-primary">
          <Ikon nama="play" ukuran={13} tebal={2.5} />
        </div>
        <div className="font-mono text-[13px] text-[#5a5a5a] w-[34px] shrink-0">{mat.nomor}</div>
        <div className={`flex-1 ${titleText} leading-[21px] font-bold`}>{mat.lesson.title}</div>
        {isMobile ? (
          <Ikon nama="right" ukuran={20} tebal={3} />
        ) : (
          <div className="px-3.5 py-2 bg-[#111111] text-white rounded-lg font-space text-[14px] font-bold flex items-center gap-1.5 whitespace-nowrap">
            Lanjutkan <Ikon nama="arrow" ukuran={16} warna="#ffffff" tebal={2.5} />
          </div>
        )}
      </Link>
    );
  }

  // belum
  const content = (
    <>
      <div className="w-[28px] h-[28px] shrink-0 rounded-full flex items-center justify-center border-2 border-[#8a857a] bg-white"></div>
      <div className="font-mono text-[13px] text-[#5a5a5a] w-[34px] shrink-0">{mat.nomor}</div>
      <div className={`flex-1 ${titleText} leading-[21px] font-medium`}>{mat.lesson.title}</div>
      <div className={durasiClass}>{mat.lesson.estimatedMinutes || 5} mnt</div>
    </>
  );

  const classes = `flex items-center gap-3.5 min-h-[52px] ${px} py-3 border-t border-[#d9d3c6] bg-white text-text-main`;
  if (mat.bisaDibuka) {
    return <Link to={`/lesson/${mat.lesson.id}`} className={classes}>{content}</Link>;
  }
  return <div className={`${classes} cursor-not-allowed`} title="Selesaikan materi sebelumnya dulu">{content}</div>;
}

function DesktopQuizRow({ mod, isMobile = false }: { mod: any, isMobile?: boolean }) {
  if (mod.quiz === 'tidak-ada') return null;
  const px = isMobile ? 'px-3.5' : 'px-5';
  
  if (mod.quiz === 'terkunci') {
    return (
      <div className={`flex items-center gap-3.5 ${px} py-3.5 border-t-2 border-dashed border-[#8a857a] bg-[#efeadf] text-[#4d4a44]`}>
        <div className="w-[28px] h-[28px] shrink-0 flex items-center justify-center">
          <Ikon nama="quiz" ukuran={22} warna="#4d4a44" tebal={2} />
        </div>
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="text-[15px] font-bold">Quiz akhir modul</div>
          <div className="text-[13px]">Terbuka setelah semua materi selesai</div>
        </div>
        <Ikon nama="lock" ukuran={18} warna="#6b665c" tebal={2.5} />
      </div>
    );
  }

  if (mod.quiz === 'siap' || mod.quiz === 'gagal') {
    return (
      <Link to={`/quiz/${mod.mod.id}`} className={`flex items-center gap-3.5 ${px} py-3.5 border-t-2 border-[#111111] bg-[#fff3b8] text-text-main`}>
        <div className="w-[28px] h-[28px] shrink-0 flex items-center justify-center">
          <Ikon nama="quiz" ukuran={22} tebal={2} />
        </div>
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="text-[15px] font-bold">Quiz akhir modul</div>
          <div className="text-[13px]">{mod.quiz === 'gagal' ? `Skor terakhir ${mod.skorQuiz}. Coba lagi.` : `Semua materi selesai. Saatnya uji pemahamanmu.`}</div>
        </div>
        <div className="px-3.5 py-2 bg-[#111111] text-white rounded-lg font-space text-[14px] font-bold flex items-center gap-1.5 whitespace-nowrap">
          {mod.quiz === 'gagal' ? 'Coba lagi' : 'Mulai quiz'} <Ikon nama="arrow" ukuran={16} warna="#ffffff" tebal={2.5} />
        </div>
      </Link>
    );
  }

  if (mod.quiz === 'lulus') {
    return (
      <Link to={`/quiz/${mod.mod.id}`} className={`flex items-center gap-3.5 ${px} py-3.5 border-t border-[#d9d3c6] bg-white text-text-main`}>
        <div className="w-[28px] h-[28px] shrink-0 flex items-center justify-center rounded-full bg-[#1b7a3e]">
          <Ikon nama="check" ukuran={16} warna="#ffffff" tebal={3} />
        </div>
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="text-[15px] font-bold">Quiz akhir modul</div>
          <div className="text-[13px]">Lulus &middot; skor {mod.skorQuiz}</div>
        </div>
        <div className="font-mono text-[13px] text-[#5a5a5a]">Ulangi</div>
      </Link>
    );
  }
  return null;
}

function MobileModuleCard({ mod, isExpanded, onToggle }: { mod: any, isExpanded: boolean, onToggle: () => void }) {
  if (mod.status === 'terkunci') {
    return (
      <div className="flex items-center gap-3 p-3 border-2 border-dashed border-soon-border rounded-xl bg-soon text-[#4d4a44]">
        <div className="w-[40px] h-[40px] border-2 border-soon-border rounded-[10px] bg-[#e4dfd4] flex items-center justify-center shrink-0">
          <Ikon nama="lock" ukuran={22} warna="#6b665c" tebal={2.5} />
        </div>
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="font-space text-[16px] font-bold">{mod.nomor}. {mod.mod.title}</div>
          <div className="text-[12px]">{mod.jumlahMateri} materi &middot; terkunci</div>
        </div>
      </div>
    );
  }

  if (isExpanded) {
    const isSedang = mod.status === 'sedang';
    return (
      <div className="border-[3px] rounded-xl bg-white shadow-[4px_4px_0_#111111] overflow-hidden">
        <button 
          type="button" 
          onClick={onToggle}
          aria-expanded="true"
          className={`w-full flex items-center gap-3 p-3 text-left border-b-[3px] ${isSedang ? 'bg-primary-light' : 'bg-white'}`}
        >
          <div className={`w-[40px] h-[40px] shrink-0 border-[3px] rounded-[10px] flex items-center justify-center font-space text-[18px] font-bold ${mod.status === 'selesai' ? 'bg-[#1b7a3e]' : 'bg-primary'}`}>
            {mod.status === 'selesai' ? <Ikon nama="check" ukuran={26} warna="#ffffff" tebal={3} /> : mod.nomor}
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="font-space text-[17px] font-bold">{mod.mod.title}</div>
            <div className="h-2 border-2 rounded-full bg-white overflow-hidden w-full">
              <div className="h-full bg-[#111111]" style={{ width: `${(mod.jumlahSelesai / mod.jumlahMateri) * 100}%` }}></div>
            </div>
            <div className="font-mono text-[12px] font-bold">
              {mod.jumlahSelesai}/{mod.jumlahMateri} materi
            </div>
          </div>
          <Ikon nama="down" ukuran={22} tebal={3} />
        </button>
        <div className="flex flex-col">
          {mod.materi.map((mat: any) => <DesktopMateriRow key={mat.lesson.id} mat={mat} isMobile={true} />)}
          <DesktopQuizRow mod={mod} isMobile={true} />
        </div>
      </div>
    );
  }

  // Not expanded, not terkunci -> closed status (sedang, selesai, terbuka)
  if (mod.status === 'sedang') {
    return (
      <div className="border-[3px] rounded-xl bg-white shadow-[4px_4px_0_#111111] overflow-hidden">
        <button 
          type="button" 
          onClick={onToggle}
          aria-expanded="false"
          className="w-full flex items-center gap-3 p-3 text-left bg-primary-light"
        >
          <div className="w-[40px] h-[40px] shrink-0 border-[3px] rounded-[10px] flex items-center justify-center font-space text-[18px] font-bold bg-primary">
            {mod.nomor}
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="font-space text-[17px] font-bold">{mod.mod.title}</div>
            <div className="h-2 border-2 rounded-full bg-white overflow-hidden w-full">
              <div className="h-full bg-[#111111]" style={{ width: `${(mod.jumlahSelesai / mod.jumlahMateri) * 100}%` }}></div>
            </div>
            <div className="font-mono text-[12px] font-bold">
              {mod.jumlahSelesai}/{mod.jumlahMateri} materi
            </div>
          </div>
          <Ikon nama="right" ukuran={22} tebal={3} />
        </button>
      </div>
    );
  }

  // Modul tertutup, status selesai atau terbuka (no lencana, no shadow)
  return (
    <button type="button" onClick={onToggle} aria-expanded="false" className="w-full flex items-center gap-3 p-3 border-2 rounded-xl bg-white text-left">
      <div className={`w-[40px] h-[40px] shrink-0 border-2 rounded-[10px] flex items-center justify-center ${mod.status === 'selesai' ? 'bg-[#1b7a3e]' : 'bg-white font-space text-[18px] font-bold'}`}>
        {mod.status === 'selesai' ? <Ikon nama="check" ukuran={26} warna="#ffffff" tebal={3} /> : mod.nomor}
      </div>
      <div className="flex-1 flex flex-col gap-0.5">
        <div className="font-space text-[16px] font-bold">{mod.nomor}. {mod.mod.title}</div>
        <div className="text-[12px] text-[#3d3d3d]">
          {mod.status === 'selesai' 
            ? `${mod.jumlahMateri} materi · selesai`
            : `${mod.jumlahSelesai}/${mod.jumlahMateri} materi`}
        </div>
      </div>
      <Ikon nama="right" ukuran={20} tebal={3} />
    </button>
  );
}