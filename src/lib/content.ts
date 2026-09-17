import type { Lesson, Module } from '../types/schema';
import modulesJson from '../../content/modules.json';

export const modulesData = modulesJson as Module[];

// Load all JSON files in content/
const lessonFiles = import.meta.glob('../../content/**/*.json', { eager: true });

const lessonsCache: Record<string, Lesson> = {};

Object.keys(lessonFiles).forEach((path) => {
  if (path.includes('modules.json')) return;
  const mod = lessonFiles[path] as any;
  const lessonData = mod.default || mod;
  if (!lessonData) {
    console.error(`Gagal memuat ${path}: data kosong`);
    return;
  }
  if (!lessonData.id) {
    console.error(`Gagal memuat ${path}: tidak ada field 'id'`);
    return;
  }
  if (lessonsCache[lessonData.id]) {
    console.error(`Peringatan: ID dobel '${lessonData.id}' ditemukan di ${path}`);
  }
  
  // Deteksi skeleton
  const isSkeleton = 
    lessonData.title?.includes(' - Pelajaran ') || 
    lessonData.title?.includes('TODO');
  if (isSkeleton) {
    // console.warn(`Skeleton/draft dilewati: ${lessonData.title} (${path})`);
    // Boleh dilog, tapi untuk tampilan di UI filternya ada di ModuleDetail
  }

  lessonsCache[lessonData.id] = lessonData as Lesson;
});

export function getLesson(id: string): Lesson | undefined {
  return lessonsCache[id];
}

export function getLessonsForModule(moduleId: string): Lesson[] {
  return Object.values(lessonsCache)
    .filter((l) => l.moduleId === moduleId || (moduleId === 'dasar' && l.moduleId === 'java-dasar'))
    .sort((a, b) => a.order - b.order);
}
