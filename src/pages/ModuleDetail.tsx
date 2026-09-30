import { useParams, Navigate, Link } from 'react-router-dom';
import MenuAtas from '../components/layout/MenuAtas';
import { modulesData } from '../lib/content';

export default function ModuleDetail() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const mod = modulesData.find((m) => m.id === moduleId);

  if (!mod) {
    return (
      <div className="min-h-screen bg-bg-base font-sans text-text-main">
        <MenuAtas />
        <div className="max-w-[1440px] mx-auto px-8 xl:px-16 pt-10 pb-16 flex flex-col items-center gap-7">
          <p className="text-[18px]">Modul tidak ditemukan.</p>
          <Link
            to="/kelas"
            className="px-4 py-2 bg-primary text-text-main border-2 border-text-main font-space font-bold hover:bg-primary-hover shadow-[2px_2px_0px_var(--color-text-main)] transition-all"
          >
            Kembali ke Kelas
          </Link>
        </div>
      </div>
    );
  }

  // Redirect to the new CourseDetail route with query parameter
  return <Navigate to={`/kelas/${mod.courseId || 'java'}?modul=${mod.id}`} replace />;
}