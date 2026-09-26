#!/usr/bin/env bash
# Pasang semua perbaikan BisaNgoding.com sekaligus.
# Jalankan DARI ROOT PROJECT:   bash pasang-fix.sh
set -e

if [ ! -f package.json ] || [ ! -d content/java ]; then
  echo "ERROR: jalankan skrip ini dari folder root project (yang ada package.json dan content/java)."
  exit 1
fi

echo "== 1. backup file yang akan ditimpa =="
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p ".backup-$STAMP"
for f in src/lib/content.ts src/pages/Quiz.tsx src/test/content-integrity.test.ts src/test/sameModuleFix.test.ts; do
  if [ -f "$f" ]; then mkdir -p ".backup-$STAMP/$(dirname "$f")"; cp "$f" ".backup-$STAMP/$f"; fi
done
echo "   backup di .backup-$STAMP/"

echo "== 2. buang file coretan agent =="
rm -f src/test/debug.test.ts
rm -f src/test/content-integrity.FIX.test.ts src/test/sameModuleFix.FIX.test.ts
rm -f src/lib/content.FIX.ts src/pages/Quiz.FIX.tsx

echo "== 3. tulis file perbaikan =="
mkdir -p "$(dirname "src/lib/content.ts")"
cat > 'src/lib/content.ts' <<'BISANGODING_FILE_END'
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
BISANGODING_FILE_END
echo "   ditulis: src/lib/content.ts"
mkdir -p "$(dirname "src/pages/Quiz.tsx")"
cat > 'src/pages/Quiz.tsx' <<'BISANGODING_FILE_END'
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { coursesData, getModule, getQuizQuestions } from '../lib/content';
import type { QuizQuestion } from '../types/schema';
import {
  prepareQuiz,
  calculateScore,
  isPassingScore,
  PASSING_SCORE,
} from '../lib/quizLogic';
import CodeMirror from '@uiw/react-codemirror';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';

