import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, User } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Belajar', icon: BookOpen },
    { path: '/profile', label: 'Profil', icon: User },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-main)] pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-64">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white brutal-border border-l-0 border-y-0">
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
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 md:p-8">
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
