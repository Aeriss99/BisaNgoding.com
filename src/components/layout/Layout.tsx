import { Outlet } from 'react-router-dom';
import MenuAtas from './MenuAtas';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-main)]">
      <MenuAtas />
      <main className="flex-1 w-full max-w-full">
        <Outlet />
      </main>
    </div>
  );
}
