# TODO — Website Belajar Java Pribadi

> Instruksi untuk AI agent: kerjakan berurutan dari atas ke bawah. Centang (`[x]`) setiap tugas yang selesai langsung di file ini. Setelah satu tahap selesai, berhenti, laporkan hasilnya, dan tunggu persetujuan sebelum lanjut ke tahap berikutnya. Jangan menambahkan server, database, API key, atau layanan berbayar.

---

## Tahap 0 — Perencanaan (tunggu persetujuan)
- [x] Tulis rencana struktur folder project
- [x] Tulis skema TypeScript untuk `Module`, `Lesson`, `Card` (semua tipe kartu), dan `UserProgress`
- [x] Buat contoh 1 pelajaran lengkap dalam JSON (semua tipe kartu terwakili)
- [x] Buat daftar 30 modul beserta target jumlah pelajaran di `content/modules.json`
- [x] **Berhenti & minta persetujuan**

## Tahap 1 — Setup Project
- [x] Inisialisasi Vite + React + TypeScript
- [x] Pasang dan konfigurasi Tailwind CSS
- [x] Pasang React Router (gunakan `HashRouter` agar aman di GitHub Pages)
- [x] Atur `base` path di `vite.config.ts` untuk GitHub Pages
- [x] Buat struktur folder: `src/components`, `src/pages`, `src/lib`, `src/types`, `content/`
- [x] Siapkan ESLint + Prettier
- [x] Buat workflow `.github/workflows/deploy.yml` (build & deploy ke GitHub Pages saat push ke `main`)
- [x] Buat README awal (cara install, run lokal, deploy)
- [x] Pastikan `npm run build` sukses dan halaman kosong tampil di GitHub Pages

## Tahap 2 — Layout & Navigasi
- [x] Layout mobile-first dengan navigasi bawah: Belajar, Playground, Profil
- [x] Halaman Dashboard: daftar 30 modul (nomor, judul, `x/y pelajaran`, estimasi durasi)
- [x] Progress bar total (persen + `x / 610 selesai`)
- [x] Halaman Detail Modul: daftar pelajaran dengan status (terkunci / tersedia / selesai)
- [x] Halaman Profil/Pengaturan (kosong dulu, diisi di Tahap 5)
- [x] Uji tampilan di lebar 360px dan desktop

## Tahap 3 — Engine Pelajaran
- [x] Loader konten: baca file JSON pelajaran dari `content/`
- [x] Halaman Pelajaran: tampilkan kartu satu per satu dengan tombol Lanjut/Kembali + indikator posisi kartu
- [x] Komponen kartu `theory` (render markdown + blok kode ber-highlight)
- [x] Komponen kartu `multiple_choice` + penjelasan setelah menjawab
- [x] Komponen kartu `fill_blank`
- [x] Komponen kartu `reorder` (drag & drop, juga bisa tap di HP)
- [x] Komponen kartu `predict_output`
- [x] Komponen kartu `runnable` (editor + tombol Run)
- [x] Komponen kartu `code_challenge` (editor + test case + petunjuk + "Lihat Solusi" setelah 3x gagal)
- [x] Kartu ringkasan di akhir pelajaran
- [x] Animasi/feedback benar-salah
- [x] Layar "Pelajaran Selesai" + tombol ke pelajaran berikutnya

## Tahap 4 — Eksekusi Java di Browser (CheerpJ)
- [x] Integrasikan CheerpJ 3 dari CDN resmi (bukan self-host)
- [x] Buat modul `src/lib/javaRunner.ts`: kompilasi dengan `javac` lalu jalankan class `Main`
- [x] Tangkap stdout & stderr ke panel output
- [x] Tampilkan error kompilasi dengan jelas (nomor baris jika tersedia)
- [x] Loading indicator saat JVM pertama kali dimuat; muat JVM sekali saja lalu gunakan ulang
- [x] Timeout eksekusi + tombol Stop agar infinite loop tidak membekukan tab
- [x] Dukungan input `Scanner` (stdin dari kolom input)
- [x] Validasi code challenge: bandingkan stdout dengan `expectedOutput` (abaikan spasi di akhir baris)
- [x] Halaman Playground bebas dengan template `Hello World`
- [x] Tandai pelajaran yang butuh Java 21 dengan label "Jalankan di komputer lokal (JDK 21)" dan sembunyikan tombol Run
- [x] Uji: hello world, loop, error kompilasi, exception runtime, infinite loop, input Scanner

