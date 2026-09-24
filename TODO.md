ATURAN WAJIB (berlaku untuk seluruh tugas ini):
1. Sebelum mulai, buat git commit checkpoint: "checkpoint sebelum fix JS".
2. JANGAN ubah src/lib/javaRunner.ts, integrasi CheerpJ, atau konten Java yang sudah ada.
3. JANGAN ubah id materi/modul yang sudah ada, jangan rename folder yang sudah ada.
4. JANGAN upgrade dependency. Package baru yang BOLEH diinstal hanya @codemirror/lang-javascript.
5. JANGAN menghapus, men-skip, atau melonggarkan test supaya lulus.
6. Maksimal 3 kali percobaan untuk error yang sama. Kalau masih gagal, BERHENTI
   dan laporkan ke saya. Jangan berputar-putar.
7. Sebelum mengubah kode, tulis dulu daftar file yang akan diubah beserta alasannya.

TAHAP 1 — DIAGNOSIS (read-only, jangan ubah apa pun):
- Cari konten JavaScript di SELURUH repo (bukan hanya content/): file JSON dengan
  moduleId/id yang mengandung "js" atau "javascript", atau folder serupa.
- Cek: apakah modul JS terdaftar di content/modules.json? status-nya 'ready' atau 'draft'?
  field requires menunjuk ke mana? moduleId di file lesson cocok dengan id di modules.json?
- Cek apakah ada id lesson JS yang bentrok dengan id lesson Java.
- Laporkan: di mana kontennya, berapa modul & materi yang ditemukan, dan PENYEBAB PASTI
  kenapa terkunci. Kalau konten JS tidak ditemukan sama sekali, BERHENTI dan laporkan saja.

TAHAP 2 — PERBAIKAN:
- Tambahkan field opsional `language: 'java' | 'javascript'` pada Module (default 'java'
  sehingga modul lama tidak perlu diubah).
- Pindahkan/daftarkan konten JS ke content/ dan modules.json dengan pola yang sama seperti Java.
- Rantai unlock JS terpisah dari Java: modul JS pertama TIDAK butuh modul Java (tetap wajib login),
  modul JS berikutnya hanya butuh modul JS sebelumnya.
- Pastikan id lesson JS diawali "js-" supaya tidak bentrok dengan Java.
- Tampilkan Java dan JS sebagai dua jalur terpisah di dashboard, termasuk hitungan durasinya.

TAHAP 3 — RUNNER JAVASCRIPT:
- Buat src/lib/jsRunner.ts terpisah. Jalankan kode di sandboxed iframe atau Web Worker,
  tangkap console.log sebagai stdout, bandingkan dengan expectedOutput.
- Wajib ada timeout (misal 3 detik) untuk mencegah infinite loop membekukan browser.
- Pilih runner dan bahasa editor CodeMirror berdasarkan `language` modul.
- Dukung blok ```javascript run seperti ```java run.

TAHAP 4 — VERIFIKASI:
- Jalankan unit test, lint, dan build. Tambahkan test untuk jsRunner dan logika unlock.
- Pastikan semua test Java lama tetap lulus.

LAPORAN AKHIR (singkat): penyebab masalah, file yang diubah, hasil test, dan apa yang belum selesai.