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
  /** Modul penutup kelas (Proyek Akhir): terbuka kalau semua modul lain di kelasnya selesai
   *  dan rata-rata nilai quiz kelas itu minimal rataQuizMinimal. */
  syaratAkhir?: { rataQuizMinimal: number; namaLulus: string };
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
  | ReactPreviewCard
  | PraktikTerminalCard
  | PraktikGitHubCard
  | PraktikJavaCard
  | PraktikExcelCard
  | PraktikPythonCard
  | CekGitHubCard;

/** Proyek Akhir sungguhan: memeriksa satu tahap di repo GitHub pengguna lewat API publik (src/lib/cekGithub.ts). */
export interface CekGitHubCard {
  type: 'cek_github';
  tahap: number;
  judul: string;
  /** Isian tambahan berupa tautan bukti, misalnya alamat papan Projects atau pull request. */
  bukti?: { label: string; contoh: string };
}

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

/** Satu langkah praktik di konsol Python >>>. Logika di src/lib/pythonRunner.ts. */
export interface LangkahPython {
  /** Kata-kata Lingga sebelum langkah ini. Boleh memakai `kode` dan **tebal**. */
  arahan: string;
  /** Baris yang benar (contoh jawaban). Hanya satu baris. */
  perintah: string;
  /** Keluaran yang harus muncul (dibandingkan setelah spasi di awal/akhir dibuang). Kosong = tidak boleh ada keluaran. */
  keluaran?: string;
  /** Ekspresi Python yang harus bernilai True setelah baris dijalankan, contoh "harga == 25000". */
  cek?: string;
  /** Langkah sengaja memunculkan error jenis ini (contoh "NameError"), untuk belajar membaca error. */
  galat?: string;
  wajib?: { pola: string; pesan: string }[];
  otomatis?: boolean;
  tantangan?: boolean;
  benar?: string;
  petunjuk: string;
  salah?: { pola: string; reaksi: string }[];
}

export interface PraktikPythonCard {
  type: 'praktik_python';
  judul: string;
  pembuka: string;
  penutup: string;
  /** Kode yang dijalankan diam-diam sebelum langkah pertama (misalnya membuat list contoh). */
  persiapan?: string;
  langkah: LangkahPython[];
}

/** Satu langkah praktik di lembar Excel tiruan. Logika rumus di src/lib/excel.ts. */
export interface LangkahExcel {
  /** Kata-kata Lingga sebelum langkah ini. Boleh memakai `kode` dan **tebal**. */
  arahan: string;
  /** Sel yang diisi pelajar, contoh "D2". */
  sel: string;
  /** Kalau diisi, isian di `sel` disalin (AutoFill) sampai sel ini, contoh "D6". */
  sampai?: string;
  /** Isian yang benar (rumus berawalan = atau nilai). Ketikan pelajar benar kalau hasil di semua sel sama. */
  jawaban: string;
  /** Pola (regex, huruf besar-kecil diabaikan) yang wajib ada, misalnya fungsi yang sedang dipelajari. */
  wajib?: { pola: string; pesan: string }[];
  /** Contoh dari Lingga: hanya langkah pertama. */
  otomatis?: boolean;
  /** Tantangan: arahan hanya menyebut tujuan karena rumusnya sudah pernah dipakai. */
  tantangan?: boolean;
  benar?: string;
  petunjuk: string;
  /** Kesalahan yang sering terjadi: pola regex pada ketikan (tanpa spasi) dan reaksi Lingga. */
  salah?: { pola: string; reaksi: string }[];
}

export type FormatSelExcel = 'umum' | 'ribuan' | 'rupiah' | 'desimal2' | 'persen' | 'tanggal';

export interface PraktikExcelCard {
  type: 'praktik_excel';
  judul: string;
  pembuka: string;
  penutup: string;
  /** Isi awal lembar: alamat -> angka, teks, atau rumus berawalan =. */
  sel: Record<string, string | number>;
  /** Format tampilan per kolom ("C") atau per sel ("C2"). */
  format?: Record<string, FormatSelExcel>;
  /** Lebar kolom dalam piksel, contoh { "A": 120 }. */
  lebar?: Record<string, number>;
  langkah: LangkahExcel[];
}

