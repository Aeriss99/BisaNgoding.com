import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { coursesData, modulesData, getVisibleLessons } from '../lib/content';
import jalurKarierData from '../../content/jalur-karier.json';

interface StikerConfig {
  label: string;
  warna: string;
  bentuk: 'kotak' | 'pil' | 'bulat';
  rotasi: number;
}

const STIKER_MAP: Record<string, StikerConfig> = {
  java: { label: 'JAVA', warna: '#ffe838', bentuk: 'kotak', rotasi: -8 },
  javascript: { label: 'JAVASCRIPT', warna: '#2fe6f0', bentuk: 'pil', rotasi: 6 },
  'html-css': { label: 'HTML & CSS', warna: '#ff3dcb', bentuk: 'kotak', rotasi: -3 },
  mysql: { label: 'MYSQL', warna: '#a78bfa', bentuk: 'bulat', rotasi: 10 },
  git: { label: 'GIT', warna: '#ffffff', bentuk: 'pil', rotasi: -6 },
  'rest-api': { label: 'REST API', warna: '#ffe838', bentuk: 'kotak', rotasi: 4 },
  'spring-boot': { label: 'SPRING BOOT', warna: '#dff3e6', bentuk: 'pil', rotasi: -10 },
  linux: { label: 'LINUX', warna: '#2fe6f0', bentuk: 'bulat', rotasi: 7 },
  devops: { label: 'DEVOPS', warna: '#ff3dcb', bentuk: 'pil', rotasi: -4 },
  'english-it': { label: 'ENGLISH', warna: '#a78bfa', bentuk: 'kotak', rotasi: 9 },
  nodejs: { label: 'NODE.JS', warna: 'transparent', bentuk: 'pil', rotasi: -7 },
  tailwind: { label: 'TAILWIND', warna: 'transparent', bentuk: 'kotak', rotasi: 3 },
  typescript: { label: 'TYPESCRIPT', warna: 'transparent', bentuk: 'pil', rotasi: 8 },
  react: { label: 'REACT', warna: 'transparent', bentuk: 'bulat', rotasi: -5 },
};

const PREFERRED_STIKER_ORDER = [
  'java',
  'javascript',
  'html-css',
  'mysql',
  'git',
  'rest-api',
  'spring-boot',
  'linux',
  'devops',
  'english-it',
  'nodejs',
  'tailwind',
  'typescript',
  'react',
];

