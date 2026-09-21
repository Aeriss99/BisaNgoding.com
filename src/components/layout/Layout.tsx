import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, User, LogIn, LogOut, Award, Users, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
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
      {/* Sidebar for Desktop / Top Header for Mobile */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white brutal-border-3 border-l-0 border-y-0 z-10">
        <div className="p-5 border-b-2 border-[var(--color-text-main)] flex items-center gap-3">
          <div className="w-8 h-8 shrink-0 bg-[var(--color-accent)] border-2 border-[var(--color-text-main)] flex items-center justify-center text-white font-mono font-bold text-lg shadow-[2px_2px_0_var(--color-text-main)]">
            {'{ }'}
          </div>
          <h1 className="text-xl font-space">BisaNgoding</h1>
        </div>
        <nav className="flex-1 p-4 space-y-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${
                  isActive 
                    ? 'bg-[var(--color-primary)] border-2 border-[var(--color-text-main)] shadow-[4px_4px_0_var(--color-text-main)] text-[var(--color-text-main)]' 
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-base)]'
                }`}
              >
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
          
          <div className="pt-2 space-y-3">
            <div className="w-full flex">
              <ComingSoon inline text="SOON">
                <div className="flex items-center gap-3 p-3 font-bold text-[var(--color-text-secondary)]">
                  <Award className="w-5 h-5" />
                  <span>Sertifikat</span>
                </div>
              </ComingSoon>
            </div>
            <div className="w-full flex">
              <ComingSoon inline text="SOON">
                <div className="flex items-center gap-3 p-3 font-bold text-[var(--color-text-secondary)]">
                  <Users className="w-5 h-5" />
                  <span>Komunitas</span>
                </div>
              </ComingSoon>
            </div>
          </div>
        </nav>
        
        <div className="p-4 mt-auto border-t-2 border-[var(--color-text-main)]">
          {isSupabaseConfigured && (
            <div className="w-full">
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Profile" className="w-10 h-10 rounded-full brutal-border shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full brutal-border bg-[var(--color-primary)] flex items-center justify-center font-space text-lg shrink-0">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-space text-sm truncate">{user.user_metadata?.full_name || 'Pelajar'}</div>
                      <div className="text-xs text-[var(--color-text-secondary)] truncate" title={user.email}>{user.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-1.5 text-xs text-[var(--color-text-secondary)] font-medium">
                    {syncStatus === 'Tersimpan' && <CheckCircle className="w-4 h-4 text-[var(--color-success)] shrink-0" />}
                    {syncStatus === 'Menyimpan...' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin shrink-0" />}
                    {syncStatus === 'Offline, tersimpan di perangkat ini' && <XCircle className="w-4 h-4 text-[var(--color-danger)] shrink-0" />}
                    <span>{syncStatus === 'Tersimpan' ? 'Progres tersinkron ke akun Google' : syncStatus}</span>
                  </div>
                  
                  <button onClick={keluar} className="flex items-center justify-center gap-2 mt-1 w-full border-2 border-[var(--color-text-main)] bg-white text-[var(--color-danger)] py-2 rounded-lg font-bold shadow-[3px_3px_0_var(--color-text-main)] hover:shadow-[1px_1px_0_var(--color-text-main)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm">
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </div>
              ) : (
                <button onClick={masukGoogle} className="flex items-center justify-center gap-2 w-full bg-[var(--color-accent)] border-2 border-[var(--color-text-main)] text-white p-3 rounded-xl font-bold shadow-[4px_4px_0_var(--color-text-main)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_var(--color-text-main)] transition-all">
                  <LogIn className="w-5 h-5" /> Masuk Google
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Header for Mobile */}
      <header className="md:hidden bg-white border-b-2 border-[var(--color-text-main)] p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 shrink-0 bg-[var(--color-accent)] border-2 border-[var(--color-text-main)] flex items-center justify-center text-white font-mono font-bold text-sm shadow-[2px_2px_0_var(--color-text-main)]">
            {'{ }'}
          </div>
          <h1 className="text-lg font-space">BisaNgoding</h1>
        </div>
        {user ? (
          user.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-8 h-8 rounded-full border-2 border-[var(--color-text-main)]" />
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-text-main)] bg-[var(--color-primary)] flex items-center justify-center font-space text-sm">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          )
        ) : (
          <button onClick={masukGoogle} className="text-sm font-bold bg-[var(--color-accent)] text-white px-3 py-1 rounded border-2 border-[var(--color-text-main)]">
            Masuk
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto z-10 w-full max-w-full">
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[3px] border-[var(--color-text-main)] flex justify-around p-2 z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] min-h-[64px]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-2 rounded-lg text-[11px] font-bold transition-colors w-16 h-14 ${
                isActive ? 'bg-[var(--color-primary)] border-2 border-[var(--color-text-main)] shadow-[2px_2px_0_var(--color-text-main)] text-[var(--color-text-main)]' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg text-[11px] font-bold text-gray-400 w-16 h-14 relative opacity-60">
          <Award className="w-6 h-6 mb-1" />
          Sertifikat
        </div>
        <div className="flex flex-col items-center justify-center p-2 rounded-lg text-[11px] font-bold text-gray-400 w-16 h-14 relative opacity-60">
          <Users className="w-6 h-6 mb-1" />
          Komunitas
        </div>
      </nav>
    </div>
  );
}