/** Satu langkah praktik Java bersama Lingga. Lihat src/lib/praktikJava.ts. */
export interface LangkahJava {
  /** Kata-kata Lingga sebelum langkah ini. Boleh memakai `kode` dan **tebal**. */
  arahan: string;
  /** Kode di editor saat langkah dimulai. Kalau kosong, lanjut dari jawaban langkah sebelumnya. */
  kodeAwal?: string;
  /** Kode yang benar (seluruh class Main). Contoh Lingga mengetik kode ini; tugas memakainya untuk "Lihat jawabannya". */
  jawaban: string;
  /** Keluaran asli dari menjalankan `jawaban` (dicek tes dengan Java 8). Kode pengguna benar kalau keluarannya sama. */
  keluaran: string;
  /** Input keyboard (System.in) saat dijalankan, untuk materi Scanner. */
  input?: string;
  /** Pola (regex) yang wajib ada di kode, supaya tugas tidak diselesaikan dengan mencetak teks jadi. */
  wajib?: { pola: string; pesan: string }[];
  /** Contoh dari Lingga: hanya langkah pertama, kodenya diketik Lingga lalu dijalankan. */
  otomatis?: boolean;
  /** Tantangan: arahan hanya menyebut tujuan karena kodenya sudah pernah ditulis di materi sebelumnya. */
  tantangan?: boolean;
  /** Reaksi Lingga setelah benar. */
  benar?: string;
  /** Petunjuk Lingga kalau keluarannya belum sama. */
  petunjuk: string;
}

export interface PraktikJavaCard {
  type: 'praktik_java';
  /** Bahasa kode praktik. Kosong = Java. 'typescript' = diperiksa tsc (strict) lalu dijalankan. */
  bahasa?: 'typescript' | 'nodejs';
  judul: string;
  pembuka: string;
  langkah: LangkahJava[];
  penutup: string;
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
    | 'daftar_pr'
    | 'pull_request'
    | 'form_pr'
    | 'pengaturan'
    | 'projects'
    | 'form_gist'
    | 'form_umum'
    | 'halaman_umum'
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
  /** halaman_umum: tombol yang bisa diklik, isian yang sudah terisi, dan daftar baris teks. */
  tombol?: { id: string; teks: string; utama?: boolean }[];
  isian?: { label: string; nilai: string }[];
  daftar?: string[];
  /** Label di samping nama repo, bawaan "Public". */
  labelRepo?: string;
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

/** Contoh kode React yang bisa diubah dan langsung dijalankan (src/lib/reactPreview.ts). */
export interface ReactPreviewCard {
  type: 'react_preview';
  prompt: string;
  /** Isi App.jsx. Komponen yang di-export default ditampilkan otomatis. */
  code: string;
  /** CSS tambahan untuk pratinjau (tidak bisa diubah pengguna). */
  css?: string;
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
  question?: string;
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

export interface EntriLatihanUlang {
  jenis: 'cek' | 'quiz';
  /** lessonId untuk 'cek', moduleId untuk 'quiz'. */
  sumber: string;
  /** Berapa kali BERTURUT-TURUT dijawab benar di halaman Latihan Ulang (0, 1, atau 2). */
  benar: number;
  /** true kalau sudah benar 2 kali berturut-turut. Entri tidak dihapus (supaya tidak muncul lagi saat
   *  progres dari perangkat lain digabung), cukup ditandai selesai. */
  selesai: boolean;
  /** Waktu terakhir entri berubah, ISO. Dipakai saat menggabung progres. */
  diubah: string;
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
  /** Soal yang pernah dijawab salah. Kunci: lihat src/lib/latihanUlang.ts. */
  latihanUlang?: Record<string, EntriLatihanUlang>;
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
