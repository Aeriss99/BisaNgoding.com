# TODO — BisaNgoding.com

Kerjakan semua tugas di file ini sebagai SATU pekerjaan, berurutan dari Tugas 1 sampai Tugas 6.
Wajib patuhi `agent.md`. Kalau ada aturan di file ini yang bertentangan dengan `agent.md`,
ikuti `agent.md` dan catat pertentangannya di `laporan.md`.
Tulis semua hasil ke `laporan.md`, bukan di chat.

---

## ATURAN WAJIB

1. Buat git commit checkpoint sebelum mulai: `checkpoint sebelum todo.md`.
2. Buat juga commit terpisah setelah setiap tugas selesai, supaya mudah di-rollback.
3. JANGAN ubah `src/lib/javaRunner.ts` atau integrasi CheerpJ.
4. JANGAN ubah `id`, `moduleId`, `order`, atau isi materi yang sudah ada. Progress pengguna
   tersimpan berdasarkan id.
5. JANGAN upgrade dependency. Package baru yang boleh diinstal hanya `@codemirror/lang-javascript`.
6. JANGAN menghapus, men-skip, atau melonggarkan test supaya lulus.
7. Maksimal 3 kali percobaan untuk error yang sama. Kalau masih gagal, tandai tugas itu
   GAGAL di `laporan.md`, lanjut ke tugas berikutnya yang tidak bergantung padanya.
   Jangan berputar-putar.
8. Sebelum mengerjakan setiap tugas, cek dulu apakah tugas itu sudah dikerjakan sebelumnya.
   Kalau sudah dan berfungsi benar, cukup verifikasi, tandai SUDAH ADA, lalu lanjut.
9. Gunakan `git mv` untuk memindahkan file.

---

## TUGAS 1 — Rapikan folder `content/` per kelas

Struktur target:

```
content/
├── courses.json        (daftar kelas: Java, JavaScript, Git & GitHub, Spring Boot, Node.js)
├── achievements.json   (tetap di sini kalau berlaku untuk semua kelas)
├── java/
│   ├── modules.json    (hanya modul Java)
│   ├── module-01-dasar/        (materi + quiz.json)
│   ├── module-01c-todolist/
│   ├── module-02-oop/
│   └── ...                     (semua modul, kuis, dan aplikasi Java)
└── javascript/
    ├── modules.json    (hanya modul JavaScript)
    └── ...                     (semua modul, kuis, dan aplikasi JS)
```

- SEBELUM memindahkan: catat jumlah modul, materi, dan kuis per kelas.
- Kuis dan aplikasi (seperti todolist) ikut di folder kelasnya masing-masing.
- Perbarui `import.meta.glob` di `content.ts` dan tempat lain yang memuat konten.
- SESUDAH dipindahkan: jumlah modul, materi, dan kuis harus sama persis. Tambahkan test otomatis
  yang mengecek hal ini.

## TUGAS 2 — Kelas JavaScript

- Tambahkan field opsional `language: 'java' | 'javascript'` pada Module (default `'java'`).
- Pastikan id lesson JS diawali `js-` dan tidak bentrok dengan id Java. Kalau ada yang bentrok,
  laporkan dulu, jangan langsung diganti.
- Buat `src/lib/jsRunner.ts` terpisah: jalankan kode di sandboxed iframe atau Web Worker,
  tangkap `console.log` sebagai stdout, bandingkan dengan `expectedOutput`.
  Wajib ada timeout (sekitar 3 detik) untuk mencegah infinite loop.
- Pilih runner dan bahasa editor CodeMirror berdasarkan `language` modul.
- Dukung blok ` ```javascript run ` seperti ` ```java run `.

## TUGAS 3 — Kembalikan kunci modul (Java dan JavaScript)

Masalah: setelah restrukturisasi, semua modul bisa dibuka tanpa terkunci.

- Bandingkan dengan commit SEBELUM restrukturisasi (`git log` / `git diff`) untuk menemukan aturan
  unlock yang lama (field `requires` dan syarat membuka modul berikutnya). Kembalikan aturan itu.
- Rantai kunci per kelas: modul pertama tiap kelas terbuka setelah login, modul berikutnya terbuka
  setelah syarat modul sebelumnya di kelas YANG SAMA terpenuhi. Kelas JS tidak butuh kelas Java.
- Tampilan modul terkunci:
  - ikon gembok menggantikan panah, kartu agak redup, badge `TERKUNCI`
  - teks kecil: "Selesaikan [nama modul sebelumnya] dulu"
  - tidak bisa diklik