export default function QuizPage() {
  const { moduleId } = useParams();
  const mod = getModule(moduleId || '');
  const course = coursesData.find((c) => c.id === (mod?.courseId || 'java'));
  const language = course?.language || 'java';
  
  const { saveQuizScore, addXP, touchActivity } = useProgress();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for quiz execution
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Load quiz from content
    const loadQuiz = async () => {
      try {
        // Pakai satu sumber pencocokan modul (content.ts) supaya quiz modul lain
        // tidak pernah terpilih. Dulu '-dasar/quiz.json' cocok dengan folder
        // js-module-01-dasar sehingga Quiz Java Dasar memuat soal JavaScript.
        const quizData = getQuizQuestions(moduleId || '');

        if (!quizData || quizData.length === 0) {
          setError('Quiz belum tersedia.');
          setLoading(false);
          return;
        }

        setQuestions(prepareQuiz(quizData, 20));
      } catch {
        setError('Quiz belum tersedia.');
      }
      setLoading(false);
    };

    loadQuiz();
  }, [moduleId]);

  const handleSelect = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsFinished(true);
    const score = calculateScore(questions, answers);
    const passed = isPassingScore(score);

    touchActivity();
    saveQuizScore(moduleId || '', score, passed);
    if (passed) {
      addXP(50); // Big XP bonus for passing quiz
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Memuat quiz...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full space-y-4">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
          <h2 className="text-xl font-bold">{error}</h2>
          <Link
            to={`/module/${moduleId}`}
            className="inline-block bg-blue-600 text-white font-bold py-2 px-6 rounded-xl"
          >
            Kembali ke Modul
          </Link>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const correctCount = questions.filter(
      (q, i) => answers[i] === q.answer
    ).length;
    const score = calculateScore(questions, answers);
    const passed = isPassingScore(score);

    return (
      <div className="max-w-2xl mx-auto p-4 py-8 space-y-8 relative z-0">
        <svg
          className="fixed inset-0 w-full h-full pointer-events-none z-[-1] opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50vw" cy="50vh" r="40vw" fill="var(--color-primary)" />
        </svg>
        <div className="brutal-card p-8 rounded-2xl text-center space-y-6">
          {passed ? (
            <div className="flex justify-center mb-2">
              <img
                src={`${import.meta.env.BASE_URL}illustrations/undraw_done_erdp.svg`}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="pointer-events-none w-full max-w-[200px]"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto bg-[var(--color-danger)] brutal-border text-white">
              <X className="w-12 h-12" />
            </div>
          )}
          <div>
            <h2 className="text-3xl font-extrabold mb-2">
              {passed ? 'Lulus!' : 'Belum Lulus'}
            </h2>
            <p className="text-gray-700 font-bold">
              Skor Anda: <span className="text-black text-xl">{score}%</span>
            </p>
            <p className="text-sm text-gray-500 mt-1 font-bold">
              Syarat lulus: {PASSING_SCORE}%
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 brutal-btn bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> Ulangi
            </button>
            <Link
              to={`/module/${moduleId}`}
              className="flex-1 brutal-btn bg-[var(--color-primary)] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center"
            >
              Selesai
            </Link>
          </div>
        </div>

        {/* Review wrong answers */}
        <div className="space-y-4">
          <h3 className="font-bold text-xl px-2">Pembahasan Jawaban Salah</h3>
          {questions.map((q, i) => {
            if (answers[i] === q.answer) return null;
            return (
              <div
                key={i}
                className="bg-white border border-red-200 rounded-xl p-6 space-y-4"
              >
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                  <div className="font-bold text-lg">{q.question}</div>
                </div>
                {q.code && (
                  <div className="border rounded-lg overflow-hidden border-gray-300">
                    <CodeMirror
                      value={q.code}
                      extensions={[language === 'javascript' ? javascript() : java()]}
                      theme="light"
                      readOnly={true}
                    />
                  </div>
                )}
                <div className="space-y-2 pl-11">
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm">
                    <span className="font-bold text-red-700">
                      Jawaban Anda:{' '}
                    </span>
                    {q.options[answers[i]] || 'Tidak dijawab'}
                  </div>
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm">
                    <span className="font-bold text-green-700">
                      Jawaban Benar:{' '}
                    </span>
                    {q.options[q.answer]}
                  </div>
                </div>
                <div className="pl-11 mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="font-bold text-gray-800">Penjelasan:</span>{' '}
                  {q.explanation}
                </div>
              </div>
            );
          })}
          {correctCount === questions.length && (
            <p className="text-center text-gray-500 py-4">
              Luar biasa! Tidak ada jawaban yang salah.
            </p>
          )}
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const hasAnswered = answers[currentIndex] !== undefined;

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-base)] items-center md:py-6 relative z-0">
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-[-1] opacity-[0.06]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50vw" cy="50vh" r="40vw" fill="var(--color-accent)" />
      </svg>
      <div className="w-full h-full max-w-[100vw] sm:max-w-xl md:max-w-3xl md:h-[95vh] md:rounded-2xl bg-white flex flex-col brutal-border relative overflow-hidden">
        <header className="p-4 border-b-[2px] border-[var(--color-text-main)] flex items-center gap-4 bg-[var(--color-accent)]">
          <Link
            to={`/module/${moduleId}`}
            className="text-[var(--color-text-main)] hover:scale-110 transition-transform"
          >
            <X className="w-6 h-6" />
          </Link>
          <div className="flex-1 font-bold text-center">
            Soal {currentIndex + 1} dari {questions.length}
          </div>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto p-6 pb-32 space-y-6">
          <h3 className="font-bold text-xl">{q.question}</h3>

          {q.code && (
            <div className="border rounded-lg overflow-hidden border-gray-300">
              <CodeMirror
                value={q.code}
                extensions={[java()]}
                theme="light"
                readOnly={true}
                basicSetup={{ lineNumbers: true }}
              />
            </div>
          )}

          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const isSelected = answers[currentIndex] === i;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </main>

        <footer className="p-4 border-t bg-white">
          <button
            disabled={!hasAnswered}
            onClick={handleNext}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center transition-colors"
          >
            {currentIndex === questions.length - 1
              ? 'Selesai & Lihat Hasil'
              : 'Selanjutnya'}
          </button>
        </footer>
      </div>
    </div>
  );
}
BISANGODING_FILE_END
echo "   ditulis: src/pages/Quiz.tsx"
mkdir -p "$(dirname "src/test/content-integrity.test.ts")"
cat > 'src/test/content-integrity.test.ts' <<'BISANGODING_FILE_END'
import { describe, it, expect } from 'vitest';
import { modulesData, getVisibleLessons, getQuizQuestions } from '../lib/content';

/**
 * Test ini SENGAJA tidak memakai angka hafalan (228, 169, dst).
 * Angka hafalan bikin test gagal setiap kali ada modul baru, lalu tergoda
 * diubah angkanya supaya lulus — itu menyembunyikan bug, bukan memperbaikinya.
 * Yang diperiksa di sini adalah hubungan antar data, bukan jumlahnya.
 */
