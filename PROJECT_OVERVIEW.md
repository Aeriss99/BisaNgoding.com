# Laporan Proyek BisaNgoding

## 1. RINGKASAN
Proyek **BisaNgoding** merupakan platform edukasi interaktif untuk belajar pemrograman (saat ini mendukung Java dan JavaScript) yang dapat mengeksekusi kode langsung di dalam browser. Tujuannya adalah menyediakan sarana belajar dari tingkat dasar hingga mahir, lengkap dengan sinkronisasi progres ke _cloud_, evaluasi berbasis kuis, serta proteksi _idle_ untuk memacu konsistensi pengguna (sistem _streak_).

**Tech Stack:**
- **Framework & UI:** React 19.2.8, Vite 8.3.0, React Router DOM 7.18, TailwindCSS 4 (gaya desain _Neo-brutalism_), UIW React CodeMirror.
- **Backend & Auth:** Supabase (supabase-js 2.116).
- **Eksekutor Kode:** CheerpJ 3 (untuk kompilasi dan _run_ Java di *browser* via iframe/WebWorker) dan fungsi asinkron kustom untuk JavaScript.
- **Testing:** Playwright 1.63 (E2E), Vitest 5.0 (Unit Test).

## 2. STRUKTUR FOLDER
Berikut adalah struktur direktori utama (hingga level 3), tidak termasuk `node_modules`, `.git`, dll:

```
.
├── content/              # Folder penyimpanan seluruh materi/materi modul format JSON
│   ├── js-module-.../    # Modul JavaScript
│   ├── module-.../       # Modul Java
│   ├── courses.json      # Metadata seluruh kursus (Java, JS)
│   └── modules.json      # Konfigurasi urutan dan daftar semua modul
├── docs/                 # Dokumentasi proyek (contoh: mockup UI, screenshot)
├── e2e/                  # Test skenario end-to-end dengan Playwright
│   ├── app.spec.ts
│   └── js-course.spec.ts
├── public/               # File statis dan aset untuk frontend
│   ├── ecj.jar           # Eclipse compiler (cadangan/alternatif)
│   ├── tools.jar         # Compiler Javac standar (dipakai CheerpJ)
│   └── illustrations/    # Gambar dan ikon vektor
├── reports/              # Hasil autogenerate (laporan tes spesifik)
├── src/                  # Source code utama React
│   ├── assets/           # Berkas statis tambahan
│   ├── components/       # Komponen UI React (cards, editor, layout)
│   ├── context/          # State management global (AuthContext, ProgressContext)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Core logic aplikasi (cloudProgress, javaRunner, quizLogic, supabase)
│   ├── pages/            # Halaman aplikasi (Landing, Dashboard, Lesson, Quiz)
│   ├── scripts/          # Script utilitas Node.js untuk validasi konten (test-content.js, dll)
│   ├── test/             # File test unit global / setup
│   └── types/            # Tipe data TypeScript (skema/schema.ts)
└── test-results/         # Direktori hasil logging Playwright
```