const FAQ_LIST = [
  {
    q: 'Apakah gratis?',
    a: 'Ya. Seluruh materi saat ini gratis.',
  },
  {
    q: 'Perlu install software?',
    a: 'Untuk kelas Java, JavaScript, dan HTML & CSS tidak: kodenya dijalankan langsung di browser. Kelas lain berisi teori dan latihan soal di sini, dan kelas Spring Boot serta DevOps dipraktikkan di komputermu sendiri.',
  },
  {
    q: 'Bisa belajar di HP?',
    a: 'Bisa. Progres tersimpan dan tersinkron antara HP dan laptop, dan website bisa dipasang seperti aplikasi.',
  },
  {
    q: 'Kenapa harus login?',
    a: 'Supaya progres, streak, dan nilai quiz tersimpan dan bisa dilanjutkan di perangkat lain.',
  },
  {
    q: 'Kenapa progres bisa dihapus?',
    a: 'Kalau 7 hari tidak membuka BisaNgoding, progres akunmu dihapus dan akun dibekukan 5 hari. Buka minimal sekali seminggu supaya progresmu aman.',
  },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({ 0: true });

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const scrollToKelas = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('kelas')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToJalur = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('jalur')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFAQ = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Perhitungan data untuk pita miring
  const readyCoursesCount = useMemo(
    () => coursesData.filter((c) => c.status !== 'soon').length,
    []
  );

  const readyModules = useMemo(
    () => modulesData.filter((m) => m.status !== 'draft'),
    []
  );

  const readyModulesCount = readyModules.length;

  const totalLessonsCount = useMemo(() => {
    return readyModules.reduce((acc, m) => {
      const visible = getVisibleLessons(m.id);
      return acc + (visible.length || m.lessonCount || 0);
    }, 0);
  }, [readyModules]);

  // Jumlah tahap dari jalur-karier.json
  const backendTahap = useMemo(() => {
    return jalurKarierData.jalur.find((j) => j.id === 'backend')?.tahap.length || 5;
  }, []);

  const frontendTahap = useMemo(() => {
    return jalurKarierData.jalur.find((j) => j.id === 'frontend')?.tahap.length || 6;
  }, []);

  const devopsTahap = useMemo(() => {
    return jalurKarierData.jalur.find((j) => j.id === 'devops')?.tahap.length || 6;
  }, []);

  // Susunan stiker kelas
  const sortedCourses = useMemo(() => {
    return [...coursesData].sort((a, b) => {
      const idxA = PREFERRED_STIKER_ORDER.indexOf(a.id);
      const idxB = PREFERRED_STIKER_ORDER.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return (a.order || 0) - (b.order || 0);
    });
  }, []);

  return (
    <div className="bg-[#fbf6ec] text-[#111111] font-space min-h-screen overflow-x-clip selection:bg-[#2fe6f0]">
      {/* 1. Menu atas */}
      <header className="sticky top-0 z-50 bg-[#fbf6ec] border-b-4 border-[#111111]">
        <nav className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 md:gap-3.5">
          <Link
            to="/"
            className="font-bungee text-[16px] md:text-[22px] no-underline text-[#111111]"
            style={{ textShadow: '3px 3px 0 #ff3dcb' }}
          >
            BisaNgoding.com
          </Link>

          {/* Navigasi Desktop */}
          <div className="hidden md:flex items-center gap-[22px] font-bold text-[#111111]">
            <a
              href="#kelas"
              onClick={scrollToKelas}
              className="no-underline text-[#111111] hover:text-[#2447f5]"
            >
              Kelas
            </a>
            <a
              href="#jalur"
              onClick={scrollToJalur}
              className="no-underline text-[#111111] hover:text-[#2447f5]"
            >
              Jalur Karier
            </a>
            <a
              href="#faq"
              onClick={scrollToFAQ}
              className="no-underline text-[#111111] hover:text-[#2447f5]"
            >
              FAQ
            </a>
            <Link
              to="/masuk"
              className="font-bungee text-[14px] no-underline bg-[#2fe6f0] text-[#111111] border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] px-4 py-2.5 hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              MASUK
            </Link>
          </div>

          {/* Tombol HP */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/masuk"
              className="font-bungee text-[13px] no-underline bg-[#2fe6f0] text-[#111111] border-[3px] border-[#111111] shadow-[3px_3px_0_#111111] px-3 h-[44px] flex items-center box-border"
            >
              MASUK
            </Link>
            <button
              id="tombol-menu"
              aria-label="Buka menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-[44px] h-[44px] bg-white border-[3px] border-[#111111] shadow-[3px_3px_0_#111111] flex items-center justify-center p-0 cursor-pointer"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#111111"
                strokeWidth="3"
                strokeLinecap="square"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </nav>

        {/* Panel Menu Mobile */}
        <nav
          id="panel-menu"
          className={`md:hidden bg-[#ffe838] border-b-4 border-[#111111] flex-col ${
            menuOpen ? 'flex' : 'hidden'
          }`}
        >
          <a
            href="#kelas"
            onClick={(e) => {
              setMenuOpen(false);
              scrollToKelas(e);
            }}
            className="font-bungee text-[18px] no-underline px-4 py-3.5 border-b-[3px] border-[#111111] text-[#111111] hover:text-[#2447f5]"
          >
            KELAS
          </a>
          <a
            href="#jalur"
            onClick={(e) => {
              setMenuOpen(false);
              scrollToJalur(e);
            }}
            className="font-bungee text-[18px] no-underline px-4 py-3.5 border-b-[3px] border-[#111111] text-[#111111] hover:text-[#2447f5]"
          >
            JALUR KARIER
          </a>
          <a
            href="#faq"
            onClick={(e) => {
              setMenuOpen(false);
              scrollToFAQ(e);
            }}
            className="font-bungee text-[18px] no-underline px-4 py-3.5 text-[#111111] hover:text-[#2447f5]"
          >
            FAQ
          </a>
        </nav>
      </header>

      {/* 2. Hero */}
      <section className="relative max-w-[1280px] mx-auto text-center px-4 md:px-6 py-[64px] pb-[84px] md:py-[96px] md:pb-[110px]">
        {/* Stiker Hiasan Laptop */}
        <div
          aria-hidden="true"
          className="hidden md:flex pointer-events-none select-none absolute left-[4%] top-[50px] -rotate-12 w-[112px] h-[88px] bg-[#ffe838] border-4 border-[#111111] rounded-[16px] shadow-[5px_5px_0_#111111] items-center justify-center font-bungee text-[42px]"
        >
          {'{ }'}
        </div>
        <div
          aria-hidden="true"
          className="hidden md:block pointer-events-none select-none absolute right-[6%] top-[40px] rotate-9 bg-[#2fe6f0] border-4 border-[#111111] rounded-full shadow-[5px_5px_0_#111111] px-[22px] py-[14px] font-bungee text-[34px]"
        >
          {'</>'}
        </div>
        <div
          aria-hidden="true"
          className="hidden md:block pointer-events-none select-none absolute left-[9%] bottom-[40px] rotate-6 w-[126px] bg-[#111111] border-4 border-[#111111] shadow-[5px_5px_0_#a78bfa] text-left"
        >
          <div className="h-[18px] bg-white border-b-[3px] border-[#111111]"></div>
          <div className="p-[10px_12px] font-mono font-bold text-[28px] text-[#2fe6f0] leading-none">
            {'>_'}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="hidden md:flex pointer-events-none select-none absolute right-[8%] bottom-[30px] -rotate-10 w-[112px] h-[112px] rounded-full bg-[#dff3e6] border-4 border-[#1b7a3e] items-center justify-center font-bungee text-[20px] text-[#1b7a3e]"
        >
          LULUS
        </div>
        <div
          aria-hidden="true"
          className="hidden md:block pointer-events-none select-none absolute left-[22%] top-[8px] rotate-4 bg-white border-[3px] border-[#111111] rounded-[14px] shadow-[4px_4px_0_#111111] px-3 py-2 font-mono font-bold text-[15px]"
        >
          Halo, dunia!
        </div>
        <div
          aria-hidden="true"
          className="hidden md:block pointer-events-none select-none absolute right-[22%] bottom-[40px] -rotate-5 bg-[#ffe7c7] border-4 border-[#111111] rounded-full shadow-[4px_4px_0_#111111] px-4 py-2 font-bungee text-[16px] text-[#c2410c]"
        >
          STREAK 7 HARI
        </div>

        {/* Stiker Hiasan HP */}
        <div
          aria-hidden="true"
          className="md:hidden pointer-events-none select-none absolute left-[10px] top-[12px] -rotate-12 w-[62px] h-[48px] bg-[#ffe838] border-[3px] border-[#111111] rounded-[10px] shadow-[3px_3px_0_#111111] flex items-center justify-center font-bungee text-[22px]"
        >
          {'{ }'}
        </div>
        <div
          aria-hidden="true"
          className="md:hidden pointer-events-none select-none absolute right-[12px] top-[10px] rotate-9 bg-[#2fe6f0] border-[3px] border-[#111111] rounded-full shadow-[3px_3px_0_#111111] px-3 py-1.5 font-bungee text-[18px]"
        >
          {'</>'}
        </div>
        <div
          aria-hidden="true"
          className="md:hidden pointer-events-none select-none absolute left-[14px] bottom-[14px] rotate-6 w-[70px] bg-[#111111] border-[3px] border-[#111111] shadow-[3px_3px_0_#a78bfa] text-left"
        >
          <div className="h-[10px] bg-white border-b-2 border-[#111111]"></div>
          <div className="p-[4px_8px] font-mono font-bold text-[16px] text-[#2fe6f0] leading-none">
            {'>_'}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="md:hidden pointer-events-none select-none absolute right-[14px] bottom-[10px] -rotate-10 w-[66px] h-[66px] rounded-full bg-[#dff3e6] border-[3px] border-[#1b7a3e] flex items-center justify-center font-bungee text-[12px] text-[#1b7a3e]"
        >
          LULUS
        </div>

        {/* Isi Hero */}
        <div className="relative flex flex-col items-center gap-[18px] md:gap-[24px]">
          <h1 className="m-0 font-bungee font-normal text-[40px] md:text-[84px] leading-none md:leading-[0.98] max-w-[900px]">
            TEMPEL ILMUNYA,{' '}
            <span className="bg-[#ff3dcb] border-[3px] md:border-4 border-[#111111] shadow-[4px_4px_0_#111111] md:shadow-[6px_6px_0_#111111] px-2.5 md:px-3.5 py-0.5 md:py-0 inline-block -rotate-2 mt-2 md:mt-2.5">
              SATU PER SATU.
            </span>
          </h1>

          <p className="m-0 text-[17px] md:text-[21px] leading-[1.5] max-w-[620px]">
            Kumpulkan kelasnya satu per satu. Belajar coding gratis, berbahasa Indonesia, langsung praktik.
          </p>

          {/* Tombol Laptop */}
          <div className="hidden md:flex flex-wrap justify-center gap-4">
            <Link
              to="/masuk"
              className="font-bungee text-[18px] no-underline bg-[#ffe838] text-[#111111] border-4 border-[#111111] shadow-[6px_6px_0_#111111] px-6 py-4 hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              MULAI GRATIS
            </Link>
            <a
              href="#kelas"
              onClick={scrollToKelas}
              className="font-bungee text-[18px] no-underline bg-white text-[#111111] border-4 border-[#111111] shadow-[6px_6px_0_#111111] px-6 py-4 hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              LIHAT KELAS
            </a>
          </div>

          {/* Tombol HP */}
          <div className="flex md:hidden self-stretch flex-col gap-3.5 px-1.5">
            <Link
              to="/masuk"
              className="font-bungee text-[17px] no-underline bg-[#ffe838] text-[#111111] border-4 border-[#111111] shadow-[5px_5px_0_#111111] py-[15px] px-4 text-center"
            >
              MULAI GRATIS
            </Link>
            <a
              href="#kelas"
              onClick={scrollToKelas}
              className="font-bungee text-[17px] no-underline bg-white text-[#111111] border-4 border-[#111111] shadow-[5px_5px_0_#111111] py-[15px] px-4 text-center"
            >
              LIHAT KELAS
            </a>
          </div>

          {/* Stiker Streak HP */}
          <div
            aria-hidden="true"
            className="md:hidden pointer-events-none select-none -rotate-4 bg-[#ffe7c7] border-[3px] border-[#111111] rounded-full shadow-[3px_3px_0_#111111] px-3.5 py-1.5 font-bungee text-[13px] text-[#c2410c] mt-1"
          >
            STREAK 7 HARI
          </div>
        </div>
      </section>

      {/* 3. Pita miring */}
      <div className="bg-[#ffe838] border-t-4 border-b-4 border-[#111111] -rotate-[2deg] md:-rotate-[1.5deg] -mx-[30px] md:-mx-[40px] py-3 md:py-4 whitespace-nowrap overflow-hidden font-bungee text-[17px] md:text-[24px] select-none">
        <span className="pl-[30px] md:pl-[40px] inline-block">
          GRATIS ✱ {readyCoursesCount} KELAS ✱ {readyModulesCount} MODUL ✱ {totalLessonsCount} MATERI ✱ QUIZ TIAP MODUL ✱ STREAK HARIAN ✱ BISA DI HP ✱ GRATIS ✱ {readyCoursesCount} KELAS ✱ {readyModulesCount} MODUL ✱ {totalLessonsCount} MATERI ✱
        </span>
      </div>

      {/* 4. LAPTOP STIKERMU */}
      <section id="kelas" className="max-w-[1280px] mx-auto px-4 md:px-6 py-[60px] pb-[40px] md:py-[88px] md:pb-[56px]">
        <h2 className="m-0 mb-1.5 md:mb-2 font-bungee font-normal text-[28px] md:text-[44px]">
          LAPTOP STIKERMU
        </h2>
        <p className="m-0 mb-5 md:mb-7 text-[16px] md:text-[18px] leading-[1.5]">
          Koleksi kelas yang bisa kamu kumpulkan. Yang bergaris putus-putus masih segera hadir.
        </p>

        <div className="bg-[#2b2b2b] border-4 border-[#111111] rounded-[20px] md:rounded-[28px] shadow-[6px_6px_0_#111111] md:shadow-[10px_10px_0_#111111] p-[22px_14px] md:p-[40px] flex flex-wrap justify-center items-center gap-[14px_12px] md:gap-[22px_26px] min-h-[380px] box-border">
          {sortedCourses.map((course) => {
            const config = STIKER_MAP[course.id] || {
              label: course.short || course.title.replace('Kelas ', '').toUpperCase(),
              warna: '#ffe838',
              bentuk: 'pil',
              rotasi: 0,
            };

            const isReady = course.status !== 'soon';

            // Kelas bentuk bulat
            if (config.bentuk === 'bulat') {
              if (isReady) {
                return (
                  <Link
                    key={course.id}
                    to="/masuk"
                    aria-label={`Kelas ${course.title}`}
                    className="font-bungee text-[#111111] no-underline w-[76px] h-[76px] md:w-[118px] md:h-[118px] rounded-full flex items-center justify-center text-center p-1 md:p-2 box-border text-[11px] md:text-[15px] border-[3px] md:border-4 border-[#111111] shadow-[3px_3px_0_#000000] md:shadow-[5px_5px_0_#000000] select-none hover:scale-105 transition-transform"
                    style={{
                      background: config.warna,
                      transform: `rotate(${config.rotasi}deg)`,
                    }}
                  >
                    {config.label}
                  </Link>
                );
              }
              return (
                <span
                  key={course.id}
                  className="font-bungee text-[#bdb8ad] w-[76px] h-[76px] md:w-[118px] md:h-[118px] rounded-full flex items-center justify-center text-center p-1 md:p-2 box-border text-[11px] md:text-[15px] bg-transparent border-2 md:border-[3px] border-dashed border-[#8a857a] select-none cursor-default"
                  style={{ transform: `rotate(${config.rotasi}deg)` }}
                >
                  {config.label}
                </span>
              );
            }

            // Kelas bentuk kotak
            if (config.bentuk === 'kotak') {
              if (isReady) {
                return (
                  <Link
                    key={course.id}
                    to="/masuk"
                    aria-label={`Kelas ${course.title}`}
                    className="font-bungee text-[#111111] no-underline rounded-[8px] md:rounded-[10px] p-[9px_12px] md:p-[16px_20px] text-[15px] md:text-[22px] border-[3px] md:border-4 border-[#111111] shadow-[3px_3px_0_#000000] md:shadow-[5px_5px_0_#000000] select-none hover:scale-105 transition-transform inline-block"
                    style={{
                      background: config.warna,
                      transform: `rotate(${config.rotasi}deg)`,
                    }}
                  >
                    {config.label}
                  </Link>
                );
              }
              return (
                <span
                  key={course.id}
                  className="font-bungee text-[#bdb8ad] rounded-[8px] md:rounded-[10px] p-[9px_12px] md:p-[16px_20px] text-[15px] md:text-[22px] bg-transparent border-2 md:border-[3px] border-dashed border-[#8a857a] select-none cursor-default inline-block"
                  style={{ transform: `rotate(${config.rotasi}deg)` }}
                >
                  {config.label}
                </span>
              );
            }

            // Kelas bentuk pil (default)
            if (isReady) {
              return (
                <Link
                  key={course.id}
                  to="/masuk"
                  aria-label={`Kelas ${course.title}`}
                  className="font-bungee text-[#111111] no-underline rounded-full p-[8px_14px] md:p-[14px_22px] text-[14px] md:text-[20px] border-[3px] md:border-4 border-[#111111] shadow-[3px_3px_0_#000000] md:shadow-[5px_5px_0_#000000] select-none hover:scale-105 transition-transform inline-block"
                  style={{
                    background: config.warna,
                    transform: `rotate(${config.rotasi}deg)`,
                  }}
                >
                  {config.label}
                </Link>
              );
            }
            return (
              <span
                key={course.id}
                className="font-bungee text-[#bdb8ad] rounded-full p-[8px_14px] md:p-[14px_22px] text-[14px] md:text-[20px] bg-transparent border-2 md:border-[3px] border-dashed border-[#8a857a] select-none cursor-default inline-block"
                style={{ transform: `rotate(${config.rotasi}deg)` }}
              >
                {config.label}
              </span>
            );
          })}
        </div>
      </section>

      {/* 5. MAU JADI APA? */}
      <div id="jalur" className="max-w-[1280px] mx-auto px-4 md:px-6">
        <h2 className="m-0 font-bungee font-normal text-[28px] md:text-[44px]">
          MAU JADI APA?
        </h2>
      </div>
      <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-4 md:py-10 pb-12 md:pb-16 grid grid-cols-1 md:grid-cols-3 gap-[26px] md:gap-[30px]">
        {/* Backend */}
        <Link
          to="/masuk"
          className="relative bg-white border-4 border-[#111111] shadow-[5px_5px_0_#111111] md:shadow-[6px_6px_0_#111111] p-[18px] md:p-[24px_24px_26px] no-underline text-[#111111] block hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          <h3 className="m-0 mb-1.5 md:mb-2 font-bungee font-normal text-[20px] md:text-[22px]">
            BACKEND
          </h3>
          <p className="m-0 text-[15px] md:text-[16px] leading-[1.5]">
            Java → MySQL → REST API → Spring Boot → deploy.
          </p>
          <span
            aria-hidden="true"
            className="absolute -right-[6px] md:-right-[14px] -top-[14px] md:-top-[16px] rotate-[8deg] md:rotate-[10deg] bg-[#ffe838] border-[3px] border-[#111111] px-2 md:px-2.5 py-0.5 md:py-1 font-bungee text-[11px] md:text-[13px] select-none"
          >
            {backendTahap} TAHAP
          </span>
        </Link>

        {/* Frontend */}
        <Link
          to="/masuk"
          className="relative bg-white border-4 border-[#111111] shadow-[5px_5px_0_#111111] md:shadow-[6px_6px_0_#111111] p-[18px] md:p-[24px_24px_26px] no-underline text-[#111111] block hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          <h3 className="m-0 mb-1.5 md:mb-2 font-bungee font-normal text-[20px] md:text-[22px]">
            FRONTEND
          </h3>
          <p className="m-0 text-[15px] md:text-[16px] leading-[1.5]">
            HTML &amp; CSS → JavaScript → ambil data → React.
          </p>
          <span
            aria-hidden="true"
            className="absolute -right-[6px] md:-right-[14px] -top-[14px] md:-top-[16px] -rotate-[7deg] md:-rotate-[8deg] bg-[#2fe6f0] border-[3px] border-[#111111] px-2 md:px-2.5 py-0.5 md:py-1 font-bungee text-[11px] md:text-[13px] select-none"
          >
            {frontendTahap} TAHAP
          </span>
        </Link>

        {/* DevOps */}
        <Link
          to="/masuk"
          className="relative bg-white border-4 border-[#111111] shadow-[5px_5px_0_#111111] md:shadow-[6px_6px_0_#111111] p-[18px] md:p-[24px_24px_26px] no-underline text-[#111111] block hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          <h3 className="m-0 mb-1.5 md:mb-2 font-bungee font-normal text-[20px] md:text-[22px]">
            DEVOPS
          </h3>
          <p className="m-0 text-[15px] md:text-[16px] leading-[1.5]">
            Linux → Docker → CI/CD → Kubernetes → Terraform.
          </p>
          <span
            aria-hidden="true"
            className="absolute -right-[6px] md:-right-[14px] -top-[14px] md:-top-[16px] rotate-[6deg] md:rotate-[7deg] bg-[#a78bfa] border-[3px] border-[#111111] px-2 md:px-2.5 py-0.5 md:py-1 font-bungee text-[11px] md:text-[13px] select-none"
          >
            {devopsTahap} TAHAP
          </span>
        </Link>
      </section>

      {/* 6. FAQ */}
      <section id="faq" className="max-w-[820px] mx-auto px-4 md:px-6 py-2 md:py-6 pb-12 md:pb-[72px]">
        <h2 className="m-0 mb-[22px] font-bungee font-normal text-[28px] md:text-[44px]">
          FAQ
        </h2>
        <div className="flex flex-col gap-3.5">
          {FAQ_LIST.map((faq, index) => {
            const isOpen = !!openFaqs[index];
            return (
              <div
                key={index}
                className="bg-white border-4 border-[#111111] shadow-[4px_4px_0_#111111] md:shadow-[6px_6px_0_#111111]"
              >
                <button
                  className="faq-q w-full flex items-center justify-between gap-3 bg-transparent border-0 p-3.5 md:p-[18px_20px] min-h-[52px] font-space text-[16px] md:text-[18px] font-bold text-left text-[#111111] cursor-pointer"
                  aria-expanded={isOpen}
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.q}</span>
                  <span className="font-bungee text-[22px] select-none">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <p className="faq-a m-0 p-[0_14px_14px] md:p-[0_20px_18px] text-[15px] md:text-[16px] leading-[1.55] text-[#111111]">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Ajakan masuk */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-2 md:py-2 pb-14 md:pb-20">
        <div className="relative bg-[#2fe6f0] border-4 border-[#111111] shadow-[6px_6px_0_#111111] md:shadow-[10px_10px_0_#111111] p-[36px_18px_22px] md:p-[48px_36px] flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center justify-between gap-[18px] md:gap-6">
          <h2 className="m-0 font-bungee font-normal text-[28px] md:text-[46px] leading-[1.05] md:flex-[1_1_480px]">
            STIKER PERTAMAMU: JAVA.
          </h2>
          <Link
            to="/masuk"
            className="font-bungee text-[17px] md:text-[18px] no-underline bg-[#111111] text-white border-4 border-[#111111] shadow-[5px_5px_0_#ff3dcb] md:shadow-[6px_6px_0_#ff3dcb] p-[15px_16px] md:p-[16px_24px] text-center inline-block hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            MASUK GRATIS
          </Link>
          <span
            aria-hidden="true"
            className="absolute -left-2 md:-left-[18px] -top-[18px] md:-top-[22px] -rotate-[10deg] md:-rotate-[12deg] bg-[#ff3dcb] border-[3px] md:border-4 border-[#111111] px-2.5 md:px-3.5 py-1 md:py-2 font-bungee text-[14px] md:text-[18px] shadow-[3px_3px_0_#111111] md:shadow-[4px_4px_0_#111111] select-none text-[#111111]"
          >
            GRATIS!
          </span>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t-4 border-[#111111] bg-[#fbf6ec]">
        <div className="max-w-[1280px] mx-auto p-[18px_16px_28px] md:p-[20px_24px] flex flex-col md:flex-row md:flex-wrap justify-between gap-2.5 md:gap-3 font-bold text-[14px] md:text-base">
          <span>BisaNgoding.com · 2026</span>
          <div className="flex flex-wrap gap-4 md:gap-6">
            <a
              href="#kelas"
              onClick={scrollToKelas}
              className="no-underline text-[#111111] hover:text-[#2447f5]"
            >
              Kelas
            </a>
            <a
              href="#jalur"
              onClick={scrollToJalur}
              className="no-underline text-[#111111] hover:text-[#2447f5]"
            >
              Jalur Karier
            </a>
            <a
              href="#faq"
              onClick={scrollToFAQ}
              className="no-underline text-[#111111] hover:text-[#2447f5]"
            >
              FAQ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