describe('Integritas konten', () => {
  const ready = modulesData.filter((m) => m.status === 'ready');

  it('id modul tidak ada yang dobel', () => {
    const dobel = modulesData
      .map((m) => m.id)
      .filter((id, i, arr) => arr.indexOf(id) !== i);
    expect(dobel).toEqual([]);
  });

  it('setiap modul berstatus "ready" benar-benar punya file pelajaran', () => {
    const kosong = ready
      .filter((m) => getVisibleLessons(m.id).length === 0)
      .map((m) => m.id);
    expect(kosong).toEqual([]);
  });

  it('lessonCount di modules.json sama dengan jumlah file pelajaran yang ada', () => {
    const beda = ready
      .map((m) => ({
        id: m.id,
        ditulis: m.lessonCount,
        aktual: getVisibleLessons(m.id).length,
      }))
      .filter((x) => x.ditulis !== x.aktual);
    expect(beda).toEqual([]);
  });

  it('tidak ada pelajaran yang muncul di dua modul', () => {
    const pemilik: Record<string, string[]> = {};
    modulesData.forEach((m) => {
      getVisibleLessons(m.id).forEach((l) => {
        (pemilik[l.id] ||= []).push(m.id);
      });
    });
    const dobel = Object.entries(pemilik)
      .filter(([, mods]) => mods.length > 1)
      .map(([lessonId, mods]) => `${lessonId} -> ${mods.join(', ')}`);
    expect(dobel).toEqual([]);
  });

  it('prasyarat (requires) tidak menunjuk modul kosong sehingga modul berikutnya terkunci selamanya', () => {
    const rusak = modulesData
      .filter((m) => {
        if (!m.requires) return false;
        const req = modulesData.find((x) => x.id === m.requires);
        // modul draft dilewati oleh checkModuleUnlocked, jadi aman
        if (!req || req.status === 'draft') return false;
        return getVisibleLessons(req.id).length === 0;
      })
      .map((m) => `${m.id} terkunci karena prasyarat "${m.requires}" kosong`);
    expect(rusak).toEqual([]);
  });

  it('tidak ada dua modul yang memakai file quiz yang sama', () => {
    const terpakai = new Map<string, string>();
    const tertukar: string[] = [];
    modulesData.forEach((m) => {
      const q = getQuizQuestions(m.id);
      if (!q || q.length === 0) return;
      const sidik = JSON.stringify(q[0]);
      const sebelumnya = terpakai.get(sidik);
      if (sebelumnya) tertukar.push(`${m.id} memakai quiz milik ${sebelumnya}`);
      else terpakai.set(sidik, m.id);
    });
    expect(tertukar).toEqual([]);
  });
});
BISANGODING_FILE_END
echo "   ditulis: src/test/content-integrity.test.ts"
mkdir -p "$(dirname "src/test/sameModuleFix.test.ts")"
cat > 'src/test/sameModuleFix.test.ts' <<'BISANGODING_FILE_END'
import { describe, it, expect } from 'vitest';
import {
  getModule,
  getLessonsForModule,
  getVisibleLessons,
  getQuizQuestions,
  modulesData,
} from '../lib/content';