## 3. FITUR & ALUR UTAMA
- **Landing page publik (neo-brutalism):** Terdapat pada komponen `src/pages/Landing.tsx`. Menggunakan kelas utilitas dari TailwindCSS dengan bayangan tegas dan warna tebal.
- **Login Google + Supabase:** Menggunakan OAuth provider `google` via modul `src/context/AuthContext.tsx`. Proteksi halaman seperti Dashboard, Detail Modul, atau Kuis dilakukan melalui `AuthContext` (mengecek user).
- **Penyimpanan & Sinkronisasi Progress:** Diatur pada `src/lib/cloudProgress.ts`. Status pengerjaan _lesson_ (lokal `localStorage`) otomatis digabung (*merge*) dengan status di _cloud_ (Tabel Supabase `progres`). Jika progres berbeda, progres tertinggi atau terbaru menjadi prioritas.
- **Reset Progress Otomatis (Inactivity):** Logic tersimpan di `src/lib/resetLogic.ts`. Aplikasi mengandalkan _lastActiveDate_ dan membandingkannya dengan tanggal saat ini. Batas waktu _idle_ diambil dari `VITE_INACTIVE_DAYS` (default 7 hari). Jika melewati batas, _streak_, _xp_, dan kemajuan materi direset. Tanggal maksimum aktivitas juga dicatat (_maxSeenDate_) untuk menangkal trik mundurnya waktu pada jam sistem perangkat pengguna.
- **Format dan Lokasi Konten:** Konten berada di subfolder dalam `/content/`. File JSON (misal `lesson-01.json`) mendeskripsikan setiap tantangan. File berisi susunan *Card* seperti `TheoryCard`, `RunnableCard`, dan `CodeChallengeCard`. Konfigurasi daftar isi tersedia di `modules.json` dan `courses.json`.
- **Code Challenge & CheerpJ:** Fitur eksekutor *run/compile* diletakkan pada `src/lib/javaRunner.ts`. Aplikasi memuat compiler Java 8 (`tools.jar`) ke *iframe* via library web assembly **CheerpJ versi 3**. Pesan (kode untuk dites) akan dikompilasi, kemudian outputnya divalidasi ke `expectedOutput` di _lesson_. Sedangkan untuk JS dijalankan secara _sandbox_ lewat `src/lib/jsRunner.ts` memakai Web Worker atau *iframe*. Walaupun beberapa materi punya atribut `"javaVersion": 17`, compiler standard di dalam browser (melalui `tools.jar`) masih didasarkan pada kompilasi standar CheerpJ. 
- **Kuis Akhir Modul:** Diperiksa dan dieksekusi di `src/pages/Quiz.tsx` beserta `src/lib/quizLogic.ts`. Logikanya mengambil **maksimal 20 soal** secara acak dari _bank soal_ kuis bersangkutan (misal `quiz.json` di dalam folder modul), mengacak urutan pilihannya, lalu memberi status _passed_ jika skor minimal **70**.

## 4. DATABASE (SUPABASE)
Struktur database (Supabase) disimpulkan dari kode skema TS (`src/types/schema.ts`):
- **Tabel `progres`**: 
  - **Kolom Utama**:
    - `user_id` (PK, string, mapping ke UUID _auth.users_)
    - `data` (Tipe data JSON/JSONB yang berisi format `UserProgress`: `completedLessons`, `quizScores`, `xp`, `streak`, `lastActiveDate`, dll).
- **RLS (Row Level Security)**: Mengingat query hanya berupa metode `upsert` dan `select` yang difilter oleh `eq('user_id', userId)` dengan anon_key di bagian klien (`supabase.ts`), implementasi Row-Level Security telah diletakkan di Supabase untuk memastikan klien hanya dapat mengakses *row* miliknya sendiri. Terdapat satu fungsi RPC yang dapat dipanggil: `is_admin`.
- **File Migrasi/Schema SQL**: Tidak ditemukan script *dump* SQL ataupun file migrasi `.sql` di repositori; asumsi diatur langsung via *dashboard* Supabase CLI / UI.

## 5. KONFIGURASI
- **Environment Variables yang Dibutuhkan:**
  - `VITE_UNLOCK_ALL` (boolean status _debug/cheat_ buka semua materi)
  - `VITE_INACTIVE_DAYS` (integer tenggat hari reset data)
  - `VITE_RESET_MODE`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Script package.json:**
  - `dev`: Memulai dev server Vite.
  - `build`: Mengompilasi TypeScript (`tsc -b`) dan membuat build production (`vite build`).
  - `preview`: Menjalankan server hasil build untuk preview.
  - `lint`: Memeriksa sintaks dan aturan dengan `oxlint`.
  - `test:all`: Menjalankan berurutan: test content -> test java -> test unit -> build -> test e2e.
  - `test:content`: Menjalankan `node src/scripts/test-content.js` untuk memvalidasi skema/format JSON tiap materi modul.
  - `test:java`: Menjalankan `node src/scripts/test-java.js` untuk mengompilasi/menguji _solution code_ dari konten materi JSON.
  - `test:unit`: Menjalankan Vitest (`vitest run`).
  - `test:e2e`: Menjalankan E2E testing lewat Playwright (`playwright test`).
- **Konfigurasi Hosting:** Proses CI/CD diatur di `.github/workflows/deploy.yml` yang secara otomatis menjalankan test, build Vite, lalu mendeploy artefak hasilnya ke **GitHub Pages**.

