# BisaNgoding.com

Website belajar coding interaktif dan gratis dalam bahasa Indonesia. Materinya pendek-pendek, setiap pelajaran ditutup latihan, dan kode Java maupun JavaScript langsung dijalankan di browser tanpa perlu instal apa pun.

## Kelas

| Kelas | Isi |
| --- | --- |
| **Java** | Java Dasar, Proyek Todolist, OOP, Collection, Record & Sealed Class, Standard Classes, Generics, Lambda, Stream |
| **JavaScript** | JavaScript Dasar, Proyek Todolist, JavaScript OOP, dan JavaScript DOM |
| **Git & GitHub** | Git di laptop sampai GitHub: tag dan versi rilis, pull request, code review, manajemen proyek, keamanan, dan CI/CD |
| **Linux & Terminal** | Mengenal Linux, terminal dan navigasi, file dan folder, membaca dan mencari teks, permission, menginstal program, proses dan service, jaringan dan SSH, bash scripting, cron, mengamankan server, web server Nginx |
| **RESTful API** | HTTP, prinsip REST, curl dan fetch, desain API, OpenAPI, keamanan (OWASP API Top 10), proyek API toko online |
| **English for IT** | Bahasa Inggris dasar sehari-hari sampai bahasa Inggris dunia kerja IT, dengan latihan mendengar dan menyusun kalimat |

## Fitur

- **Kode berjalan di browser.** Java dijalankan dengan [CheerpJ](https://cheerpj.com/), JavaScript dengan Web Worker. Tidak perlu server.
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
  java/               modules.json + satu folder per modul (lesson-XX.json, quiz.json)
  javascript/
  git/
  english/
public/               gambar, audio, ikon, dan tools.jar untuk CheerpJ
src/
  components/         komponen tampilan (kartu materi, layout, latihan English)
  context/            login dan progres
  lib/                logika: konten, quiz, runner Java/JS, suara
  pages/              halaman
  test/               test unit
scripts/              cek konten, validasi materi, test Java
e2e/                  test Playwright
.github/workflows/    build dan deploy ke GitHub Pages
```

## Menambah materi

Materi hanya berupa file JSON, tanpa perlu mengubah kode:

1. Buat folder modul di `content/<kelas>/`, lalu isi dengan `lesson-01.json`, `lesson-02.json`, dan seterusnya, ditambah `quiz.json`.
2. Daftarkan modulnya di `content/<kelas>/modules.json` (`id`, `title`, `order`, `lessonCount`, `status: "ready"`, `requires`).
3. Jalankan `npm run build && npm run test:content`. Untuk kelas Java, jalankan juga `npm run test:java`.

Jenis kartu dan field-nya ada di `src/types/schema.ts`. Kode Java yang dijalankan di browser harus kompatibel dengan **Java 8**, karena CheerpJ menjalankan Java 8. Pelajaran yang butuh fitur lebih baru diberi `"javaVersion": 17` dan dipraktikkan di komputer pelajar.

## Deploy

Setiap push ke branch `main` menjalankan test, build, lalu deploy ke GitHub Pages lewat `.github/workflows/deploy.yml`. `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` diambil dari GitHub Secrets.
