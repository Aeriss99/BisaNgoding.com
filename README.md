# BisaNgoding.com

Website belajar coding interaktif dan gratis dalam bahasa Indonesia. Materinya pendek-pendek, setiap pelajaran ditutup latihan, dan kode Java maupun JavaScript langsung dijalankan di browser tanpa perlu instal apa pun.

## Kelas

| Kelas | Isi |
| --- | --- |
| **Java** | Java Dasar, Proyek Todolist, OOP, Collection, Record & Sealed Class, Standard Classes, Generics, Lambda, Stream, Date & Time |
| **JavaScript** | JavaScript Dasar, Proyek Todolist, JavaScript OOP, JavaScript DOM, Standard Library, Async, dan Modules |
| **TypeScript** | Tipe dasar, object dan interface, fungsi, union dan narrowing, generics, class, utility types, async dan module, tooling (tsc, tsconfig, npm) dan proyek Todolist; kode diperiksa compiler TypeScript asli (strict) di browser |
| **Node.js** | Node.js dasar, ESM dan CommonJS, npm, file system, async dan event loop, stream, HTTP server, Express 5, middleware dan validasi Zod, REST API berlapis, autentikasi (bcrypt, JWT), PostgreSQL dengan Prisma, testing (node:test, Supertest), produksi dan deploy, proyek REST API Todolist; kode Node.js jalan di browser |
| **Git & GitHub** | Git di laptop sampai GitHub: tag dan versi rilis, pull request, code review, manajemen proyek, keamanan, CI/CD, memperbaiki riwayat (amend, revert, reset, rebase), dan alur kerja tim |
| **Tailwind CSS** | Tailwind v4: warna, spacing, flexbox, grid, responsif mobile-first, state, group/peer, dark mode, nilai bebas, tema dengan @theme, @apply, dan proyek tampilan Todolist (pratinjau jalan di browser) |
| **React** | React 19: komponen dan JSX, props, render bersyarat, daftar dan key, state dan event, form terkendali, useRef, useEffect (dependency, cleanup, ambil data, localStorage, StrictMode), Context, useReducer, custom hook, React Router 7, dan proyek Todolist sampai build dan terbit (kode React jalan di browser) |
| **Linux & Terminal** | Mengenal Linux, terminal dan navigasi, file dan folder, membaca dan mencari teks, permission, menginstal program, proses dan service, jaringan dan SSH, bash scripting, cron, mengamankan server, web server Nginx |
| **Microsoft Excel** | Lembar kerja dan rumus (pengaturan Indonesia), SUM sampai referensi absolut, format Rupiah dan tanggal, IF, COUNTIF/SUMIF, fungsi teks dan tanggal, VLOOKUP, INDEX+MATCH, XLOOKUP, sort, filter, PivotTable, grafik, studi kasus dan simulasi tes kerja, dengan praktik di lembar Excel tiruan |
| **RESTful API** | HTTP, prinsip REST, curl dan fetch, desain API, OpenAPI, keamanan (OWASP API Top 10), proyek API toko online |
| **Spring Boot** | Spring Dasar: IoC, bean, dependency injection, component scan, scope dan siklus hidup bean (teori + praktik di komputer sendiri) |
| **DevOps** | Mengenal DevOps (siklus, CI/CD, container, DORA), Docker Dasar, Docker Compose, CI/CD Lanjutan (build image, versi, secret, cache, keamanan pipeline), Deploy ke Server, Kubernetes Dasar, Cloud Dasar, Monitoring dan Log, dan Terraform (teori + praktik di komputer sendiri) |
| **English for IT** | Bahasa Inggris dasar sehari-hari sampai bahasa Inggris dunia kerja IT, dengan latihan mendengar dan menyusun kalimat |

## Fitur