## 6. TESTING
- **Framework yang dipakai:**
  - `@playwright/test`: Menguji _end-to-end_ navigasi, auth, dan berjalannya modul (lokasi `e2e/app.spec.ts`, `e2e/js-course.spec.ts`).
  - `vitest`: Menguji unit _core logic_ seperti progress, quiz, jsRunner, resetLogic, content (lokasi di samping komponen atau di `src/test/`).
  - *Custom Node Scripts*: Tes kustom untuk sintaks JSON dan keabsahan kode Java.
- **Cara menjalankan:** Dapat dipanggil melalui command `npm run test:all` (menjalankan komplit seluruh rangkaian tes).

## 7. STATUS PROJECT
- **Materi Modul**:
  - **Ready / Selesai:** Java Dasar, Proyek Aplikasi Todolist (Java), Java OOP, Java 17: Record & Sealed Class, JavaScript Dasar, Proyek Todolist (JavaScript).
  - **Kosong / Draft (masih belum bisa diakses publik):** Puluhan modul Java tingkat lanjut (Standard Classes, Generics, Lambda, JPA, Multithreading, dll) dan JavaScript lanjutan (JS OOP, DOM, Async).
- **Fitur Selesai**: Autentikasi Google, mekanisme code editor (_runner_ JS dan Java di browser), sinkronisasi progres _cloud_ (_offline-online merge_), fitur reset _streak/inactivity_, _quiz_ akhir modul, navigasi _Course_ menjadi _Module_.
- **TODO Terbuka (berdasarkan file `TODO.md`)**:
  - Menyelesaikan integrasi _bundle_ JavaScript Dasar & Todolist dengan memindahkan materi dari `BUNDLE.txt` ke dalam `content/js-module-...`.
  - Menimpa entri konten modul JS (`modules.json`) sesuai urutan yang tidak konflik dengan kelas Java.
  - Memastikan validasi unit-test konten _solution lesson_ berhasil pada `jsRunner`.
- **10 Commit Terakhir**:
  1. `ea32671` feat: masukkan bundle js dasar & todolist, update test content js
  2. `5c307ce` fix: CourseDetail menampilkan daftar modul, PWA icons diganti ke PNG asli
  3. `db87586` fix(pwa): naikkan maximumFileSizeToCacheInBytes ke 5MB agar build CI tidak gagal
  4. `4f0e5b1` fix: tombol kembali di ModuleDetail mengarah ke /kelas/:courseId
  5. `5ff1e63` fix: commit content.ts with coursesData export (missing from repo)
  6. `a8767f8` fix(test): mock jsRunner di QuizCards & Bagian6 test
  7. `c5a1002` fix: commit jsRunner.ts & test (missing from repo, breaking CI)
  8. `c8f9199` fix: commit package.json & lock with @codemirror/lang-javascript
  9. `50ea3de` feat: ubah struktur Modul -> Kelas (landing, dashboard, route /kelas/:courseId)
  10. `68ff18f` feat: add Java 17 module (Record & Sealed Class)

## 8. CATATAN RISIKO
- **Performa _Download_:** Menjalankan file compiler Java (`tools.jar`) dalam jumlah besar (~puluhan megabyte) bisa sangat menghambat kinerja dan _bandwidth_ di jaringan yang tidak stabil pada kunjungan awal sebelum diselamatkan cache *PWA Service Worker*.
- **Kode Duplikat & Maintenance:** Banyak teks remedial dan hint yang diduplikasi manual di banyak soal (file JSON materi). Bila nanti ada perbaikan ejaan pada teks remedial, developer harus mencari dan menggantinya satu per satu.
- **Keamanan Isolasi Skrip (JS):** Penggunaan instruksi `new Function` pada `src/lib/jsRunner.ts` berisiko terekspos injeksi bila dijalankan dalam _context_ web langsung (non-sandbox iframe atau worker tertembus), meskipun aplikasinya berjalan _client-side_.
- **Dependensi Eksternal CheerpJ:** Penggunaan *loader* eksternal `https://cjrtnc.leaningtech.com/3.0/cj3loader.js` berisiko tinggi. Jika suatu hari URL atau API versi 3.0 berubah atau ditarik pihak ketiga, seluruh kemampuan eksekusi kode Java aplikasi di _client-side_ akan putus (broken feature).