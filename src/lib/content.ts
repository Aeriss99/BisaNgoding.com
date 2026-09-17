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
  if (lessonData && lessonData.id) {
    lessonsCache[lessonData.id] = lessonData as Lesson;
  }
});

export function getLesson(id: string): Lesson | undefined {
  return lessonsCache[id];
}

export function getLessonsForModule(moduleId: string): Lesson[] {
  return Object.values(lessonsCache)
    .filter((l) => l.moduleId === moduleId)
    .sort((a, b) => a.order - b.order);
}