- Kunci juga berlaku lewat URL langsung (`#/module/...` dan `#/lesson/...`): arahkan kembali
  ke halaman kelas.

## TUGAS 4 — Kelas "Segera Hadir"

- Daftarkan Git & GitHub, Spring Boot, dan Node.js di `content/courses.json` dengan status
  `coming_soon`. JANGAN buat folder atau file materi kosong untuk ketiganya.
- Aturan umum: kelas apa pun yang belum punya materi otomatis tampil terkunci di home dashboard:
  - ikon gembok (`Lock` dari lucide-react) dan label `Segera Hadir`
  - kartu agak redup, tidak bisa diklik, tidak bisa dibuka lewat URL langsung
  - gaya tetap neo-brutalism seperti kartu lainnya
- Begitu kelas itu punya materi, kuncinya hilang sendiri.

## TUGAS 5 — Sinkronisasi progress per akun

Tujuan: progress terikat ke akun Google, bukan device. Login dengan email yang sama di device mana pun
menampilkan progress yang sama untuk SEMUA kelas (materi selesai, skor & status lulus kuis, achievement).

- Supabase (tabel `progres`) adalah sumber utama. localStorage hanya cache.
- Kunci localStorage per akun: `bisangoding_progress:<user_id>`. Saat logout, hapus cache akun itu.
  Ganti akun di device yang sama tidak boleh mencampur progress.
- Saat login atau app dibuka dengan sesi aktif: ambil data cloud, gabungkan dengan cache lokal,
  simpan hasilnya ke keduanya. Aturan gabung:
  - `completedLessons` = gabungan keduanya
  - kuis = skor tertinggi, `passed` true jika salah satunya true
  - `lastActiveAt` = yang terbaru
- Hormati fitur reset karena tidak aktif: data lokal yang lebih lama dari waktu reset TIDAK boleh
  menghidupkan progress lama. Tambahkan field `resetAt` jika perlu.
- Tulis ke Supabase setiap ada perubahan (debounce sekitar 1 detik), simpan juga saat tab
  ditutup/disembunyikan, coba ulang jika offline.
- Ambil ulang data cloud saat tab kembali aktif.
- Indikator "Menyimpan..." di sidebar harus berubah menjadi "Tersimpan" setelah berhasil,
  atau menampilkan pesan gagal. Tidak boleh macet di "Menyimpan...".
- Pastikan RLS: user hanya bisa membaca/menulis baris miliknya sendiri, `user_id` unik.
  Kalau ada perubahan database, tulis SQL-nya di `laporan.md`.

## TUGAS 6 — Verifikasi

- Unit test:
  - fungsi merge progress (termasuk kasus reset dan ganti akun)
  - jsRunner (output benar, error, timeout)
  - logika unlock kedua kelas: modul 1 terbuka, modul 2 terkunci sebelum syarat terpenuhi,
    terbuka sesudahnya
  - test yang gagal kalau ada modul (selain modul pertama tiap kelas) tanpa `requires`
  - jumlah konten sebelum vs sesudah restrukturisasi
- E2E dengan Supabase di-mock: dua browser context dengan akun yang sama melihat progress yang sama;
  dua akun berbeda tidak saling melihat.
- Jalankan semua test, lint, dan build. Semua test lama harus tetap lulus.

---

## FORMAT `laporan.md`

Tulis ulang `laporan.md` dengan format berikut:

```
# Laporan — [tanggal]

## Ringkasan
| Tugas | Status | Catatan singkat |
|-------|--------|-----------------|
| 1. Folder per kelas     | SELESAI / SUDAH ADA / GAGAL / DILEWATI | ... |
| 2. Kelas JavaScript     | ... | ... |
| 3. Kunci modul          | ... | ... |
| 4. Kelas Segera Hadir   | ... | ... |
| 5. Sinkronisasi progress| ... | ... |
| 6. Verifikasi           | ... | ... |

## Detail per tugas
Untuk setiap tugas: penyebab masalah (jika ada), apa yang dilakukan, file yang diubah.

## Jumlah konten
Sebelum vs sesudah restrukturisasi, per kelas (modul / materi / kuis).

## Perubahan database
SQL yang perlu dijalankan di Supabase, atau "Tidak ada".

## Hasil test
Unit, E2E, lint, build: lulus/gagal beserta jumlahnya.

## Belum selesai / perlu keputusan saya
Daftar hal yang gagal, dilewati, atau butuh keputusan.

## Pertentangan dengan agent.md
Jika ada, atau "Tidak ada".
```