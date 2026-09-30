import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Ikon, type NamaIkon } from '../ui/IkonDesain';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { bersihkanProgresLokal } from '../../lib/cloudProgress';
import { cari, type HasilCari } from '../../lib/pencarian';
import { useNotifikasi } from '../../lib/useNotifikasi';
import type { Notifikasi } from '../../lib/notifikasi';

const NAV = [
  { to: '/', label: 'Beranda' },
  { to: '/kelas', label: 'Kelas' },
  { to: '/jalur', label: 'Jalur Karier' },
];

function navAktif(to: string, pathname: string): boolean {
  if (to === '/') return pathname === '/';
  if (to === '/kelas') return pathname === '/kelas' || pathname.startsWith('/kelas/') || pathname.startsWith('/module/');
  return pathname === to || pathname.startsWith(to + '/');
}

const formatAngka = (n: number) => n.toLocaleString('id-ID');

/* ───────────────────────── identitas pengguna */
function usePengguna() {
  const { user } = useAuth();
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const email = user?.email ?? '';
  const nama = meta.full_name || meta.name || (email ? email.split('@')[0] : 'Pengguna');
  const avatar = meta.avatar_url || meta.picture || '';
  const inisial = (nama.trim().charAt(0) || 'P').toUpperCase();
  return { nama, email, avatar, inisial };
}

export function Avatar({ ukuran }: { ukuran: number }) {
  const { avatar, inisial } = usePengguna();
  const gaya = { width: ukuran, height: ukuran };
  if (avatar) {
    return (
      <img
        src={avatar}
        alt=""
        referrerPolicy="no-referrer"
        style={gaya}
        className="rounded-full border-2 border-[var(--color-text-main)] object-cover shrink-0"
      />
    );
  }
  return (
    <span
      style={gaya}
      className="rounded-full border-2 border-[var(--color-text-main)] bg-[var(--color-purple-light)] flex items-center justify-center font-space font-bold shrink-0"
    >
      {inisial}
    </span>
  );
}

/* ───────────────────────── keluar (sama dengan halaman Profil) */
export function useKeluar() {
  const { user, keluar } = useAuth();
  const { flushKeCloud } = useProgress();
  const navigate = useNavigate();
  return async () => {
    const tersimpan = await flushKeCloud();
    if (tersimpan) {
      bersihkanProgresLokal(user?.id);
    } else if (!window.confirm('Progres terbaru belum tersimpan ke akun. Tetap keluar?')) {
      return;
    }
    await keluar();
    navigate('/', { replace: true });
  };
}

/* ───────────────────────── kotak cari */
const LABEL_JENIS: Record<HasilCari['jenis'], string> = { kelas: 'KELAS', modul: 'MODUL', materi: 'MATERI' };

