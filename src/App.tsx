import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Playground from './pages/Playground';
import Profile from './pages/Profile';
import ModuleDetail from './pages/ModuleDetail';
import LessonPage from './pages/Lesson';
import NotFound from './pages/NotFound';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="playground" element={<Playground />} />
          <Route path="profile" element={<Profile />} />
          <Route path="module/:moduleId" element={<ModuleDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/lesson/:lessonId" element={<LessonPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
