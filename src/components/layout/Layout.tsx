import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, User, LogIn, LogOut, Award, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { ComingSoon } from '../ComingSoon';

export default function Layout() {
  const location = useLocation();
  const { user, masukGoogle, keluar, isSupabaseConfigured } = useAuth();
  const { syncStatus } = useProgress();

  const navItems = [
    { path: '/', label: 'Belajar', icon: BookOpen },
    { path: '/profile', label: 'Profil', icon: User },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-main)] pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-64 relative z-0">
      {/* Background Blob */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[-1] opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15vw" cy="20vh" r="30vw" fill="var(--color-primary)" />
        <circle cx="85vw" cy="80vh" r="25vw" fill="var(--color-accent)" />
      </svg>
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white brutal-border border-l-0 border-y-0 z-10">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-extrabold text-[var(--color-primary)] drop-shadow-[2px_2px_0_#1A1A1A]">BisaNgoding.com</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${
                  isActive ? 'brutal-card !bg-[var(--color-accent)] scale-[1.02] text-[var(--color-text-main)]' : 'text-gray-600 hover:bg-[var(--color-bg-base)]'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
          
          <ComingSoon>
            <div className="flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-gray-400">
              <Award className="w-5 h-5" />
              Sertifikat
            </div>
          </ComingSoon>
          <ComingSoon>
            <div className="flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-gray-400">
              <Users className="w-5 h-5" />
              Komunitas
            </div>
          </ComingSoon>

        </nav>
        <div className="p-4 mt-auto w-full flex flex-col items-center gap-4">
          {isSupabaseConfigured && (
            <div className="w-full">
              {user ? (
                <div className="flex flex-col gap-2 p-3 brutal-card rounded-xl bg-green-100 text-sm w-full">
                  <div className="flex items-center gap-2">
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-8 h-8 rounded-full brutal-border" />
                    <div className="truncate font-bold" title={user.email}>{user.email}</div>
                  </div>
                  <div className="text-xs text-gray-600">{syncStatus}</div>
                  <button onClick={keluar} className="flex items-center justify-center gap-2 mt-2 w-full brutal-btn !bg-red-400 !text-white !p-2 !text-sm">
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </div>
              ) : (
                <button onClick={masukGoogle} className="flex items-center justify-center gap-2 w-full brutal-btn !bg-[var(--color-primary)] !text-white !p-3">
                  <LogIn className="w-5 h-5" /> Masuk Google
                </button>
              )}
            </div>
          )}

          <div className="brutal-card rounded-xl bg-[var(--color-bg-base)] p-3 overflow-hidden w-full max-w-[180px]">
            <img 
              src={`${import.meta.env.BASE_URL}illustrations/undraw_programming_j1zw.svg`} 
              alt="" 
              aria-hidden="true" 
              loading="lazy" 
              className="pointer-events-none w-full max-w-[180px]"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto z-10">
        <div className="w-full max-w-[100vw] mx-auto px-6 py-6 md:max-w-5xl md:px-10 md:py-8 lg:px-12">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[2px] border-[var(--color-text-main)] flex justify-around p-2 z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] min-h-[64px]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-lg text-xs font-medium transition-colors ${
                isActive ? 'text-[var(--color-primary)] scale-110 drop-shadow-[1px_1px_0_#1A1A1A]' : 'text-gray-500'
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
