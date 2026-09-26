import type { Lesson, Module, QuizQuestion, Course } from '../types/schema';
import coursesJson from '../../content/courses.json';
import javaModules from '../../content/java/modules.json';
import jsModules from '../../content/javascript/modules.json';

export const modulesData = [...javaModules, ...jsModules] as Module[];
export const coursesData = coursesJson as Course[];

/**
 * Alias resmi: moduleId yang dipakai di file pelajaran -> id modul di modules.json.
 * JANGAN pakai pencocokan longgar (endsWith/includes). Dulu 'js-dasar' ikut cocok
 * dengan modul Java 'dasar' sehingga pelajaran JavaScript bocor ke modul Java Dasar.
 * Tambah baris baru di sini kalau ada modul yang id-nya beda dengan moduleId pelajarannya.
 */
const MODULE_ALIAS: Record<string, string> = {
  'java-dasar': 'dasar',
};

/** Samakan id apa pun ke id resmi modules.json. Pencocokan selalu persis. */
function canonicalModuleId(id: string): string {
  if (!id) return '';
  return MODULE_ALIAS[id] ?? id;
}

function sameModule(a: string, b: string): boolean {
  if (!a || !b) return false;
  return canonicalModuleId(a) === canonicalModuleId(b);
}

/** Kembalikan id modul resmi dari modules.json (dipakai untuk semua URL) */
export function resolveModuleId(idOrAlias: string): string {
  const found = modulesData.find((m) => m.id === idOrAlias);
  return found ? found.id : idOrAlias;
}

export function getModule(idOrAlias: string): Module | undefined {
  return modulesData.find((m) => m.id === idOrAlias);
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

// Peringatan dini kalau ada pelajaran yang moduleId-nya tidak terdaftar di modules.json
{
  const idResmi = new Set(modulesData.map((m) => m.id));
  const yatim = new Set<string>();
  Object.values(lessonsCache).forEach((l) => {
    if (!idResmi.has(canonicalModuleId(l.moduleId))) yatim.add(l.moduleId);
  });
  if (yatim.size > 0) {
    console.error(
      `moduleId tidak dikenal (pelajaran tidak akan muncul): ${[...yatim].join(', ')}. ` +
        `Daftarkan di modules.json atau tambahkan ke MODULE_ALIAS di src/lib/content.ts`
    );
  }
}

export function checkModuleUnlocked(mod: Module, progress: any): boolean {
  if (progress.unlockAll) return true;
  const courseModules = modulesData
    .filter((m) => (m.courseId || 'java') === (mod.courseId || 'java') && m.status !== 'draft')
    .sort((a, b) => a.order - b.order);
  
  const index = courseModules.findIndex(m => m.id === mod.id);
  if (index <= 0) return true;

  const reqId = mod.requires || courseModules[index - 1].id;
  const reqMod = courseModules.find(m => m.id === reqId);
  if (!reqMod) return true;

  const reqLessons = getVisibleLessons(reqMod.id);
  const reqAllLessonsCompleted = reqLessons.length > 0 && reqLessons.every((l) => progress.completedLessons.includes(l.id));
  const reqScore = progress.quizScores?.[reqMod.id];
  const reqQuiz = getQuizQuestions(reqMod.id);
  
  return reqAllLessonsCompleted && (!reqQuiz || reqQuiz.length === 0 || reqScore?.passed);
}

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
  const target = canonicalModuleId(idOrAlias);
  if (!target) return null;

  for (const path of Object.keys(quizFiles)) {
    const folder = path.split('/').slice(-2)[0] || '';
    // Folder quiz dikenali HANYA lewat moduleId pelajaran di folder yang sama.
    const folderModuleId = folderToModuleId[folder];
    if (!folderModuleId) continue;
    if (canonicalModuleId(folderModuleId) !== target) continue;

    const raw = quizFiles[path] as any;
    const data = raw?.default || raw;
    if (Array.isArray(data) && data.length > 0) return data as QuizQuestion[];
  }
  return null;
}
