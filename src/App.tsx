import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ModuleDetail from './pages/ModuleDetail';
import LessonPage from './pages/Lesson';
import QuizPage from './pages/Quiz';
import NotFound from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';

import { AuthProvider } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProgressProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="module/:moduleId" element={<ModuleDetail />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="/lesson/:lessonId" element={<LessonPage />} />
              <Route path="/quiz/:moduleId" element={<QuizPage />} />
            </Routes>
          </HashRouter>
        </ProgressProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