function KotakCari({ lebar, otomatisFokus = false, onPilih }: { lebar: string; otomatisFokus?: boolean; onPilih?: () => void }) {
  const [kueri, setKueri] = useState('');
  const [buka, setBuka] = useState(false);
  const [aktif, setAktif] = useState(0);
  const navigate = useNavigate();
  const wadah = useRef<HTMLDivElement>(null);
  const hasil = cari(kueri);

  useEffect(() => {
    const klikLuar = (e: MouseEvent) => {
      if (wadah.current && !wadah.current.contains(e.target as Node)) setBuka(false);
    };
    document.addEventListener('mousedown', klikLuar);
    return () => document.removeEventListener('mousedown', klikLuar);
  }, []);

  const pilih = (h: HasilCari) => {
    setKueri('');
    setBuka(false);
    onPilih?.();
    navigate(h.url);
  };

  return (
    <div ref={wadah} className={`relative ${lebar}`}>
      <label className="flex items-center gap-2 h-11 px-3.5 border-2 border-[var(--color-text-main)] rounded-[10px] bg-white">
        <Ikon nama="search" ukuran={18} warna="#5a5a5a" />
        <input
          type="search"
          value={kueri}
          autoFocus={otomatisFokus}
          onChange={(e) => {
            setKueri(e.target.value);
            setBuka(true);
            setAktif(0);
          }}
          onFocus={() => setBuka(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setAktif((a) => Math.min(a + 1, Math.max(hasil.length - 1, 0)));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setAktif((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter' && hasil[aktif]) {
              e.preventDefault();
              pilih(hasil[aktif]);
            } else if (e.key === 'Escape') {
              setBuka(false);
            }
          }}
          placeholder="Cari materi atau kelas…"
          aria-label="Cari materi atau kelas"
          className="w-full bg-transparent outline-none border-0 text-[15px] text-[var(--color-text-main)] placeholder:text-[#8a857a]"
        />
      </label>
      {buka && kueri.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 min-w-[320px] border-[3px] border-[var(--color-text-main)] rounded-[14px] bg-white shadow-[6px_6px_0_var(--color-text-main)] overflow-hidden">
          {hasil.length === 0 ? (
            <div className="px-4 py-3 text-[14px] text-[#5a5a5a]">Tidak ada kelas atau materi yang cocok.</div>
          ) : (
            <ul role="listbox" aria-label="Hasil pencarian">
              {hasil.map((h, i) => (
                <li key={`${h.jenis}-${h.id}`} role="option" aria-selected={i === aktif}>
                  <button
                    type="button"
                    onMouseEnter={() => setAktif(i)}
                    onClick={() => pilih(h)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-2.5 border-t border-[#d9d3c6] first:border-t-0 ${i === aktif ? 'bg-[var(--color-primary-light)]' : 'bg-white'}`}
                  >
                    <span className="mt-0.5 shrink-0 font-mono text-[10px] font-bold px-1.5 py-0.5 border border-[var(--color-text-main)] rounded">
                      {LABEL_JENIS[h.jenis]}
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="text-[15px] font-semibold leading-5 truncate">{h.judul}</span>
                      <span className="text-[13px] text-[#5a5a5a] truncate">{h.induk}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── isi dropdown profil & laci */
export function KartuPengguna() {
  const { nama, email } = usePengguna();
  return (
    <div className="flex items-center gap-3 p-4">
      <Avatar ukuran={48} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-space font-bold text-[17px] truncate">{nama}</span>
        <span className="text-[13px] text-[#5a5a5a] truncate">{email}</span>
      </div>
    </div>
  );
}

export function KotakStreakXp({ ringkas = false }: { ringkas?: boolean }) {
  const { progress } = useProgress();
  return (
    <div className={`mx-4 ${ringkas ? 'mb-3' : 'mb-2.5'} px-3 py-2.5 bg-[var(--color-primary-light)] border-2 border-[var(--color-text-main)] rounded-[10px] flex justify-between text-[14px]`}>
      <span className="flex items-center gap-1.5">
        <Ikon nama="flame" ukuran={16} warna="var(--color-streak)" />
        <b>{progress.streak} hari</b>
        {!ringkas && ' streak'}
      </span>
      <span>
        <b>{formatAngka(progress.xp)}</b> XP
      </span>
    </div>
  );
}

export const Garis = () => <div className="h-[2px] bg-[var(--color-text-main)] my-1.5" />;

export function ItemMenu({ to, ikon, teks, segera, bahaya, onClick }: {
  to?: string;
  ikon: NamaIkon;
  teks: string;
  segera?: boolean;
  bahaya?: boolean;
  onClick?: () => void;
}) {
  const kelas = `flex items-center gap-3 min-h-[48px] px-4 w-full text-left text-[16px] font-semibold ${bahaya ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-main)]'} hover:bg-[var(--color-bg-base)]`;
  const isi = (
    <>
      <Ikon nama={ikon} ukuran={20} />
      {teks}
      {segera && (
        <span className="ml-auto px-2 py-0.5 border-2 border-[var(--color-text-main)] rounded-md bg-[var(--color-purple-light)] font-mono text-[11px] font-bold">
          SEGERA
        </span>
      )}
    </>
  );
  if (segera) {
    return (
      <div role="menuitem" aria-disabled="true" className={`${kelas} cursor-default`}>
        {isi}
      </div>
    );
  }
  if (to) {
    return (
      <Link role="menuitem" to={to} className={kelas} onClick={onClick}>
        {isi}
      </Link>
    );
  }
  return (
    <button role="menuitem" type="button" className={kelas} onClick={onClick}>
      {isi}
    </button>
  );
}

export function MenuAkun() {
  return (
    <>
      <ItemMenu to="/profile" ikon="user" teks="Profil saya" />
      <ItemMenu to="/profile" ikon="chart" teks="Progres belajar" />
      <ItemMenu ikon="award" teks="Sertifikat" segera />
      <ItemMenu to="/profile" ikon="gear" teks="Pengaturan" />
    </>
  );
}

/* ───────────────────────── notifikasi */
export function DaftarNotifikasi({ daftar, dibaca, onBuka }: { daftar: Notifikasi[]; dibaca: string[]; onBuka: (n: Notifikasi) => void }) {
  if (daftar.length === 0) {
    return <div className="px-4 py-6 text-[15px] text-[#5a5a5a] border-t border-[#d9d3c6]">Belum ada notifikasi.</div>;
  }
  return (
    <ul>
      {daftar.map((n) => {
        const baru = !dibaca.includes(n.id);
        const isi = (
          <>
            {baru ? (
              <span className="w-2.5 h-2.5 shrink-0 mt-1.5 rounded-full bg-[var(--color-landing-magenta)] border-2 border-[var(--color-text-main)] box-content" />
            ) : (
              <span className="w-2.5 shrink-0" />
            )}
            <span className="flex flex-col gap-1 min-w-0">
              <span className={`text-[15px] leading-[21px] ${baru ? 'font-bold' : 'font-medium'}`}>{n.judul}</span>
              <span className="text-[14px] leading-5 text-[#3d3d3d]">{n.isi}</span>
              <span className="font-mono text-[12px] text-[#5a5a5a]">{n.waktu}</span>
            </span>
          </>
        );
        const kelas = `flex gap-3 px-4 py-3.5 border-t border-[#d9d3c6] w-full text-left ${baru ? 'bg-[#fffaf0]' : 'bg-white'}`;
        return (
          <li key={n.id}>
            {n.url ? (
              <Link to={n.url} className={kelas} onClick={() => onBuka(n)}>
                {isi}
              </Link>
            ) : (
              <button type="button" className={kelas} onClick={() => onBuka(n)}>
                {isi}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function PanelNotifikasi({ className, batas = 5 }: { className: string; batas?: number }) {
  const { daftar, dibaca, tandaiDibaca, tandaiSemua } = useNotifikasi();
  return (
    <div role="dialog" aria-label="Notifikasi" className={`z-50 leading-[normal] border-[3px] border-[var(--color-text-main)] rounded-[14px] bg-white shadow-[8px_8px_0_var(--color-text-main)] overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="font-space text-[20px] font-bold">Notifikasi</span>
        {daftar.length > 0 && (
          <button type="button" onClick={tandaiSemua} className="text-[14px] font-semibold underline">
            Tandai semua dibaca
          </button>
        )}
      </div>
      <DaftarNotifikasi daftar={daftar.slice(0, batas)} dibaca={dibaca} onBuka={(n) => tandaiDibaca(n.id)} />
      <Link to="/notifikasi" className="block px-4 py-3.5 border-t-2 border-[var(--color-text-main)] text-center font-bold text-[15px] underline text-[var(--color-text-main)]">
        Lihat semua notifikasi
      </Link>
    </div>
  );
}

function TombolNotifikasi({ onClick, ukuran }: { onClick: () => void; ukuran: 'besar' | 'kecil' }) {
  const { belumDibaca } = useNotifikasi();
  const label = belumDibaca > 0 ? `Notifikasi, ${belumDibaca} belum dibaca` : 'Notifikasi';
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative w-11 h-11 shrink-0 border-2 border-[var(--color-text-main)] rounded-[10px] bg-white flex items-center justify-center"
    >
      <Ikon nama="bell" ukuran={ukuran === 'besar' ? 22 : 20} />
      {belumDibaca > 0 && (
        <span
          className={`absolute ${ukuran === 'besar' ? '-top-[7px] -right-[7px] min-w-5 h-5 px-[5px] text-[11px] leading-4' : '-top-1.5 -right-1.5 w-[18px] h-[18px] text-[10px] leading-[14px]'} border-2 border-[var(--color-text-main)] rounded-full bg-[var(--color-landing-magenta)] font-bold text-center box-border`}
        >
          {belumDibaca > 9 ? '9+' : belumDibaca}
        </span>
      )}
    </button>
  );
}

/* ───────────────────────── menu atas */
export default function MenuAtas() {
  const { pathname } = useLocation();
  const { progress } = useProgress();
  const keluarAman = useKeluar();
  const [panel, setPanel] = useState<'profil' | 'notif' | 'cari' | null>(null);
  const [laci, setLaci] = useState(false);
  const [notifHp, setNotifHp] = useState(false);
  const wadahPanel = useRef<HTMLDivElement>(null);

  // Tutup semua panel saat pindah halaman.
  useEffect(() => {
    setPanel(null);
    setLaci(false);
    setNotifHp(false);
  }, [pathname]);

  // Esc dan klik di luar menutup panel.
  useEffect(() => {
    const tombol = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPanel(null);
        setLaci(false);
        setNotifHp(false);
      }
    };
    const klik = (e: MouseEvent) => {
      if (wadahPanel.current && !wadahPanel.current.contains(e.target as Node)) setPanel(null);
    };
    document.addEventListener('keydown', tombol);
    document.addEventListener('mousedown', klik);
    return () => {
      document.removeEventListener('keydown', tombol);
      document.removeEventListener('mousedown', klik);
    };
  }, []);

  // Kunci scroll halaman saat laci terbuka.
  useEffect(() => {
    if (!laci) return;
    const lama = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = lama;
    };
  }, [laci]);

  const ganti = (p: 'profil' | 'notif' | 'cari') => setPanel((lama) => (lama === p ? null : p));
  const keluar = () => {
    setPanel(null);
    setLaci(false);
    void keluarAman();
  };

  return (
    <>
      {/* ── Desktop (≥1024px) */}
      <header className="leading-[normal] hidden lg:flex sticky top-0 z-40 h-[76px] shrink-0 items-center gap-6 px-8 xl:px-12 bg-[var(--color-bg-base)] border-b-[5px] border-[var(--color-landing-cyan)]">
        <Link to="/" aria-label="BisaNgoding - Beranda" className="font-bungee text-[22px] leading-[30px] px-1.5 bg-[var(--color-primary)] text-[var(--color-text-main)] shrink-0 no-underline">
          BISANGODING.COM
        </Link>
        <nav aria-label="Menu utama" className="flex items-center gap-1">
          {NAV.map((n) => {
            const aktif = navAktif(n.to, pathname);
            return (
              <Link
                key={n.to}
                to={n.to}
                aria-current={aktif ? 'page' : undefined}
                className={`font-space font-bold text-[16px] px-3 py-2 rounded-lg border-2 no-underline text-[var(--color-text-main)] ${aktif ? 'bg-[var(--color-primary)] border-[var(--color-text-main)]' : 'border-transparent hover:border-[var(--color-text-main)]'}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex-1" />
        <div ref={wadahPanel} className="flex items-center gap-2.5">
          <KotakCari lebar="hidden xl:block w-[300px]" />
          <div className="relative xl:hidden">
            <button
              type="button"
              aria-label="Cari materi atau kelas"
              onClick={() => ganti('cari')}
              className="w-11 h-11 border-2 border-[var(--color-text-main)] rounded-[10px] bg-white flex items-center justify-center"
            >
              <Ikon nama="search" ukuran={20} />
            </button>
            {panel === 'cari' && (
              <div className="absolute right-0 top-[70px] w-[360px] z-50">
                <KotakCari lebar="w-full" otomatisFokus onPilih={() => setPanel(null)} />
              </div>
            )}
          </div>
          <div title="Streak belajar" className="flex items-center gap-1.5 h-11 px-3 border-2 border-[var(--color-text-main)] rounded-[10px] bg-[var(--color-streak-bg)] font-space font-bold">
            <Ikon nama="flame" ukuran={20} warna="var(--color-streak)" />
            {progress.streak}
          </div>
          <div title="XP" className="hidden xl:flex items-center gap-1.5 h-11 px-3 border-2 border-[var(--color-text-main)] rounded-[10px] bg-[var(--color-primary-light)] font-space font-bold">
            <Ikon nama="star" ukuran={18} />
            {formatAngka(progress.xp)} XP
          </div>
          <div className="relative">
            <TombolNotifikasi ukuran="besar" onClick={() => ganti('notif')} />
            {panel === 'notif' && <PanelNotifikasi className="absolute -right-3 top-[70px] w-[400px]" />}
          </div>
          <div className="relative">
            <button
              type="button"
              aria-label="Menu profil"
              aria-haspopup="menu"
              aria-expanded={panel === 'profil'}
              onClick={() => ganti('profil')}
              className="flex items-center gap-1.5 h-11 pl-1 pr-2 border-2 border-[var(--color-text-main)] rounded-full bg-white"
            >
              <Avatar ukuran={34} />
              <Ikon nama="down" ukuran={18} />
            </button>
            {panel === 'profil' && (
              <div role="menu" aria-label="Menu profil" className="leading-[normal] absolute right-0 top-[70px] w-80 z-50 border-[3px] border-[var(--color-text-main)] rounded-[14px] bg-white shadow-[8px_8px_0_var(--color-text-main)] py-1.5">
                <KartuPengguna />
                <KotakStreakXp />
                <Garis />
                <MenuAkun />
                <Garis />
                <ItemMenu ikon="logout" teks="Keluar" bahaya onClick={keluar} />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── HP dan tablet (<1024px) */}
      <header className="leading-[normal] lg:hidden sticky top-0 z-40 h-[60px] shrink-0 flex items-center gap-2 px-3 bg-[var(--color-bg-base)] border-b-4 border-[var(--color-landing-cyan)]">
        <button
          type="button"
          aria-label="Buka menu"
          aria-expanded={laci}
          onClick={() => setLaci(true)}
          className="w-11 h-11 shrink-0 border-2 border-[var(--color-text-main)] rounded-[10px] bg-white flex items-center justify-center"
        >
          <Ikon nama="menu" ukuran={22} />
        </button>
        <Link to="/" aria-label="BisaNgoding - Beranda" className="font-bungee text-[15px] px-1 bg-[var(--color-primary)] text-[var(--color-text-main)] no-underline">
          BISANGODING
        </Link>
        <div className="flex-1" />
        <div title="Streak belajar" className="flex items-center gap-1 h-9 px-2 border-2 border-[var(--color-text-main)] rounded-lg bg-[var(--color-streak-bg)] font-space font-bold text-[14px]">
          <Ikon nama="flame" ukuran={16} warna="var(--color-streak)" />
          {progress.streak}
        </div>
        <TombolNotifikasi ukuran="kecil" onClick={() => setNotifHp((b) => !b)} />
      </header>

      {notifHp && (
        <div className="lg:hidden fixed inset-x-0 top-[60px] bottom-0 z-40 bg-black/50" onClick={() => setNotifHp(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <PanelNotifikasi className="mx-3 mt-3 max-h-[calc(100vh-96px)] overflow-y-auto" batas={20} />
          </div>
        </div>
      )}

      {laci && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setLaci(false)} />
          <nav aria-label="Menu" className="leading-[normal] absolute inset-y-0 left-0 w-[310px] max-w-[85vw] bg-white border-r-[3px] border-[var(--color-text-main)] flex flex-col py-2 overflow-y-auto">
            <div className="flex items-center justify-between pl-4 pr-3 py-2">
              <span className="font-bungee text-[15px] px-1 bg-[var(--color-primary)]">BISANGODING</span>
              <button
                type="button"
                aria-label="Tutup menu"
                onClick={() => setLaci(false)}
                className="w-11 h-11 border-2 border-[var(--color-text-main)] rounded-[10px] bg-white flex items-center justify-center"
              >
                <Ikon nama="close" ukuran={20} />
              </button>
            </div>
            <KartuPengguna />
            <KotakStreakXp ringkas />
            <div className="mx-4 mb-3">
              <KotakCari lebar="w-full" onPilih={() => setLaci(false)} />
            </div>
            {NAV.map((n) => {
              const aktif = navAktif(n.to, pathname);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-current={aktif ? 'page' : undefined}
                  className={`flex items-center min-h-[52px] px-3.5 mx-2.5 rounded-[10px] border-2 font-space font-bold text-[17px] no-underline text-[var(--color-text-main)] ${aktif ? 'bg-[var(--color-primary)] border-[var(--color-text-main)]' : 'border-transparent'}`}
                >
                  {n.label}
                </Link>
              );
            })}
            <Garis />
            <MenuAkun />
            <div className="flex-1" />
            <ItemMenu ikon="logout" teks="Keluar" bahaya onClick={keluar} />
          </nav>
        </div>
      )}
    </>
  );
}