## Tahap 5 — Progres & Gamifikasi (localStorage)
- [x] Modul `src/lib/storage.ts` dengan try/catch di setiap baca/tulis
- [x] Simpan status pelajaran selesai & jawaban latihan
- [x] Simpan posisi terakhir (lanjutkan dari pelajaran terakhir)
- [x] Sistem XP (pelajaran selesai + latihan benar)
- [x] Streak harian
- [x] Badge per modul selesai
- [x] Penguncian modul berurutan + opsi "Buka semua modul" di Pengaturan
- [x] Quiz akhir modul (10–15 soal acak, lulus ≥70%, bisa diulang)
- [x] Tombol **Export progres** (unduh JSON)
- [x] Tombol **Import progres** (unggah JSON + validasi format)
- [x] Tombol **Reset progres** dengan konfirmasi
- [x] Halaman sertifikat pribadi yang bisa dicetak (terbuka setelah semua modul selesai)

## Tahap 6 — Konten MVP
### Modul 1 — Java Dasar (32 pelajaran)
- [ ] Tulis 32 pelajaran lengkap (teori + runnable + minimal 1 latihan + ringkasan)
- [ ] Minimal 1 code challenge per 3 pelajaran
- [ ] Quiz akhir modul
- [ ] Uji semua kode contoh & solusi challenge benar-benar jalan di CheerpJ

### Modul 2 — Java OOP (45 pelajaran)
- [ ] Tulis 45 pelajaran lengkap
- [ ] Minimal 1 code challenge per 3 pelajaran
- [ ] Quiz akhir modul
- [ ] Uji semua kode contoh & solusi

### Kerangka Modul 3–30
- [ ] Buat file judul pelajaran untuk setiap modul sesuai target jumlah (konten diisi di Tahap 8)

## Tahap 7 — Polish
- [ ] Mode gelap (ikuti sistem + toggle manual)
- [ ] PWA: manifest, ikon, service worker (bisa di-install di HP)
- [ ] Pencarian pelajaran
- [ ] Catatan pribadi per pelajaran
- [ ] Loading & empty state di semua halaman
- [ ] Halaman 404
- [ ] Cek aksesibilitas dasar (kontras, ukuran tap target, label tombol)
- [ ] Cek performa: lazy-load editor & CheerpJ hanya saat dibutuhkan
- [ ] Lengkapi README: cara menambah pelajaran & format JSON tiap tipe kartu

## Tahap 8 — Konten Lanjutan (satu modul per sesi)
Untuk setiap modul: tulis semua pelajaran → quiz akhir → uji semua kode → centang.

- [ ] 3. Java Standard Classes (20)
- [ ] 4. Java Generics (13)
- [ ] 5. Java Collection (26)
- [ ] 6. Java Lambda (9)
- [ ] 7. Java Apache Maven (13) — *latihan pemahaman, tanpa Run*
- [ ] 8. Java Unit Test (26) — *latihan pemahaman + tugas lokal*
- [ ] 9. Java Dasar: Aplikasi Todolist (22) — *proyek*
- [ ] 10. Java Database / JDBC (17) — *latihan pemahaman + tugas lokal*
- [ ] 11. Java OOP: Aplikasi Todolist (19) — *proyek*
- [ ] 12. Java Stream (19)
- [ ] 13. Java Database: Aplikasi Todolist (12) — *proyek, tugas lokal*
- [ ] 14. Java Internationalization (11)
- [ ] 15. Java Date & Time (21)
- [ ] 16. Java Thread (33)
- [ ] 17. Java Reflection (20)
- [ ] 18. Java Validation (27) — *latihan pemahaman*
- [ ] 19. Java Logging (12) — *latihan pemahaman*
- [ ] 20. Java Lombok (18) — *latihan pemahaman*
- [ ] 21. Java Resilience4J (25) — *latihan pemahaman*
- [ ] 22. Java Input Output (23)
- [ ] 23. Java JSON (18) — *latihan pemahaman*
- [ ] 24. Java CSV (9) — *latihan pemahaman*
- [ ] 25. Java Web Servlet (27) — *latihan pemahaman + tugas lokal*
- [ ] 26. Java Persistence API (57) — *latihan pemahaman + tugas lokal*
- [ ] 27. Java 21 Sequenced Collection (7) — *tanpa Run, butuh JDK 21*
- [ ] 28. Java Virtual Thread (7) — *tanpa Run, butuh JDK 21*
- [ ] 29. Java Record (14)
- [ ] 30. Java Sealed Class (8)

## Checklist Akhir
- [ ] Total 610 pelajaran terisi
- [ ] Semua kode contoh & solusi yang punya tombol Run sudah diuji
- [ ] `npm run build` bersih tanpa warning penting
- [ ] Website live di GitHub Pages dan berjalan normal di HP
- [ ] Export → Reset → Import progres berhasil tanpa kehilangan data
- [ ] README lengkap