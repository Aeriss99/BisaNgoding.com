import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Ikon } from '../ui/IkonDesain';
import { useProgress } from '../../context/ProgressContext';
import { BATAS_SEGMEN } from '../../lib/materi';
import { Avatar, KartuPengguna, KotakStreakXp, Garis, MenuAkun, ItemMenu, useKeluar } from './MenuAtas';

interface MenuRampingProps {
  kembaliKe: string;     // alamat tombol kembali, contoh infoMateri(lesson).kembaliKe
  kembaliLabel: string;  // judul modul, contoh "Java Collection"
  judul: string;         // teks kiri atas bar progres (desktop), contoh "4.5 · Generics: Kenapa Ada Tanda Kurung Sudut"
  posisi: number;        // indeks kartu/soal sekarang, mulai 0
  total: number;         // jumlah kartu/soal
}

export default function MenuRamping({ kembaliKe, kembaliLabel, judul, posisi, total }: MenuRampingProps) {
  const { progress } = useProgress();
  const keluar = useKeluar();
  const [menuProfilBuka, setMenuProfilBuka] = useState(false);
  const profilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profilRef.current && !profilRef.current.contains(e.target as Node)) {
        setMenuProfilBuka(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuProfilBuka(false);
    }
    if (menuProfilBuka) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuProfilBuka]);

  // Close menu on navigation changes (simulated by generic unmount/remount usually)
  useEffect(() => {
    return () => setMenuProfilBuka(false);
  }, [kembaliKe, posisi]);

  let barProgresDesktop = null;
  let barProgresMobile = null;
  
  if (total <= BATAS_SEGMEN) {
    const segments = [];
    for (let i = 0; i < total; i++) {
      const isFilled = i <= posisi;
      segments.push(
        <div key={i} className={`flex-1 h-2.5 border-2 border-[var(--color-text-main)] rounded-full ${isFilled ? 'bg-[var(--color-primary)]' : 'bg-white'}`}></div>
      );
    }
    barProgresDesktop = (
      <div className="flex gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={posisi + 1}>
        {segments}
      </div>
    );
    barProgresMobile = barProgresDesktop;
  } else {
    barProgresDesktop = (
      <div className="h-2.5 border-2 rounded-full bg-white overflow-hidden" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={posisi + 1}>
        <div className="h-full bg-[var(--color-primary)]" style={{ width: `${((posisi + 1) / total) * 100}%` }}></div>
      </div>
    );
    barProgresMobile = barProgresDesktop;
  }

  return (
    <>
      {/* Desktop (>= 1024px) */}
      <header className="hidden lg:flex sticky top-0 z-40 h-16 shrink-0 items-center gap-5 px-8 bg-[var(--color-bg-base)] border-b-[3px] border-[var(--color-text-main)] leading-[normal]">
        <Link to={kembaliKe} title={`Kembali ke ${kembaliLabel}`} className="flex items-center gap-2 h-11 pl-2.5 pr-3.5 border-2 rounded-[10px] bg-white font-bold text-[15px] shrink-0 max-w-[260px] text-[var(--color-text-main)] no-underline transition-[transform,background-color] duration-150 hover:bg-[var(--color-primary-light)] motion-safe:active:translate-y-[2px] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-main)]">
          <Ikon nama="back" ukuran={18} tebal={2.5} />
          <span className="truncate">{kembaliLabel}</span>
        </Link>
        <Link to="/" title="Ke beranda" className="font-bungee text-[16px] px-1 bg-[var(--color-primary)] shrink-0 no-underline text-[var(--color-text-main)] transition-transform duration-150 motion-safe:hover:-rotate-2 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-main)]">
          BISANGODING
        </Link>
        <div className="flex-1 min-w-0 max-w-[640px] mx-auto flex flex-col gap-1.5">
          <div className="flex justify-between gap-3 text-[13px]">
            <b className="truncate">{judul}</b>
            <span className="font-mono font-bold shrink-0">{posisi + 1} / {total}</span>
          </div>
          {barProgresDesktop}
        </div>
        <div title="Streak belajar" className="flex items-center gap-1.5 h-10 px-2.5 border-2 rounded-[10px] bg-[var(--color-streak-bg)] font-space font-bold shrink-0">
          <Ikon nama="flame" ukuran={18} warna="var(--color-streak)" tebal={2.2} />
          {progress.streak}
        </div>
        <div className="relative shrink-0" ref={profilRef}>
          <button 
            type="button" 
            aria-label="Menu profil" 
            aria-haspopup="menu" 
            aria-expanded={menuProfilBuka}
            className="w-11 h-11 rounded-full flex items-center justify-center border-none p-0 cursor-pointer transition-transform duration-150 motion-safe:hover:scale-105 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-main)]"
            onClick={() => setMenuProfilBuka(!menuProfilBuka)}
          >
            <Avatar ukuran={44} />
          </button>
          
          {menuProfilBuka && (
            <div role="menu" aria-label="Menu profil" className="leading-[normal] absolute right-0 top-[62px] w-80 z-50 border-[3px] border-[var(--color-text-main)] rounded-[14px] bg-white shadow-[8px_8px_0_var(--color-text-main)] py-1.5">
              <KartuPengguna />
              <KotakStreakXp />
              <Garis />
              <MenuAkun />
              <Garis />
              <ItemMenu ikon="logout" teks="Keluar" bahaya onClick={() => { setMenuProfilBuka(false); keluar(); }} />
            </div>
          )}
        </div>
      </header>

      {/* Mobile/Tablet (< 1024px) */}
      <header className="lg:hidden flex sticky top-0 z-40 h-[60px] shrink-0 items-center gap-2.5 px-3 bg-[var(--color-bg-base)] border-b-[3px] border-[var(--color-text-main)] leading-[normal]">
        <Link to={kembaliKe} aria-label={`Kembali ke ${kembaliLabel}`} className="w-11 h-11 shrink-0 border-2 rounded-[10px] bg-white flex items-center justify-center text-[var(--color-text-main)] transition-[transform,background-color] duration-150 hover:bg-[var(--color-primary-light)] motion-safe:active:translate-y-[2px] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-main)]">
          <Ikon nama="close" ukuran={22} tebal={2.2} />
        </Link>
        <div className="flex-1 min-w-0">
          {barProgresMobile}
        </div>
        <span className="font-mono text-[13px] font-bold shrink-0">{posisi + 1}/{total}</span>
        <div className="flex items-center gap-1 h-9 px-2 border-2 rounded-lg bg-[var(--color-streak-bg)] font-space font-bold text-[14px] shrink-0">
          <Ikon nama="flame" ukuran={16} warna="var(--color-streak)" tebal={2.2} />
          {progress.streak}
        </div>
      </header>
    </>
  );
}