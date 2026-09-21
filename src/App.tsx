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

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Jika belum login, root (/) tampilkan Landing */}
      {!user && <Route path="/" element={<Landing />} />}

      {/* Rute yang pakai Layout */}
      <Route element={<Layout />}>
        {/* Jika sudah login, root (/) tampilkan Dashboard */}
        {user && <Route path="/" element={<Dashboard />} />}
        
        <Route path="/profile" element={<Profile />} />
        <Route path="/module/:moduleId" element={<ModuleDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Rute tanpa Layout */}
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