- **Kode berjalan di browser.** Java dijalankan dengan [CheerpJ](https://cheerpj.com/), JavaScript dengan Web Worker, TypeScript diperiksa compiler TypeScript asli sebelum dijalankan, dan Node.js (fs, http, Express) dijalankan runtime Node tiruan di Web Worker. Tidak perlu server.
- **Latihan bertahap.** Setiap pelajaran berisi teori, contoh yang bisa dijalankan, cek pemahaman, soal isian, dan tantangan kode. Setiap modul ditutup quiz dengan pilihan jawaban yang diacak.
- **Progres tersimpan.** Masuk dengan Google, lalu XP, streak, dan pelajaran yang selesai tersinkron lewat Supabase. Kalau offline, progres tetap tersimpan di perangkat.
- **Bisa dipasang di HP** sebagai aplikasi (PWA).

## Teknologi

Vite · React 19 · TypeScript · Tailwind CSS 4 · React Router · Supabase · CheerpJ · Vitest · Playwright

## Menjalankan di komputer

Butuh Node.js 22 atau lebih baru.

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

Untuk login dan sinkron progres, buat file `.env.local`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=kunci-anon-dari-supabase
```

Pakai **anon key** saja. Jangan pernah memasukkan `service_role` key ke proyek ini. File `.env.local` tidak ikut di-commit.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | server pengembangan |
| `npm run build` | cek konten, cek tipe, lalu build ke `dist/` |
| `npm run test:unit` | test unit (Vitest) |
| `npm run test:content` | validasi semua file materi |
| `npm run test:java` | kompilasi dan jalankan semua contoh kode Java (butuh JDK) |
| `npm run test:e2e` | test end-to-end (Playwright) |

## Struktur folder

```
content/              materi, satu folder per kelas
  courses.json        daftar kelas
  jalur-karier.json   jalur karier di beranda
  roadmap.json        rencana belajar per peran
  <kelas>/            java, javascript, typescript, nodejs, git, mysql, linux, html-css, tailwind, rest-api, english, excel, python
    modules.json      daftar modul kelas itu
    <modul>/          lesson-XX.json + quiz.json
public/               gambar, ilustrasi, audio English, ikon PWA, dan tools.jar untuk CheerpJ
src/
  components/         komponen tampilan (kartu materi, layout, latihan English)
  context/            login dan progres
  data/               data statis (daftar rekaman suara English)
  lib/                logika: konten, quiz, runner Java/JS, streak, suara
  pages/              halaman
  types/              tipe data konten (schema.ts)
  test/               test unit (beberapa test kecil ada di samping file yang diuji)
scripts/              cek konten, validasi materi, test Java, pengumuman modul baru
supabase/             Edge Functions dan migrasi database (notifikasi email)
e2e/                  test Playwright
.github/workflows/    cek.yml (test + build) dan rilis.yml (deploy dari tag versi)
```

## Menambah materi

Materi hanya berupa file JSON, tanpa perlu mengubah kode:

1. Buat folder modul di `content/<kelas>/`, lalu isi dengan `lesson-01.json`, `lesson-02.json`, dan seterusnya, ditambah `quiz.json`.
2. Daftarkan modulnya di `content/<kelas>/modules.json` (`id`, `title`, `order`, `lessonCount`, `status: "ready"`, `requires`).
3. Jalankan `npm run build && npm run test:content`. Untuk kelas Java, jalankan juga `npm run test:java`.

Jenis kartu dan field-nya ada di `src/types/schema.ts`. Kode Java yang dijalankan di browser harus kompatibel dengan **Java 8**, karena CheerpJ menjalankan Java 8. Pelajaran yang butuh fitur lebih baru diberi `"javaVersion": 17` dan dipraktikkan di komputer pelajar.

## Deploy

Situs hanya diperbarui saat **tag versi** di-push (contoh `v0.0.1`), lewat `.github/workflows/rilis.yml`: cek tag ada di `main`, test, build, deploy ke GitHub Pages, lalu umumkan modul baru. Nomor versi tampil di aplikasi dan di `version.json`.

Push ke `main`, `kecil/*`, atau `feat/*` hanya menjalankan test dan build (`.github/workflows/cek.yml`), tanpa mengubah situs.

Versi: angka terakhir untuk perbaikan (`v0.0.1` → `v0.0.2`), angka tengah untuk materi, kelas, atau fitur baru (`v0.0.2` → `v0.1.0`). Kembali ke rilis lama: Actions > **Rilis ke GitHub Pages** > **Run workflow** > pilih tag lama.

`VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` diambil dari GitHub Secrets.