describe('Regresi: pelajaran JavaScript bocor ke modul Java', () => {
  it('getModule("js-dasar") mengembalikan modul JavaScript, bukan modul Java', () => {
    const mod = getModule('js-dasar');
    expect(mod).toBeDefined();
    expect(mod?.courseId).toBe('javascript');
  });

  it('getModule("dasar") tetap mengembalikan modul Java Dasar', () => {
    const mod = getModule('dasar');
    expect(mod).toBeDefined();
    expect(mod?.id).toBe('dasar');
  });

  it('getLessonsForModule("dasar") tidak boleh berisi pelajaran js-dasar', () => {
    const lessons = getLessonsForModule('dasar');
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons.some((l) => l.moduleId === 'js-dasar')).toBe(false);
    expect(lessons.every((l) => l.moduleId === 'java-dasar')).toBe(true);
  });

  it('getLessonsForModule("js-dasar") hanya berisi pelajaran JavaScript', () => {
    const lessons = getLessonsForModule('js-dasar');
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons.every((l) => l.moduleId === 'js-dasar')).toBe(true);
  });

  it('judul pelajaran modul Java Dasar tidak menyebut JavaScript', () => {
    const judul = getVisibleLessons('dasar').map((l) => l.title.toLowerCase());
    expect(judul.some((t) => t.includes('javascript'))).toBe(false);
    expect(judul.some((t) => t.includes('console.log'))).toBe(false);
  });

  it('setiap pelajaran hanya muncul di satu modul', () => {
    const pemilik: Record<string, string[]> = {};
    modulesData.forEach((m) => {
      getLessonsForModule(m.id).forEach((l) => {
        (pemilik[l.id] ||= []).push(m.id);
      });
    });
    const dobel = Object.entries(pemilik).filter(([, mods]) => mods.length > 1);
    expect(dobel).toEqual([]);
  });

  it('modul Java Dasar memakai quiznya sendiri, bukan quiz JavaScript', () => {
    const quizJava = getQuizQuestions('dasar');
    const quizJs = getQuizQuestions('js-dasar');
    expect(quizJava).not.toBeNull();
    expect(quizJs).not.toBeNull();
    expect(quizJava!.every((q) => q.id.startsWith('java-dasar-quiz'))).toBe(true);
    expect(JSON.stringify(quizJava)).not.toBe(JSON.stringify(quizJs));
  });

  it('quiz tiap modul tidak tertukar antar modul', () => {
    const terpakai = new Map<string, string>();
    modulesData.forEach((m) => {
      const q = getQuizQuestions(m.id);
      if (!q) return;
      const sidik = JSON.stringify(q[0]);
      expect(terpakai.has(sidik)).toBe(false);
      terpakai.set(sidik, m.id);
    });
  });
});
BISANGODING_FILE_END
echo "   ditulis: src/test/sameModuleFix.test.ts"
mkdir -p "$(dirname "content/java/module-01-dasar/quiz.json")"
cat > 'content/java/module-01-dasar/quiz.json' <<'BISANGODING_FILE_END'
[
  {
    "id": "java-dasar-quiz-01",
    "question": "Method apa yang wajib ada sebagai titik awal program Java?",
    "options": [
      "start()",
      "init()",
      "main()",
      "run()"
    ],
    "answer": 2,
    "explanation": "Java selalu mulai mengeksekusi dari method main."
  },
  {
    "id": "java-dasar-quiz-02",
    "question": "Apa beda System.out.print dan System.out.println?",
    "options": [
      "Tidak ada bedanya",
      "println pindah baris setelah mencetak, print tidak",
      "print lebih cepat",
      "println hanya untuk angka"
    ],
    "answer": 1,
    "explanation": "Akhiran ln berarti line: kursor pindah ke baris baru setelah mencetak."
  },
  {
    "id": "java-dasar-quiz-03",
    "question": "Nama variabel mana yang TIDAK valid di Java?",
    "options": [
      "nilaiAkhir",
      "_total",
      "2nilai",
      "hargaBarang"
    ],
    "answer": 2,
    "explanation": "Nama variabel tidak boleh diawali angka."
  },
  {
    "id": "java-dasar-quiz-04",
    "question": "Tipe data apa yang tepat untuk menyimpan nilai 3.14?",
    "options": [
      "int",
      "double",
      "char",
      "boolean"
    ],
    "answer": 1,
    "explanation": "Bilangan berkoma disimpan dengan double (atau float)."
  },
  {
    "id": "java-dasar-quiz-05",
    "question": "Berapa nilai yang dicetak program ini?",
    "code": "int[] angka = new int[3];\nSystem.out.println(angka[0]);",
    "options": [
      "0",
      "1",
      "null",
      "Error"
    ],
    "answer": 0,
    "explanation": "Variabel int yang belum diisi di dalam array otomatis bernilai 0."
  },
  {
    "id": "java-dasar-quiz-06",
    "question": "Apa output program ini?",
    "code": "System.out.println(7 / 2);",
    "options": [
      "3.5",
      "3",
      "4",
      "Error"
    ],
    "answer": 1,
    "explanation": "Pembagian dua int menghasilkan int: bagian koma dibuang, bukan dibulatkan."
  },
  {
    "id": "java-dasar-quiz-07",
    "question": "Apa output program ini?",
    "code": "System.out.println(10 % 3);",
    "options": [
      "3",
      "1",
      "0",
      "3.33"
    ],
    "answer": 1,
    "explanation": "Operator % memberi sisa bagi. 10 dibagi 3 sisa 1."
  },
  {
    "id": "java-dasar-quiz-08",
    "question": "Apa output program ini?",
    "code": "System.out.println(\"Nilai: \" + 5 + 3);",
    "options": [
      "Nilai: 8",
      "Nilai: 53",
      "Nilai: 5 3",
      "Error"
    ],
    "answer": 1,
    "explanation": "Karena kiri sudah String, + berarti sambung teks. 5 dan 3 ikut disambung, bukan dijumlah."
  },
  {
    "id": "java-dasar-quiz-09",
    "question": "Bagaimana agar 5 + 3 dijumlahkan dulu baru disambung?",
    "options": [
      "\"Nilai: \" + 5 + 3",
      "\"Nilai: \" + (5 + 3)",
      "\"Nilai: \" (5 + 3)",
      "\"Nilai: \" plus 5 + 3"
    ],
    "answer": 1,
    "explanation": "Kurung memaksa penjumlahan dikerjakan lebih dulu."
  },
  {
    "id": "java-dasar-quiz-10",
    "question": "Apa output program ini?",
    "code": "char huruf = 'A';\nSystem.out.println(huruf + 1);",
    "options": [
      "A1",
      "66",
      "B",
      "Error"
    ],
    "answer": 1,
    "explanation": "char dinaikkan jadi int saat dijumlah dengan angka. 'A' bernilai 65, jadi hasilnya 66."
  },
  {
    "id": "java-dasar-quiz-11",
    "question": "Nilai apa saja yang bisa disimpan variabel boolean?",
    "options": [
      "0 dan 1",
      "true dan false",
      "yes dan no",
      "null dan true"
    ],
    "answer": 1,
    "explanation": "boolean hanya punya dua nilai: true dan false."
  },
  {
    "id": "java-dasar-quiz-12",
    "question": "Apa output program ini?",
    "code": "double nilai = 9.99;\nSystem.out.println((int) nilai);",
    "options": [
      "10",
      "9",
      "9.99",
      "Error"
    ],
    "answer": 1,
    "explanation": "Casting ke int memotong bagian koma, tidak membulatkan."
  },
  {
    "id": "java-dasar-quiz-13",
    "question": "Perubahan mana yang otomatis, tanpa perlu casting?",
    "options": [
      "double ke int",
      "int ke double",
      "double ke char",
      "long ke int"
    ],
    "answer": 1,
    "explanation": "int ke double aman karena tidak ada data yang hilang, jadi otomatis."
  },
  {
    "id": "java-dasar-quiz-14",
    "question": "Apa output program ini?",
    "code": "int i = 5;\nSystem.out.println(i++);\nSystem.out.println(i);",
    "options": [
      "5 6",
      "5 5",
      "6 6",
      "6 5"
    ],
    "answer": 0,
    "explanation": "i++ memakai nilai lama dulu (5) baru menambah, sehingga baris kedua mencetak 6."
  },
  {
    "id": "java-dasar-quiz-15",
    "question": "Apa output program ini?",
    "code": "int x = 10;\nx += 3;\nSystem.out.println(x);",
    "options": [
      "10",
      "13",
      "30",
      "3"
    ],
    "answer": 1,
    "explanation": "x += 3 sama artinya dengan x = x + 3."
  },
  {
    "id": "java-dasar-quiz-16",
    "question": "Apa output program ini?",
    "code": "System.out.println(5 == 3);",
    "options": [
      "true",
      "false",
      "1",
      "Error"
    ],
    "answer": 1,
    "explanation": "Operator = mengisi nilai, == membandingkan. Di sini 5 tidak sama dengan 3."
  },
  {
    "id": "java-dasar-quiz-17",
    "question": "Operator apa yang berarti 'tidak sama dengan'?",
    "options": [
      "<>",
      "!=",
      "=/=",
      "not="
    ],
    "answer": 1,
    "explanation": "Java memakai != untuk 'tidak sama dengan'."
  },
  {
    "id": "java-dasar-quiz-18",
    "question": "Apa output program ini?",
    "code": "System.out.println(true && false);",
    "options": [
      "true",
      "false",
      "Error",
      "1"
    ],
    "answer": 1,
    "explanation": "&& butuh kedua sisi benar. Sisi kanan salah, jadi hasilnya false."
  },
  {
    "id": "java-dasar-quiz-19",
    "question": "Apa output program ini?",
    "code": "System.out.println(false || true);",
    "options": [
      "true",
      "false",
      "Error",
      "null"
    ],
    "answer": 0,
    "explanation": "|| cukup salah satu sisi benar."
  },
  {
    "id": "java-dasar-quiz-20",
    "question": "Apa arti short-circuit pada operator &&?",
    "options": [
      "Program berhenti",
      "Kondisi kedua tidak dicek jika yang pertama sudah false",
      "Kedua kondisi selalu dicek",
      "&& berubah jadi ||"
    ],
    "answer": 1,
    "explanation": "Kalau kondisi pertama sudah false, hasilnya pasti false, jadi kondisi kedua dilewati."
  },
  {
    "id": "java-dasar-quiz-21",
    "question": "Apa output program ini?",
    "code": "int nilai = 80;\nif (nilai > 90) {\n    System.out.println(\"Besar\");\n} else if (nilai > 70) {\n    System.out.println(\"Sedang\");\n} else {\n    System.out.println(\"Kecil\");\n}",
    "options": [
      "Kecil",
      "Sedang",
      "Besar",
      "Tidak ada output"
    ],
    "answer": 1,
    "explanation": "80 tidak lebih dari 90, tapi lebih dari 70, jadi cabang kedua yang jalan."
  },
  {
    "id": "java-dasar-quiz-22",
    "question": "Dalam rantai if - else if - else, berapa blok yang dijalankan?",
    "options": [
      "Semua yang kondisinya benar",
      "Hanya satu, yang pertama kali cocok",
      "Selalu blok else",
      "Tidak ada, harus pakai switch"
    ],
    "answer": 1,
    "explanation": "Begitu satu cabang cocok, sisanya dilewati."
  },
  {
    "id": "java-dasar-quiz-23",
    "question": "Apa output program ini?",
    "code": "int n = 2;\nswitch (n) {\n    case 1:\n        System.out.println(\"A\");\n    case 2:\n        System.out.println(\"B\");\n    case 3:\n        System.out.println(\"C\");\n        break;\n    case 4:\n        System.out.println(\"D\");\n}",
    "options": [
      "B",
      "B C",
      "B C D",
      "Tidak ada output"
    ],
    "answer": 1,
    "explanation": "Tanpa break, eksekusi jatuh terus ke case berikutnya sampai ketemu break."
  },
  {
    "id": "java-dasar-quiz-24",
    "question": "Apa keuntungan switch expression dengan panah (->) dibanding switch biasa?",
    "options": [
      "Lebih cepat dijalankan",
      "Tidak perlu break karena tidak ada fall-through",
      "Bisa dipakai untuk double",
      "Tidak butuh case"
    ],
    "answer": 1,
    "explanation": "Bentuk panah hanya menjalankan cabang yang cocok, jadi tidak ada risiko lupa break."
  },
  {
    "id": "java-dasar-quiz-25",
    "question": "Apa output program ini?",
    "code": "int umur = 20;\nString status = umur >= 17 ? \"Dewasa\" : \"Anak\";\nSystem.out.println(status);",
    "options": [
      "Dewasa",
      "Anak",
      "true",
      "Error"
    ],
    "answer": 0,
    "explanation": "Ternari: kondisi ? nilai jika benar : nilai jika salah."
  },
  {
    "id": "java-dasar-quiz-26",
    "question": "Berapa kali baris println dijalankan?",
    "code": "for (int i = 0; i < 4; i++) {\n    System.out.println(i);\n}",
    "options": [
      "3 kali",
      "4 kali",
      "5 kali",
      "Tidak pernah"
    ],
    "answer": 1,
    "explanation": "i mulai dari 0 dan berhenti saat i = 4, jadi 0,1,2,3 yaitu 4 kali."
  },
  {
    "id": "java-dasar-quiz-27",
    "question": "Apa output program ini?",
    "code": "int total = 0;\nfor (int i = 1; i <= 5; i++) {\n    total += i;\n}\nSystem.out.println(total);",
    "options": [
      "10",
      "15",
      "5",
      "Error"
    ],
    "answer": 1,
    "explanation": "Perulangan menjumlahkan 1 sampai 5, hasilnya 15."
  },
  {
    "id": "java-dasar-quiz-28",
    "question": "Apa output program ini?",
    "code": "int i = 5;\nwhile (i < 3) {\n    System.out.println(i);\n    i++;\n}",
    "options": [
      "Tidak ada output",
      "0",
      "1",
      "Perulangan tanpa henti"
    ],
    "answer": 0,
    "explanation": "Kondisi while sudah salah sejak awal, jadi isi perulangan tidak pernah jalan."
  },
  {
    "id": "java-dasar-quiz-29",
    "question": "Apa beda do-while dengan while?",
    "options": [
      "do-while lebih cepat",
      "do-while selalu jalan minimal satu kali",
      "do-while tidak butuh kondisi",
      "Tidak ada beda"
    ],
    "answer": 1,
    "explanation": "Pada do-while kondisi dicek setelah isi dijalankan, jadi isinya pasti jalan sekali."
  },
  {
    "id": "java-dasar-quiz-30",
    "question": "Apa output program ini?",
    "code": "for (int i = 1; i <= 5; i++) {\n    if (i == 3) {\n        continue;\n    }\n    System.out.println(i);\n}",
    "options": [
      "1 2 3 4 5",
      "1 2",
      "1 2 4 5",
      "1 2 3"
    ],
    "answer": 2,
    "explanation": "continue melewati sisa badan perulangan untuk putaran itu saja, tidak menghentikan perulangan."
  },
  {
    "id": "java-dasar-quiz-31",
    "question": "Berapa baris output yang dihasilkan?",
    "code": "for (int i = 0; i < 2; i++) {\n    for (int j = 0; j < 3; j++) {\n        System.out.println(i + \"-\" + j);\n    }\n}",
    "options": [
      "3 baris",
      "5 baris",
      "6 baris",
      "9 baris"
    ],
    "answer": 2,
    "explanation": "Perulangan luar 2 kali, dalam 3 kali, jadi 2 x 3 = 6."
  },
  {
    "id": "java-dasar-quiz-32",
    "question": "Apa output program ini?",
    "code": "int[] nilai = {10, 20, 30};\nSystem.out.println(nilai.length);",
    "options": [
      "3",
      "4",
      "30",
      "Error"
    ],
    "answer": 0,
    "explanation": "length memberi jumlah elemen, bukan indeks terakhir."
  },
  {
    "id": "java-dasar-quiz-33",
    "question": "Indeks elemen pertama sebuah array di Java adalah...",
    "options": [
      "1",
      "0",
      "-1",
      "Tergantung tipe data"
    ],
    "answer": 1,
    "explanation": "Indeks array selalu mulai dari 0."
  },
  {
    "id": "java-dasar-quiz-34",
    "question": "Apa output program ini?",
    "code": "int[] nilai = {10, 20, 30};\nint total = 0;\nfor (int n : nilai) {\n    total += n;\n}\nSystem.out.println(total);",
    "options": [
      "60",
      "30",
      "10",
      "Error"
    ],
    "answer": 0,
    "explanation": "for-each menjumlahkan seluruh isi array."
  },
  {
    "id": "java-dasar-quiz-35",
    "question": "Apa output program ini?",
    "code": "int[][] tabel = {{1, 2}, {3, 4}};\nSystem.out.println(tabel[1][0]);",
    "options": [
      "1",
      "2",
      "3",
      "4"
    ],
    "answer": 2,
    "explanation": "Baris ke-1 (indeks 1) adalah {3, 4}, elemen indeks 0 di baris itu adalah 3."
  },
  {
    "id": "java-dasar-quiz-36",
    "question": "Kata kunci apa yang dipakai kalau sebuah method tidak mengembalikan nilai?",
    "options": [
      "null",
      "empty",
      "void",
      "none"
    ],
    "answer": 2,
    "explanation": "void berarti method tidak mengembalikan apa pun."
  },
  {
    "id": "java-dasar-quiz-37",
    "question": "Apa output program ini?",
    "code": "public static int tambah(int a, int b) {\n    return a + b;\n}\n\npublic static void main(String[] args) {\n    System.out.println(tambah(3, 5));\n}",
    "options": [
      "8",
      "35",
      "Error",
      "0"
    ],
    "answer": 0,
    "explanation": "Method tambah mengembalikan hasil penjumlahan, lalu dicetak."
  },
  {
    "id": "java-dasar-quiz-38",
    "question": "Apa itu method overloading?",
    "options": [
      "Satu method dipanggil berkali-kali",
      "Beberapa method bernama sama tapi beda parameter",
      "Method yang terlalu panjang",
      "Method di dalam method"
    ],
    "answer": 1,
    "explanation": "Java membedakannya dari jumlah atau tipe parameter, bukan dari tipe return."
  },
  {
    "id": "java-dasar-quiz-39",
    "question": "Apa output program ini?",
    "code": "public static int faktorial(int n) {\n    if (n <= 1) {\n        return 1;\n    }\n    return n * faktorial(n - 1);\n}\n\npublic static void main(String[] args) {\n    System.out.println(faktorial(4));\n}",
    "options": [
      "24",
      "4",
      "10",
      "Program tanpa henti"
    ],
    "answer": 0,
    "explanation": "Faktorial 4 = 4 x 3 x 2 x 1 = 24."
  },
  {
    "id": "java-dasar-quiz-40",
    "question": "Apa yang terjadi kalau method rekursif tidak punya kondisi berhenti?",
    "options": [
      "Hasilnya 0",
      "Program error karena memanggil diri sendiri tanpa henti",
      "Java menghentikannya otomatis",
      "Method hanya jalan sekali"
    ],
    "answer": 1,
    "explanation": "Tanpa kondisi berhenti, pemanggilan menumpuk sampai memori habis (StackOverflowError)."
  },
  {
    "id": "java-dasar-quiz-41",
    "question": "Variabel yang dideklarasikan di dalam sebuah blok { } bisa dipakai di mana?",
    "options": [
      "Di seluruh program",
      "Hanya di dalam blok itu",
      "Hanya di method main",
      "Di class lain"
    ],
    "answer": 1,
    "explanation": "Itu yang disebut scope: variabel hanya hidup di dalam blok tempat ia dibuat."
  },
  {
    "id": "java-dasar-quiz-42",
    "question": "Method Scanner apa yang dipakai untuk membaca satu angka bulat?",
    "options": [
      "nextLine()",
      "next()",
      "nextInt()",
      "readInt()"
    ],
    "answer": 2,
    "explanation": "nextInt() membaca angka bulat dari input."
  },
  {
    "id": "java-dasar-quiz-43",
    "question": "Apa output program ini?",
    "code": "String kata = \"Java\";\nSystem.out.println(kata.length());",
    "options": [
      "5",
      "4",
      "JAVA",
      "java"
    ],
    "answer": 1,
    "explanation": "length() menghitung jumlah karakter."
  },
  {
    "id": "java-dasar-quiz-44",
    "question": "Apa output program ini?",
    "code": "String kata = \"Java\";\nSystem.out.println(kata.toUpperCase());",
    "options": [
      "JAVA",
      "Java",
      "java",
      "Error"
    ],
    "answer": 0,
    "explanation": "toUpperCase() mengubah semua huruf jadi kapital, tapi tidak mengubah variabel aslinya."
  },
  {
    "id": "java-dasar-quiz-45",
    "question": "Cara yang benar membandingkan isi dua String adalah...",
    "options": [
      "a == b",
      "a.equals(b)",
      "a.compare(b)",
      "a = b"
    ],
    "answer": 1,
    "explanation": "== membandingkan alamat objek, equals() membandingkan isinya."
  }
]
BISANGODING_FILE_END
echo "   ditulis: content/java/module-01-dasar/quiz.json"
mkdir -p "$(dirname "cek-modul.mjs")"
cat > 'cek-modul.mjs' <<'BISANGODING_FILE_END'
// Cek cepat: ada modul "ready" yang file pelajarannya belum ada?
// Jalankan dari root project:  node cek-modul.mjs
import fs from 'fs';

