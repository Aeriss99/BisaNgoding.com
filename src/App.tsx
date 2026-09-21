import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import ModuleDetail from './pages/ModuleDetail';
import LessonPage from './pages/Lesson';
import QuizPage from './pages/Quiz';
import NotFound from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';
import { Loader2 } from 'lucide-react';

function AppRoutes() {
  const { user, loading } = useAuth();

  // Bypass Mode Dev: jika VITE_DEV_BYPASS=true dan sedang mode DEV, anggap sudah login
  const isDevBypass = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS === 'true';
  const isLoggedIn = user || isDevBypass;

  if (loading && !isDevBypass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--color-primary)]" />
          <p className="font-bold text-gray-500 font-barlow text-lg">Memuat BisaNgoding...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root Route: Landing if not logged in, otherwise Dashboard inside Layout */}
      <Route path="/" element={isLoggedIn ? <Layout /> : <Landing />}>
        {isLoggedIn && <Route index element={<Dashboard />} />}
      </Route>

      {/* Other Layout Routes */}
      <Route element={<Layout />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/module/:moduleId" element={<ModuleDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Routes without Layout */}
      <Route path="/lesson/:lessonId" element={<LessonPage />} />
      <Route path="/quiz/:moduleId" element={<QuizPage />} />
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
          </HashRouter>
        </ProgressProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
