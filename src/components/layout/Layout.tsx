import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  User,
  LogIn,
  Award,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { ComingSoon } from '../ComingSoon';
import { LogoIcon } from '../ui/LogoIcon';
import CourseOutline from './CourseOutline';
import { useState } from 'react';

export default function Layout() {
  const location = useLocation();
  const { user, masukGoogle, isSupabaseConfigured } = useAuth();
  const { syncStatus } = useProgress();
  const [sedangMasuk, setSedangMasuk] = useState(false);

  const navItems = [
    { path: '/', label: 'Belajar', icon: BookOpen },
    { path: '/profile', label: 'Profil', icon: User },
  ];

  const handleMasuk = async () => {
    setSedangMasuk(true);
    try {
      await masukGoogle();
    } catch (e) {
      alert('Gagal masuk. Silakan coba lagi.');
      setSedangMasuk(false);
    }
  };

  const showPanel = location.pathname.startsWith('/kelas/') || location.pathname.startsWith('/module/');

  return (
    <div className={`flex flex-col min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-main)] pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 relative z-0 ${showPanel ? 'lg:pl-[352px] md:pl-[72px]' : 'md:pl-[72px]'}`}>
      
      {/* Permanent Panel (Desktop >= 1024px) */}
      {showPanel && (
        <div className="hidden lg:block fixed inset-y-0 left-[72px] w-[280px] bg-white border-r-[3px] border-[var(--color-text-main)] z-10">
          <CourseOutline />
        </div>
      )}

      {/* Sidebar (Rail) for Desktop/Tablet */}
      <aside className="hidden md:flex flex-col w-[72px] items-center fixed inset-y-0 left-0 bg-white brutal-border-3 border-l-0 border-y-0 z-20 py-5">
        <div className="mb-6 shrink-0">
          <LogoIcon size={40} />
        </div>
        <nav className="flex-1 flex flex-col items-center w-full space-y-3 px-3">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                aria-label={item.label}
                className={`flex items-center justify-center rounded-xl transition-all w-11 h-11 shrink-0 ${
                  isActive
                    ? 'bg-[var(--color-primary)] border-2 border-[var(--color-text-main)] shadow-[3px_3px_0_var(--color-text-main)] text-[var(--color-text-main)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-base)]'
                }`}
              >
                <item.icon
                  className="w-6 h-6"
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </Link>
            );
          })}

          <div className="pt-2 flex flex-col items-center w-full space-y-3">
            <div className="flex justify-center w-full">
              <ComingSoon inline text="SOON">
                <div 
                  title="Sertifikat — segera hadir"
                  className="flex relative items-center justify-center w-11 h-11 opacity-50 text-[var(--color-text-secondary)]"
                >
                  <Award className="w-6 h-6" />
                  <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full border border-black"></div>
                </div>
              </ComingSoon>
            </div>
            
            <div className="flex justify-center w-full">
              <ComingSoon inline text="SOON">
                <div 
                  title="Komunitas — segera hadir"
                  className="flex relative items-center justify-center w-11 h-11 opacity-50 text-[var(--color-text-secondary)]"
                >
                  <Users className="w-6 h-6" />
                  <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full border border-black"></div>
                </div>
              </ComingSoon>
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-4 shrink-0 px-3 w-full flex flex-col items-center">
          {isSupabaseConfigured && (
            <div className="relative">
              {user ? (
                <Link to="/profile" className="block relative group" title="Profil">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      className="w-10 h-10 rounded-full brutal-border shrink-0 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full brutal-border bg-[var(--color-primary)] flex items-center justify-center font-space text-lg shrink-0">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Status sync dot */}
                  <div 
                    title={syncStatus === 'Tersimpan' ? 'Progres tersinkron ke akun Google' : syncStatus}
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      syncStatus === 'Tersimpan' ? 'bg-[var(--color-success)]' :
                      syncStatus === 'Menyimpan...' ? 'bg-blue-500 animate-pulse' :
                      'bg-[var(--color-danger)]'
                    }`}
                  />
                </Link>
              ) : (
                <button
                  onClick={handleMasuk}
                  disabled={sedangMasuk}
                  title="Masuk Google"
                  className="flex items-center justify-center w-11 h-11 bg-[var(--color-accent)] border-2 border-[var(--color-text-main)] text-white rounded-full shadow-[2px_2px_0_var(--color-text-main)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_var(--color-text-main)] transition-all disabled:opacity-75 disabled:cursor-wait"
                >
                  <LogIn className="w-5 h-5 ml-1" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Header for Mobile */}
      <header className="md:hidden bg-white border-b-[3px] border-[var(--color-text-main)] p-3 px-4 flex items-center justify-between sticky top-0 z-40">
        <LogoIcon size={32} />
        
        {user ? (
          <Link to="/profile" className="block relative group" title="Profil">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-9 h-9 rounded-full border-2 border-[var(--color-text-main)]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full border-2 border-[var(--color-text-main)] bg-[var(--color-primary)] flex items-center justify-center font-space text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div 
              title={syncStatus === 'Tersimpan' ? 'Progres tersinkron ke akun Google' : syncStatus}
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-[1.5px] border-white ${
                syncStatus === 'Tersimpan' ? 'bg-[var(--color-success)]' :
                syncStatus === 'Menyimpan...' ? 'bg-blue-500 animate-pulse' :
                'bg-[var(--color-danger)]'
              }`}
            />
          </Link>
        ) : (
          <button
            onClick={handleMasuk}
            disabled={sedangMasuk}
            className="text-sm font-bold bg-[var(--color-accent)] text-white px-3 py-1.5 rounded-lg border-2 border-[var(--color-text-main)] shadow-[2px_2px_0_var(--color-text-main)] disabled:opacity-75 disabled:cursor-wait"
          >
            {sedangMasuk ? 'Membuka...' : 'Masuk'}
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto z-0 w-full max-w-full">
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[3px] border-[var(--color-text-main)] flex justify-around p-2 z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] min-h-[64px]">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-2 rounded-lg text-[11px] font-bold transition-colors w-16 h-14 ${
                isActive
                  ? 'bg-[var(--color-primary)] border-2 border-[var(--color-text-main)] shadow-[2px_2px_0_var(--color-text-main)] text-[var(--color-text-main)]'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              <item.icon
                className="w-6 h-6 mb-1"
                strokeWidth={isActive ? 2.5 : 2}
              />
              {item.label}
            </Link>
          );
        })}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg text-[11px] font-bold text-gray-400 w-16 h-14 relative opacity-60">
          <div className="relative">
            <Award className="w-6 h-6 mb-1" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border border-black"></div>
          </div>
          Sertifikat
        </div>
        <div className="flex flex-col items-center justify-center p-2 rounded-lg text-[11px] font-bold text-gray-400 w-16 h-14 relative opacity-60">
          <div className="relative">
            <Users className="w-6 h-6 mb-1" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border border-black"></div>
          </div>
          Komunitas
        </div>
      </nav>
    </div>
  );
}