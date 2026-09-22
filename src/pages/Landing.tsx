import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Code, Hammer, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { modulesData, getVisibleLessons } from '../lib/content';
import { ComingSoon } from '../components/ComingSoon';

export default function Landing() {
  const { masukGoogle, isSupabaseConfigured } = useAuth();

  const handleLoginClick = async (e: React.MouseEvent) => {
    if (isSupabaseConfigured) {
      e.preventDefault();
      await masukGoogle();
    } else {
      // If no Supabase, fallback to navigating to modules
    }
  };

  const scrollToModul = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('modul')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFAQ = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--color-landing-bg)] font-sans text-[var(--color-landing-black)] overflow-clip selection:bg-[var(--color-landing-cyan)]">
      {/* 1. Navbar */}
      <nav className="sticky top-0 z-50 bg-[var(--color-landing-bg)] border-b-[6px] border-[var(--color-landing-cyan)] px-4 py-3 sm:px-8 brutal-border-bottom">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-bungee tracking-wide" style={{ textShadow: '2px 2px 0 var(--color-landing-cyan)' }}>
            BisaNgoding.com
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 font-barlow font-bold text-lg mr-4">
              <Link to="/" className="hover:text-[var(--color-landing-cyan)] transition-colors">Beranda</Link>
              <a href="#modul" onClick={scrollToModul} className="hover:text-[var(--color-landing-cyan)] transition-colors">Modul</a>
              <ComingSoon inline>
                <span className="hover:text-[var(--color-landing-cyan)] transition-colors cursor-not-allowed">Bootcamp</span>
              </ComingSoon>
              <ComingSoon inline>
                <span className="hover:text-[var(--color-landing-cyan)] transition-colors cursor-not-allowed">Komunitas</span>
              </ComingSoon>
              <a href="#faq" onClick={scrollToFAQ} className="hover:text-[var(--color-landing-cyan)] transition-colors">FAQ</a>
            </div>
            
            {isSupabaseConfigured && (
              <button onClick={masukGoogle} className="bg-[var(--color-landing-cyan)] border-[3px] border-[var(--color-landing-black)] px-3 py-1.5 md:px-5 md:py-2 font-bungee text-sm md:text-base shadow-[2px_2px_0_#111111] md:shadow-[4px_4px_0_#111111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                MASUK
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Hero */}
      <section className="px-4 py-12 sm:px-8 lg:py-20 max-w-7xl mx-auto">
        <div 
          className="bg-[var(--color-landing-hero)] border-[3px] border-[var(--color-landing-black)] shadow-[8px_8px_0_#111111] p-6 md:p-12 lg:p-16 flex flex-col lg:flex-row items-center gap-8 md:gap-12"
        >
          <div className="flex-1 space-y-6">
            <h1 className="font-bungee text-4xl sm:text-5xl lg:text-6xl leading-[1.1]">
              BISANGODING: TEMPAT BELAJAR JAVA DARI NOL, LANGSUNG PRAKTIK{' '}
              <span className="text-[var(--color-landing-cyan)] inline-block" style={{ textShadow: '-2px -2px 0 #111, 2px -2px 0 #111, -2px 2px 0 #111, 2px 2px 0 #111' }}>
                GRATIS
              </span>
            </h1>
            <p className="font-barlow font-medium text-xl sm:text-2xl text-gray-800 max-w-2xl">
              Belajar lewat cerita, tulis kodenya langsung di browser, dan bangun proyek nyata dari nol.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {isSupabaseConfigured ? (
                <button onClick={masukGoogle} className="bg-[var(--color-landing-cyan)] border-[3px] border-[var(--color-landing-black)] px-6 py-4 font-bungee text-lg shadow-[4px_4px_0_#111111] hover:shadow-[2px_2px_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-center">
                  MASUK DENGAN GOOGLE (GRATIS)
                </button>
              ) : (
                <a href="#modul" onClick={scrollToModul} className="bg-[var(--color-landing-cyan)] border-[3px] border-[var(--color-landing-black)] px-6 py-4 font-bungee text-lg shadow-[4px_4px_0_#111111] hover:shadow-[2px_2px_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-center inline-block">
                  MULAI BELAJAR
                </a>
              )}
              <a href="#modul" onClick={scrollToModul} className="bg-[var(--color-landing-black)] text-white border-[3px] border-[var(--color-landing-black)] px-6 py-4 font-bungee text-lg shadow-[4px_4px_0_var(--color-landing-cyan)] hover:shadow-[2px_2px_0_var(--color-landing-cyan)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-center inline-block">
                LIHAT MODUL
              </a>
            </div>
          </div>
          <div className="w-full lg:w-1/2 lg:flex-1 max-w-full relative aspect-video md:aspect-auto md:h-[400px] flex items-center justify-center shrink-0 mt-4 md:mt-0">
            <div className="w-full h-full relative">
              {/* Stacked Cards */}
              <div className="hidden md:block absolute inset-0 bg-white border-[3px] border-[var(--color-landing-black)] rotate-[-3deg] shadow-[4px_4px_0_#111111]"></div>
              <div className="hidden md:block absolute inset-0 bg-[var(--color-landing-card)] border-[3px] border-[var(--color-landing-black)] rotate-[2deg] shadow-[4px_4px_0_#111111]"></div>
              <div className="absolute inset-0 bg-white border-[3px] border-[var(--color-landing-black)] shadow-[4px_4px_0_#111111] flex items-center justify-center overflow-hidden">
                <img src={`${import.meta.env.BASE_URL}illustrations/hero.webp`} alt="Ilustrasi Belajar" loading="lazy" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Mengapa BisaNgoding? */}
      <section className="px-4 py-16 sm:px-8 max-w-7xl mx-auto">
        <h2 className="font-bungee text-3xl sm:text-4xl mb-12">
          <span className="inline" style={{ backgroundImage: 'linear-gradient(transparent 60%, var(--color-landing-purple) 60%)' }}>
            MENGAPA BISANGODING?
          </span>
        </h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div className="bg-[var(--color-landing-card)] border-[3px] border-[var(--color-landing-black)] shadow-[8px_8px_0_#111111] p-6 flex flex-col gap-4" style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)' }}>
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-[var(--color-landing-purple)]" strokeWidth={2} />
              <h3 className="font-bungee text-xl mt-1">MATERI BERCERITA</h3>
            </div>
            <p className="font-barlow text-[19px] font-medium text-gray-800">Setiap konsep dijelaskan lewat cerita dan kasus nyata, bukan hafalan definisi.</p>
          </div>
          <div className="bg-[var(--color-landing-card)] border-[3px] border-[var(--color-landing-black)] shadow-[8px_8px_0_#111111] p-6 flex flex-col gap-4" style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)' }}>
            <div className="flex items-center gap-3">
              <Code className="w-8 h-8 text-[var(--color-landing-purple)]" strokeWidth={2} />
              <h3 className="font-bungee text-xl mt-1">PRAKTIK DI BROWSER</h3>
            </div>
            <p className="font-barlow text-[19px] font-medium text-gray-800">Tulis dan jalankan kode Java langsung, tanpa install apa pun. Latihan dinilai otomatis.</p>
          </div>
          <div className="bg-[var(--color-landing-card)] border-[3px] border-[var(--color-landing-black)] shadow-[8px_8px_0_#111111] p-6 flex flex-col gap-4" style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)' }}>
            <div className="flex items-center gap-3">
              <Hammer className="w-8 h-8 text-[var(--color-landing-purple)]" strokeWidth={2} />
              <h3 className="font-bungee text-xl mt-1">PROYEK NYATA</h3>
            </div>
            <p className="font-barlow text-[19px] font-medium text-gray-800">Bangun aplikasi Todolist dan sistem perpustakaan dari nol, langkah demi langkah.</p>
          </div>
          <ComingSoon>
            <div className="bg-[var(--color-landing-card)] border-[3px] border-[var(--color-landing-black)] shadow-[8px_8px_0_#111111] p-6 flex flex-col gap-4 h-full" style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)' }}>
              <div className="flex items-center gap-3">
                <Lock className="w-8 h-8 text-gray-400" strokeWidth={2} />
                <h3 className="font-bungee text-xl mt-1 text-gray-500">MENTOR & KOMUNITAS</h3>
              </div>
              <p className="font-barlow text-[19px] font-medium text-gray-500">Diskusi dan tanya jawab bersama sesama pelajar.</p>
            </div>
          </ComingSoon>
        </div>
      </section>

      {/* 4. Modul Tersedia */}
      <section id="modul" className="px-4 py-16 sm:px-8 max-w-7xl mx-auto">
        <h2 className="font-bungee text-3xl sm:text-4xl mb-12">
          <span className="inline" style={{ backgroundImage: 'linear-gradient(transparent 60%, var(--color-landing-cyan) 60%)' }}>
            MODUL TERSEDIA
          </span>
        </h2>
        
        <div className="bg-[var(--color-landing-cyan)] border-[3px] border-[var(--color-landing-black)] shadow-[8px_8px_0_#111111] p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {modulesData.map(mod => {
              const lessons = getVisibleLessons(mod.id);
              const isReady = mod.status !== 'draft' && lessons.length > 0;
              
              if (!isReady) {
                return (
                  <ComingSoon key={mod.id}>
                    <div className="bg-gray-200 border-[3px] border-[var(--color-landing-black)] shadow-[4px_4px_0_#111111] h-full flex flex-col opacity-75">
                      <div className="h-32 bg-gray-300 border-b-[3px] border-[var(--color-landing-black)] flex items-center justify-center">
                        <Lock className="w-12 h-12 text-gray-500" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <h3 className="font-bungee text-lg leading-tight mb-2 text-gray-600">{mod.title}</h3>
                          <p className="font-barlow font-bold text-gray-500 text-sm">SEGERA HADIR</p>
                        </div>
                        <button disabled className="w-full bg-gray-400 text-white border-[3px] border-[var(--color-landing-black)] py-2 font-bungee text-sm">
                          BELUM TERSEDIA
                        </button>
                      </div>
                    </div>
                  </ComingSoon>
                );
              }

              return (
                <div key={mod.id} className="bg-[var(--color-landing-card)] border-[3px] border-[var(--color-landing-black)] shadow-[4px_4px_0_#111111] h-full flex flex-col bg-white hover:-translate-y-1 hover:shadow-[6px_6px_0_#111111] transition-all">
                  <div className="h-32 bg-[var(--color-landing-hero)] border-b-[3px] border-[var(--color-landing-black)] flex items-center justify-center p-4">
                    <span className="font-bungee text-4xl text-white drop-shadow-[2px_2px_0_#111]">{mod.order}</span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="font-bungee text-lg leading-tight mb-2">{mod.title}</h3>
                      <p className="font-barlow font-bold text-gray-600 text-sm">{lessons.length} pelajaran · Gratis</p>
                    </div>
                    {isSupabaseConfigured ? (
                      <button onClick={handleLoginClick} className="w-full bg-[var(--color-landing-black)] text-white border-[3px] border-[var(--color-landing-black)] py-2 font-bungee text-sm shadow-[2px_2px_0_var(--color-landing-cyan)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_var(--color-landing-cyan)] transition-all">
                        MULAI BELAJAR
                      </button>
                    ) : (
                      <Link to={`/module/${mod.id}`} className="w-full bg-[var(--color-landing-black)] text-white border-[3px] border-[var(--color-landing-black)] py-2 font-bungee text-sm shadow-[2px_2px_0_var(--color-landing-cyan)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_var(--color-landing-cyan)] transition-all text-center inline-block">
                        MULAI BELAJAR
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Cara Belajar */}
      <section id="cara-belajar" className="px-4 py-16 sm:px-8 max-w-7xl mx-auto relative">
        <h2 className="font-bungee text-3xl sm:text-4xl mb-12">
          <span className="inline" style={{ backgroundImage: 'linear-gradient(transparent 60%, var(--color-landing-magenta) 60%)' }}>
            CARA BELAJAR
          </span>
        </h2>

        <div className="grid md:grid-cols-3 gap-12 pt-8">
          {[
            { title: "Masuk dengan Google", desc: "Sekali klik, progresmu langsung tersimpan." },
            { title: "Baca ceritanya", desc: "Setiap pelajaran dimulai dari masalah nyata." },
            { title: "Tulis kodenya", desc: "Jalankan, lihat hasilnya, dan selesaikan tantangannya." }
          ].map((item, i) => (
            <div key={i} className="relative">
              <div className="absolute -top-8 -left-4 w-16 h-16 rounded-full bg-[var(--color-landing-hero)] border-[3px] border-[var(--color-landing-black)] flex items-center justify-center font-bungee text-3xl z-10 shadow-[4px_4px_0_#111]">
                {i + 1}
              </div>
              <div className="bg-[var(--color-landing-card)] border-[3px] border-[var(--color-landing-black)] shadow-[8px_8px_0_#111111] p-8 pt-10 relative">
                <h3 className="font-bungee text-xl mb-3">{item.title}</h3>
                <p className="font-barlow text-[19px] font-medium text-gray-800">{item.desc}</p>
                {/* Speech bubble tail */}
                <div className="absolute -bottom-[20px] left-8 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-[var(--color-landing-black)] border-r-[20px] border-r-transparent"></div>
                <div className="absolute -bottom-[14px] left-[34px] w-0 h-0 border-l-[16px] border-l-transparent border-t-[16px] border-t-[var(--color-landing-card)] border-r-[16px] border-r-transparent"></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Segera Hadir: Testimoni (Satu Kartu) */}
      <section className="px-4 py-16 sm:px-8 max-w-7xl mx-auto bg-[var(--color-landing-magenta)] border-y-[6px] border-[var(--color-landing-black)]">
        <h2 className="font-bungee text-3xl sm:text-4xl text-white mb-12" style={{ textShadow: '2px 2px 0 #111' }}>
          KATA MEREKA
        </h2>
        <div className="max-w-md mx-auto">
          <ComingSoon>
            <div className="bg-[var(--color-landing-card)] border-[3px] border-[var(--color-landing-black)] shadow-[8px_8px_0_#111111] p-8 relative">
              <h3 className="font-bungee text-xl mb-3 text-gray-500">Jadilah yang pertama berbagi cerita belajarmu di BisaNgoding</h3>
              <p className="font-barlow font-bold text-gray-400 mt-4 text-sm">SEGERA HADIR</p>
              {/* Speech bubble tail */}
              <div className="absolute -bottom-[20px] left-8 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-[var(--color-landing-black)] border-r-[20px] border-r-transparent"></div>
              <div className="absolute -bottom-[14px] left-[34px] w-0 h-0 border-l-[16px] border-l-transparent border-t-[16px] border-t-[var(--color-landing-card)] border-r-[16px] border-r-transparent"></div>
            </div>
          </ComingSoon>
        </div>
      </section>

      {/* 6. FAQ */}
      <section id="faq" className="px-4 py-16 sm:px-8 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-bungee text-3xl sm:text-4xl">
            <span className="inline" style={{ backgroundImage: 'linear-gradient(transparent 60%, var(--color-landing-hero) 60%)' }}>
              FAQ
            </span>
          </h2>
        </div>

        <div className="space-y-6">
          {[
            { q: "Apakah gratis?", a: "Ya, seluruh materi saat ini gratis." },
            { q: "Perlu install Java?", a: "Tidak. Kode dijalankan langsung di browser." },
            { q: "Bisa belajar di HP?", a: "Bisa. Progres tersimpan dan tersinkron antara HP dan laptop." },
            { q: "Kenapa harus login?", a: "Agar progres belajarmu tersimpan dan bisa dilanjutkan di perangkat lain." }
          ].map((faq, i) => (
            <details key={i} className="bg-[var(--color-landing-card)] border-[3px] border-[var(--color-landing-black)] shadow-[4px_4px_0_#111111] group [&_summary::-webkit-details-marker]:hidden">
              <summary className="font-bungee text-lg sm:text-xl p-5 cursor-pointer flex justify-between items-center list-none">
                {faq.q}
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 pt-0 font-barlow text-[19px] font-medium text-gray-800 border-t-[3px] border-[var(--color-landing-black)] mt-1">
                <p className="mt-4">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* 7. CTA Penutup */}
      <section className="px-4 py-16 sm:px-8 bg-[var(--color-landing-cyan)] border-y-[6px] border-[var(--color-landing-black)] text-center">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <h2 className="font-bungee text-3xl md:text-4xl leading-tight text-left md:w-1/2">
            TUNGGU APA LAGI?<br/>MULAI SEKARANG!
          </h2>
          {isSupabaseConfigured ? (
            <button onClick={handleLoginClick} className="w-full md:w-auto bg-white text-[var(--color-landing-black)] border-[3px] border-[var(--color-landing-black)] px-8 py-5 font-bungee text-xl shadow-[6px_6px_0_#111111] hover:shadow-[2px_2px_0_#111111] hover:translate-x-[4px] hover:translate-y-[4px] transition-all whitespace-nowrap">
              MASUK DENGAN GOOGLE
            </button>
          ) : (
            <Link to="/module/java-dasar" className="w-full md:w-auto bg-white text-[var(--color-landing-black)] border-[3px] border-[var(--color-landing-black)] px-8 py-5 font-bungee text-xl shadow-[6px_6px_0_#111111] hover:shadow-[2px_2px_0_#111111] hover:translate-x-[4px] hover:translate-y-[4px] transition-all whitespace-nowrap inline-block">
              MULAI BELAJAR
            </Link>
          )}
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-[var(--color-landing-black)] text-white px-4 py-12 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8 border-b border-gray-800 pb-8 mb-8">
          <div className="text-3xl font-bungee text-[var(--color-landing-cyan)] text-center md:text-left">
            BisaNgoding.com
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 font-barlow font-bold text-lg">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[var(--color-landing-cyan)] transition-colors">Beranda</a>
            <a href="#modul" onClick={scrollToModul} className="hover:text-[var(--color-landing-cyan)] transition-colors">Modul</a>
            <a href="#faq" onClick={scrollToFAQ} className="hover:text-[var(--color-landing-cyan)] transition-colors">FAQ</a>
            <a href="#" className="hover:text-[var(--color-landing-cyan)] transition-colors cursor-not-allowed opacity-50" onClick={e => e.preventDefault()}>Kebijakan Privasi</a>
            <a href="#" className="hover:text-[var(--color-landing-cyan)] transition-colors cursor-not-allowed opacity-50" onClick={e => e.preventDefault()}>Ketentuan Layanan</a>
          </div>
        </div>
        <div className="text-center font-barlow text-gray-400">
          © 2026 BisaNgoding. Dibuat untuk belajar.
        </div>
      </footer>
    </div>
  );
}