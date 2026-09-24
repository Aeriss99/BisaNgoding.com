import type { Lesson, Module, QuizQuestion, Course } from '../types/schema';
import coursesJson from '../../content/courses.json';
import javaModules from '../../content/java/modules.json';
import jsModules from '../../content/javascript/modules.json';

export const modulesData = [...javaModules, ...jsModules] as Module[];
export const coursesData = coursesJson as Course[];

/** Dua id dianggap modul yang sama: 'dasar' == 'java-dasar' == 'module-01-dasar' */
function sameModule(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  return a.endsWith('-' + b) || b.endsWith('-' + a);
}

/** Kembalikan id modul resmi dari modules.json (dipakai untuk semua URL) */
export function resolveModuleId(idOrAlias: string): string {
  const found = modulesData.find((m) => sameModule(m.id, idOrAlias));
  return found ? found.id : idOrAlias;
}

export function getModule(idOrAlias: string): Module | undefined {
  return modulesData.find((m) => sameModule(m.id, idOrAlias));
}

const lessonFiles = import.meta.glob('../../content/**/*.json', {
  eager: true,
});
const lessonsCache: Record<string, Lesson> = {};
const folderToModuleId: Record<string, string> = {};

Object.keys(lessonFiles).forEach((path) => {
  if (
    path.endsWith('modules.json') ||
    path.endsWith('courses.json') ||
    path.endsWith('quiz.json') ||
    path.endsWith('outline.json') ||
    path.endsWith('achievements.json')
  )
    return;
  const mod = lessonFiles[path] as any;
  const data = mod?.default || mod;
  if (!data || !data.id) {
    console.error(
      `Gagal memuat ${path}: data kosong atau tidak ada field 'id'`
    );
    return;
  }
  if (lessonsCache[data.id]) {
    console.error(`ID pelajaran dobel: '${data.id}' di ${path}`);
  }
  lessonsCache[data.id] = data as Lesson;

  const folder = path.split('/').slice(-2)[0];
  if (folder && data.moduleId) {
    folderToModuleId[folder] = data.moduleId;
  }
});

export function isSkeletonLesson(lesson: Lesson): boolean {
  const t = lesson.title || '';
  return (
    t.includes(' - Pelajaran ') ||
    t.includes('TODO') ||
    (lesson.cards?.length ?? 0) <= 1
  );
}

export function getLesson(id: string): Lesson | undefined {
  return lessonsCache[id];
}

/** Semua pelajaran modul, termasuk skeleton */
export function getLessonsForModule(idOrAlias: string): Lesson[] {
  return Object.values(lessonsCache)
    .filter((l) => sameModule(l.moduleId, idOrAlias))
    .sort((a, b) => a.order - b.order);
}

/** Pelajaran yang layak ditampilkan ke user */
export function getVisibleLessons(idOrAlias: string): Lesson[] {
  return getLessonsForModule(idOrAlias).filter((l) => !isSkeletonLesson(l));
}

const quizFiles = import.meta.glob('../../content/**/quiz.json', {
  eager: true,
});

/** Ambil bank soal quiz sebuah modul, null jika belum ada */
export function getQuizQuestions(idOrAlias: string): QuizQuestion[] | null {
  const mod = getModule(idOrAlias);
  const candidates = [
    idOrAlias,
    mod?.id,
    ...getLessonsForModule(idOrAlias).map((l) => l.moduleId),
  ].filter(Boolean) as string[];

  for (const path of Object.keys(quizFiles)) {
    const folder = path.split('/').slice(-2)[0] || '';
    const folderModuleId = folderToModuleId[folder];

    let cocok = false;
    if (
      folderModuleId &&
      candidates.some((id) => sameModule(id, folderModuleId))
    ) {
      cocok = true;
    } else {
      cocok = candidates.some(
        (id) =>
          folder === id ||
          folder.endsWith('-' + id) ||
          id.endsWith('-' + folder) ||
          folder.includes(id)
      );
    }

    if (!cocok) continue;
    const raw = quizFiles[path] as any;
    const data = raw?.default || raw;
    if (Array.isArray(data) && data.length > 0) return data as QuizQuestion[];
  }
  return null;
}
