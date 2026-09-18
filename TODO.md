# TODO — Java Dasar Siap Pakai (Lokal)

## Aturan Agent (WAJIB DIBACA)
1. Kerjakan dari atas ke bawah. Centang `[x]` hanya jika sudah dites dan berhasil.
2. Maksimal **3 percobaan** per masalah. Jika masih gagal, catat di LAPORAN.md lalu lanjut ke tugas berikutnya.
3. **JANGAN** mengubah isi materi di `content/module-01-dasar/lesson-*.json`.
4. **JANGAN** git push atau deploy.
5. **JANGAN** membuat mock/simulasi, dan jangan menghapus atau melewati tes.
6. Jalankan **hanya tes yang terkait** dengan bagian yang sedang dikerjakan. Tes lengkap hanya di Bagian 6.
7. Setiap bagian selesai: tambahkan 1 baris di `LAPORAN.md` (kolom Tes wajib berisi angka, contoh `LULUS 12/12`).
8. Balas ke user **singkat**, tanpa menampilkan kode.

---

## Bagian 1 — Semua Pelajaran Java Dasar Tampil & Terbuka
- [x] Pastikan 32 pelajaran (`lesson-01` s/d `lesson-32`) tampil di halaman Modul 1. Jika ada yang tidak tampil, cari penyebabnya (glob loader, validasi runtime, filter skeleton/draft, id dobel) dan tampilkan error di console, jangan dibuang diam-diam
- [x] Saklar `VITE_UNLOCK_ALL`: jika `true`, semua pelajaran java-dasar terbuka tanpa urutan; jika `false`/kosong, penguncian berurutan biasa
- [x] Buat `.env.local` berisi `VITE_UNLOCK_ALL=true` dan tambahkan `.env.local` ke `.gitignore`
- [x] Modul selain java-dasar tampil "Segera Hadir" dan tidak bisa dibuka
- [x] Hapus folder sisa `java-dasar-6-32/` di root project jika masih ada
- [x] Tes: unit test saklar unlock (true → semua terbuka, false → berurutan)

## Bagian 2 — Cek Kartu yang Dipakai Java Dasar
Java Dasar hanya memakai kartu: `theory`, `runnable`, `multiple_choice`, `code_challenge`, `summary`.
- [x] Pilihan ganda: jawaban salah → penjelasan + tombol **Coba Lagi** (tidak boleh macet)
- [x] Code challenge: dijalankan sekali per test case dengan `input` masing-masing (pelajaran 30 memakai input Scanner)
- [x] Code challenge: tombol **Lihat Solusi** setelah 3x gagal (field `solution` sudah ada di JSON)
- [x] Markdown teori tampil rapi: tabel, list, blok kode (`@tailwindcss/typography` aktif)
- [x] Error Boundary: jika satu kartu rusak, tampilkan pesan, bukan layar putih
- [x] Tes: unit test pilihan ganda salah → Coba Lagi; challenge dengan 2 test input

## Bagian 3 — Quiz Akhir Modul
- [ ] File `content/module-01-dasar/quiz.json` berupa array soal:
  `{ "id", "question", "code" (opsional), "options", "answer", "explanation" }`
  (belum dibuat — menunggu soal disediakan oleh user, sesuai aturan "jangan menulis soal sendiri")
- [x] Jika `quiz.json` belum ada atau kosong, tampilkan "Quiz belum tersedia". **Jangan menulis soal sendiri**, soal akan disediakan user
- [x] Tombol **Quiz Akhir** di halaman modul: terbuka setelah semua pelajaran selesai, atau selalu terbuka jika `VITE_UNLOCK_ALL=true`
- [x] Ambil **20 soal acak** dari bank soal, acak juga urutan opsinya, tampilkan satu per satu
- [x] Hasil akhir: skor, status lulus (≥ 70%), pembahasan soal yang salah, tombol Ulangi
- [x] Simpan skor terbaik & status lulus di progres (ikut Export/Import)
- [x] Modul dianggap selesai 100% hanya jika semua pelajaran selesai **dan** quiz lulus
- [x] Tes: unit test pengacakan 20 soal, hitung skor, lulus/tidak lulus, quiz kosong

## Bagian 4 — Progres di Dashboard
- [x] Dashboard menampilkan: `Java Dasar: x/32 pelajaran · Quiz: skor% (Lulus/Belum)`
- [x] Progress bar per modul
- [x] Tombol **Lanjutkan Belajar** menuju pelajaran terakhir yang belum selesai
- [x] Tes: unit test perhitungan progres modul

## Bagian 5 — Reset Otomatis (Tegas)
- [x] Env `VITE_INACTIVE_DAYS=7` dan `VITE_RESET_MODE=full` di `.env.local` (0 = fitur mati)
- [x] Saat app dibuka: jika tidak aktif ≥ `VITE_INACTIVE_DAYS` hari, hapus semua progres (pelajaran, quiz, XP, streak)
- [x] Anti-akal jam: simpan `maxSeenDate`; jika jam perangkat mundur, hitung dari `maxSeenDate`
- [x] Import ditolak jika `lastActiveDate` di file sudah lewat batas hari. Tidak ada tombol pulihkan
- [x] Peringatan di Dashboard 2 hari sebelum reset, dan pesan setelah reset terjadi
- [x] `lastActiveDate` diperbarui setiap kali user menyelesaikan kartu/pelajaran
- [x] Tes: 6 hari aman, 7 hari reset, jam dimundurkan, import file lama ditolak

## Bagian 6 — Pemeriksaan Akhir
- [ ] `npm run build` sukses tanpa error
- [ ] `test:content` + `test:java` untuk java-dasar lulus
- [ ] `test:e2e` untuk java-dasar: buka ke-32 pelajaran, klik semua kartu sampai selesai, tanpa error console
- [ ] Tidak ada kata "mock", "simulate", ".skip", ".only" di `src/` dan folder tes
- [ ] Tambahkan baris akhir di LAPORAN.md: jumlah tes, semua lulus, daftar yang diubah

---

## Nanti (JANGAN dikerjakan sekarang)
- Kartu `fill_blank`, `reorder`, `predict_output`
- Konten modul 2–30
- Mode gelap, badge, sertifikat, pencarian, catatan pribadi
- Deploy GitHub Pages 