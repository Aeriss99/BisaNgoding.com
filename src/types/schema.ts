export interface Course {
  id: string;
  title: string;
  language: string;
  short?: string;
  order: number;
  description?: string;
  /** Deskripsi satu kalimat untuk kartu di halaman Semua Kelas. */
  ringkas?: string;
  status?: 'ready' | 'soon';
}

export interface Module {
  id: string;
  courseId?: string;
  title: string;
  order: number;
  lessonCount: number;
  status?: 'ready' | 'draft';
  requires?: string;
  estimatedHours?: number;
  language?: 'java' | 'javascript';
}

export interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  estimatedMinutes: number;
  runnable?: boolean;
  javaVersion?: number;
  mode?: 'latihan';
  tips?: string;
  newWords?: { word: string; meaning: string }[];
  glossary?: Record<string, string>;
  cards: Card[];
}

export interface UnderstandingCheckCard {
  type: 'understanding_check';
  minCorrect: number;
  questions: {
    question: string;
    code?: string;
    options: string[];
    answer: number;
    explanation: string;
    remedial: string;
  }[];
}

export interface TranslateTilesCard {
  type: 'translate_tiles';
  direction: 'en-id' | 'id-en';
  prompt: string;          // kalimat sumber
  tiles: string[];         // ubin jawaban + pengecoh
  answers: string[][];     // urutan ubin yang diterima; answers[0] = jawaban utama
  explanation?: string;
}

export interface ListenTilesCard {
  type: 'listen_tiles';
  text: string;            // kalimat Inggris yang dibacakan
  tiles: string[];
  answers: string[][];
  explanation?: string;
}

export interface MatchPairsCard {
  type: 'match_pairs';
  pairs: { en: string; id: string }[];   // 4-5 pasang
}

export interface TypeTranslationCard {
  type: 'type_translation';
  direction: 'en-id' | 'id-en';
  prompt: string;
  answers: string[];       // sudah huruf kecil, tanpa tanda baca akhir; answers[0] = jawaban utama
  explanation?: string;
}

export type Card =
  | TheoryCard
  | RunnableCard
  | MultipleChoiceCard
  | FillBlankCard
  | CodeChallengeCard
  | SummaryCard
  | ReorderCard
  | PredictOutputCard
  | UnderstandingCheckCard
  | TranslateTilesCard
  | ListenTilesCard
  | MatchPairsCard
  | TypeTranslationCard;

export interface TheoryCard {
  type: 'theory';
  content: string;
  image?: { src: string; alt: string };
}

export interface RunnableCard {
  type: 'runnable';
  html?: string;
  code: string;
  predict?: {
    question: string;
    options: string[];
    answer: number;
  };
  annotations?: { line: number; note: string }[];
  explanation?: string;
  tryThis?: { task: string; hint?: string }[];
}

export interface MultipleChoiceCard {
  type: 'multiple_choice';
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface FillBlankCard {
  type: 'fill_blank';
  code: string;
  answers: string[];
}

export interface CodeChallengeCard {
  type: 'code_challenge';
  html?: string;
  prompt: string;
  starterCode: string;
  steps?: string[];
  skeleton?: string;
  tests: {
    input: string;
    expectedOutput: string;
  }[];
  hints: string[];
  solution?: string;
}

export interface ReorderCard {
  type: 'reorder';
  prompt: string;
  lines: string[];
  correctOrder: number[];
}

export interface PredictOutputCard {
  type: 'predict_output';
  question?: string;
  code: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface SummaryCard {
  type: 'summary';
  points: string[];
}

export interface UserProgress {
  completedLessons: string[];
  passedChecks?: string[];
  moduleStatus: Record<string, 'locked' | 'unlocked' | 'completed'>;
  quizScores: Record<string, { score: number; passed: boolean }>;
  xp: number;
  streak: number;
  lastActiveDate: string;
  maxSeenDate?: string;
  version?: number;
  unlockAll?: boolean;
  justReset?: boolean;
  resetAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  code?: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface LangkahJalur {
  judul: string;
  deskripsi: string;
  kelas?: string;
  modul?: string[];
  segera?: boolean;
}

export interface JalurBelajar {
  id: string;
  judul: string;
  deskripsi: string;
  langkah: LangkahJalur[];
}

export interface Roadmap {
  jalur: JalurBelajar[];
  pendamping: {
    judul: string;
    deskripsi: string;
    kelas: string;
  };
}
