import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import ModuleDetail from './pages/ModuleDetail';
import HalamanKelas from './pages/RencanaKelas';
import LessonPage from './pages/Lesson';
import QuizPage from './pages/Quiz';
import NotFound from './pages/NotFound';
import SemuaKelas from './pages/SemuaKelas';
import JalurKarier from './pages/JalurKarier';
import NotifikasiPage from './pages/Notifikasi';
import ProgresPage from './pages/Progres';
import Masuk from './pages/Masuk';
import VerifikasiEmail from './pages/VerifikasiEmail';
import { ErrorBoundary } from './components/ErrorBoundary';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import NotifVersiBaru from './components/NotifVersiBaru';

export function LayarMemuat() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--color-primary)]" />
        <p className="font-bold text-gray-500 font-barlow text-lg">
          Memuat BisaNgoding...
        </p>
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, sudahVerifikasiEmail } = useAuth();
  const location = useLocation();
  const bypass = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS === 'true';

  if (loading || (user && sudahVerifikasiEmail === null && !bypass)) return <LayarMemuat />;
  if (!user && !bypass) {
    const tujuan = location.pathname + location.search;
    if (tujuan !== '/') {
      try { sessionStorage.setItem('bn_tujuan', tujuan); } catch {}
    }
    return <Navigate to="/" replace />;
  }

  // Pengguna login tetapi belum verifikasi email
  if (user && !bypass && sudahVerifikasiEmail === false) {
    const tujuan = location.pathname + location.search;
    if (tujuan !== '/' && tujuan !== '/verifikasi-email') {
      try { sessionStorage.setItem('bn_tujuan', tujuan); } catch {}
    }
    return <Navigate to="/verifikasi-email" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading, sedangPulihkanPassword, sudahVerifikasiEmail } = useAuth();
  const nav = useNavigate();

  const isDevBypass = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS === 'true';
  const isLoggedIn = user || isDevBypass;

  useEffect(() => {
    if (sedangPulihkanPassword) {
      nav('/masuk', { replace: true });
      return;
    }
    if (!user) return;
    if (!isDevBypass && sudahVerifikasiEmail === false) {
      return;
    }
    let tujuan: string | null = null;
    try {
      tujuan = sessionStorage.getItem('bn_tujuan');
      sessionStorage.removeItem('bn_tujuan');
    } catch {}
    if (tujuan && tujuan.startsWith('/') && !tujuan.startsWith('//')) {
      nav(tujuan, { replace: true });
    }
  }, [user, sedangPulihkanPassword, sudahVerifikasiEmail, isDevBypass, nav]);

  if (loading && !isDevBypass) {
    return <LayarMemuat />;
  }

  const perluVerifikasi = user && !isDevBypass && sudahVerifikasiEmail === false;

  return (
    <Routes>
      <Route
        path="/"
        element={
          isLoggedIn ? (
            perluVerifikasi ? (
              <Navigate to="/verifikasi-email" replace />
            ) : (
              <Layout />
            )
          ) : (
            <Landing />
          )
        }
      >
        {isLoggedIn && !perluVerifikasi && <Route index element={<JalurKarier />} />}
      </Route>

      <Route path="/masuk" element={<Masuk />} />
      <Route path="/atur-password" element={<Masuk />} />
      <Route path="/verifikasi-email" element={<VerifikasiEmail />} />

      {/* Other Layout Routes */}
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/kelas" element={<SemuaKelas />} />
        <Route path="/jalur" element={<JalurKarier />} />
        <Route path="/notifikasi" element={<NotifikasiPage />} />
        <Route path="/progres" element={<ProgresPage />} />
        <Route path="/kelas/:courseId" element={<HalamanKelas />} />
        <Route path="/module/:moduleId" element={<ModuleDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Routes without Layout */}
      <Route path="/lesson/:lessonId" element={<RequireAuth><LessonPage /></RequireAuth>} />
      <Route path="/quiz/:moduleId" element={<RequireAuth><QuizPage /></RequireAuth>} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProgressProvider>
          <HashRouter>
            <AppRoutes />
            <NotifVersiBaru />
          </HashRouter>
        </ProgressProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
