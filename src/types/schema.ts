export interface Course {
  id: string;
  title: string;
  /** Nama singkat di kartu (kalau judul terlalu panjang), contoh "English for IT". */
  namaPendek?: string;
  language: string;
  short?: string;
  order: number;
  description?: string;
  /** Deskripsi satu kalimat untuk kartu di halaman Semua Kelas. */
  ringkas?: string;
  status?: 'ready' | 'soon';
  /** Kelas baru yang sedang disiapkan (ditandai ungu "Segera · Kelas baru" dan punya halaman rencana). */
  baru?: boolean;
  /** Chip tambahan di halaman rencana kelas baru, contoh "Teori + latihan soal". */
  infoRencana?: string[];
  /** Daftar modul yang direncanakan untuk kelas baru. */
  rencana?: BagianRencana[];
}

export interface BagianRencana {
  judul: string;
  sub: string;
  modul: { judul: string; isi: string }[];
}

/** content/jalur-karier.json */
export interface ItemJalur {
  kelas: string;
  /** Nama di kartu kalau berbeda dari judul kelas. */
  nama?: string;
  topik: string;
  /** Pengganti "N modul" setelah "Tersedia · ". Boleh memakai {n} untuk jumlah modul. */
  meta?: string;
  /** Kelas baru sebagian tersedia, contoh "DOM segera". */
  sebagian?: string;
  /** Modul tujuan saat kartu diklik (halaman kelas dibuka di modul ini). */
  modul?: string;
  /** Bagian kelas ini belum ada walaupun kelasnya sudah dibuka (kartu tampil "Segera hadir"). */
  segera?: boolean;
  /** Khusus Fondasi: bagian kelas yang dipakai semua jalur, contoh "Dasar". */
  bagian?: string;
}

export interface TahapJalur {
  judul: string;
  deskripsi: string;
  /** Antar grup = "ATAU" (pilih salah satu); di dalam grup = "+" (pelajari keduanya). */
  grup: ItemJalur[][];
}

export interface JalurKarier {
  id: string;
  judul: string;
  ikon: 'server' | 'layout' | 'cloud' | 'layers';
  warna: 'kuning' | 'cyan' | 'ungu' | 'pink';
  /** Kelas tambahan tanpa urutan wajib: label "TOPIK" (bukan "TAHAP") dan tidak dihitung di "Dipakai di jalur". */
  bebas?: boolean;
  ringkas: string;
  intro: string;
  tahap: TahapJalur[];
}

export interface DataJalurKarier {
  jalur: JalurKarier[];
  fondasi: ItemJalur[];
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
  language?: 'java' | 'javascript' | 'html' | 'css';
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
  | TypeTranslationCard
  | HtmlCssPreviewCard
  | HtmlPreviewCard
  | PraktikTerminalCard
  | PraktikGitHubCard;

/** Satu langkah di terminal tiruan. Isian {{nama}} lihat src/lib/praktikTerminal.ts. */
export interface LangkahTerminal {
  /** Kata-kata Lingga sebelum langkah ini. Boleh memakai `kode` dan **tebal**. */
  arahan: string;
  /** Pola perintah yang diterima. */
  terima: string[];
  /** Keluaran asli dari git/terminal. Kosong kalau perintahnya tidak menampilkan apa-apa. */
  keluaran: string;
  /**
   * Contoh dari Lingga: perintahnya diketik sendiri oleh Lingga (huruf demi huruf), lalu keluarannya
   * tampil. Hanya langkah pertama yang boleh otomatis; langkah lain adalah tugas pengguna (minimal 2).
   */
  otomatis?: boolean;
  /**
   * Tantangan: arahan hanya menyebut tujuan, tidak menyebut perintahnya. Dipakai untuk perintah yang
   * sudah pernah diketik sebelumnya. `petunjuk` mengingatkan tanpa membocorkan perintah lengkap.
   */
  tantangan?: boolean;
  /** Cara lain yang juga benar tapi keluarannya berbeda (misalnya `git log` untuk `git log --oneline`). */
  alternatif?: { terima: string[]; keluaran: string }[];
  /** Folder yang tampil di prompt setelah perintah ini (misalnya setelah cd). */
  folderBaru?: string;
  /** Reaksi Lingga setelah perintah benar. */
  benar?: string;
  /** Petunjuk Lingga kalau ketikan pengguna salah. */
  petunjuk: string;
  /**
   * Kesalahan yang sering terjadi. `keluaran` = keluaran asli git untuk perintah salah itu;
   * kosongkan (tidak diisi) kalau perintahnya tidak boleh dijalankan, cukup reaksi Lingga.
   */
  salah?: { terima: string[]; keluaran?: string; reaksi: string }[];
}

export interface PraktikTerminalCard {
  type: 'praktik_terminal';
  judul: string;
  folder: string;
  pembuka: string;
  langkah: LangkahTerminal[];
  penutup: string;
  bawaan?: Record<string, string>;
  tantangan?: { tugas: string; perintah: string; pola: string[]; berhasil: string };
}

export interface SalahGitHub {
  target: string;
  reaksi: string;
}

export interface LangkahGitHub {
  arahan: string;
  layar: string;
  target: string;
  isian?: string;
  otomatis?: boolean;
  tantangan?: boolean;
  benar?: string;
  petunjuk: string;
  salah?: SalahGitHub[];
}

export interface LayarGitHub {
  templat:
    | 'repo'
    | 'daftar_issue'
    | 'form_issue'
    | 'pull_request'
    | 'form_pr'
    | 'pengaturan'
    | 'projects'
    | 'form_gist'
    | 'form_umum'
    | string;
  repo?: string;
  tabAktif?: string;
  judul?: string;
  deskripsi?: string;
  nomor?: number;
  menuAktif?: string;
  bannerCompare?: boolean;
  tombolTeks?: string;
  issueCount?: number;
  prCount?: number;
  items?: Array<{ id: string; nomor?: number; judul: string; status?: string; waktu?: string; label?: string }>;
  elemen?: Record<string, string>;
  [key: string]: unknown;
}

export interface PraktikGitHubCard {
  type: 'praktik_github';
  judul: string;
  pembuka: string;
  penutup: string;
  bawaan?: Record<string, string>;
  langkah: LangkahGitHub[];
  layar: Record<string, LayarGitHub>;
}

export interface HtmlPreviewCard {
  type: 'html_preview';
  prompt: string;
  html: string;
}

export interface HtmlCheck {
  selector: string;
  message: string;
  count?: number;
  min?: number;
  text?: string;
  notText?: string;
  attribute?: string;
  value?: string;
}


export interface HtmlCssPreviewCard {
  type: 'html_css_preview';
  initialTab?: 'html' | 'css';
  prompt?: string;
  html: string;
  css: string;
}

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
  htmlChecks?: HtmlCheck[];
  cssChecks?: { selector: string; property: string; value: string; media?: string }[];
  fullDocument?: boolean;
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
  /** Tanggal lokal (YYYY-MM-DD) terakhir menyelesaikan materi. Dasar perhitungan streak. */
  streakDate?: string;
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