const ALIAS = { 'java-dasar': 'dasar' }; // moduleId di file -> id di modules.json
const canon = (id) => ALIAS[id] ?? id;
let masalah = 0;

for (const course of ['java', 'javascript']) {
  const dir = `content/${course}`;
  if (!fs.existsSync(dir)) continue;

  // petakan: id modul -> jumlah file pelajaran
  const jumlah = {};
  for (const folder of fs.readdirSync(dir)) {
    const p = `${dir}/${folder}`;
    if (!fs.statSync(p).isDirectory()) continue;
    const files = fs.readdirSync(p).filter((f) => f.startsWith('lesson-'));
    if (files.length === 0) continue;
    const moduleId = JSON.parse(fs.readFileSync(`${p}/${files[0]}`, 'utf8')).moduleId;
    jumlah[canon(moduleId)] = (jumlah[canon(moduleId)] ?? 0) + files.length;
  }

  console.log(`\n== ${course} ==`);
  for (const m of JSON.parse(fs.readFileSync(`${dir}/modules.json`, 'utf8'))) {
    if (m.status !== 'ready') continue;
    const nyata = jumlah[m.id] ?? 0;
    const ok = nyata === m.lessonCount && nyata > 0;
    if (!ok) masalah++;
    console.log(
      `  ${m.id.padEnd(22)} ditulis=${String(m.lessonCount).padStart(3)}  nyata=${String(nyata).padStart(3)}  ${ok ? 'OK' : '<<< MASALAH'}`
    );
  }
}

console.log(masalah === 0 ? '\nSemua modul ready sudah ada isinya.' : `\n${masalah} modul bermasalah.`);
process.exit(masalah === 0 ? 0 : 1);
BISANGODING_FILE_END
echo "   ditulis: cek-modul.mjs"

echo
echo "== 4. cek isi modul =="
node cek-modul.mjs

echo
echo "Selesai. Sekarang jalankan:  npm run build && npm run test:unit"
