ATURAN WAJIB: sama seperti tugas sebelumnya (checkpoint git dulu, jangan ubah id materi,
jangan sentuh javaRunner/CheerpJ, maksimal 3 percobaan per error lalu berhenti dan lapor,
jangan melemahkan test, tulis daftar file yang akan diubah sebelum mengubah).

TUJUAN: progress terikat ke akun Google, bukan device. Login dengan email yang sama
di device mana pun harus menampilkan progress yang sama untuk SEMUA modul (Java dan JS),
termasuk materi selesai, skor & status lulus kuis, dan achievement.

TAHAP 1 — DIAGNOSIS (read-only): jelaskan alur sekarang. Kapan data diambil dari Supabase,
kapan ditulis, apakah localStorage bisa menimpa data cloud, dan apakah kunci
localStorage dibedakan per akun. Laporkan titik yang menyebabkan progress tidak ikut pindah device.

TAHAP 2 — PERBAIKAN:
- Supabase (tabel progres) adalah sumber utama. localStorage hanya cache.
- Kunci localStorage per akun: bisangoding_progress:<user_id>. Saat logout, hapus cache
  akun tersebut. Pastikan ganti akun di device yang sama tidak mencampur progress.
- Saat login / app dibuka dengan sesi aktif: ambil data cloud, GABUNGKAN dengan cache lokal,
  lalu simpan hasilnya ke keduanya. Aturan gabung:
  completedLessons = gabungan keduanya; kuis = ambil skor tertinggi, passed true jika salah satunya true;
  lastActiveAt = yang terbaru.
- Hormati fitur reset karena tidak aktif: kalau cloud sudah di-reset, data lokal yang lebih lama
  dari waktu reset TIDAK boleh menghidupkan progress lama. Tambahkan field resetAt jika perlu.
- Tulis ke Supabase setiap ada perubahan progress (debounce ~1 detik), simpan juga saat tab
  ditutup/disembunyikan, dan coba ulang jika offline.
- Ambil ulang data cloud saat tab kembali aktif, supaya pindah device langsung terlihat.
- Pastikan RLS: user hanya bisa membaca/menulis baris miliknya sendiri, user_id unik.

TAHAP 3 — VERIFIKASI:
- Unit test untuk fungsi merge (termasuk kasus reset dan ganti akun).
- E2E dengan Supabase di-mock: dua browser context dengan akun yang sama harus melihat
  progress yang sama; dua akun berbeda tidak boleh saling melihat.
- Jalankan semua test, lint, dan build.

LAPORAN AKHIR (singkat): penyebab masalah, file yang diubah, perubahan database/RLS
(jika ada, sertakan SQL-nya), hasil test, dan apa yang belum selesai.