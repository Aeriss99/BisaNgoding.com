# TODO: Redesign Dashboard Belajar (BisaNgoding)

## Konteks
Halaman dashboard "Belajar" (setelah login Google) perlu dirapikan. Gaya visual tetap **neo-brutalism** seperti sekarang: border hitam tebal, bayangan keras (tanpa blur), kuning dan biru sebagai warna utama.

**Batasan (WAJIB):**
- Hanya ubah halaman dashboard dan komponen sidebar/navigasi. Jangan ubah halaman materi, runtime Java (CheerpJ tetap Java 8), auth Google, atau logika sinkronisasi Supabase.
- Semua angka harus diambil dari data asli (progress user dan daftar modul/pelajaran). **Jangan hardcode angka** seperti 26, 72, dan 605.
- Setelah setiap task, jalankan build, lint, dan test, lalu perbaiki sendiri kalau ada error. Centang checkbox di file ini kalau task sudah selesai.
- Kalau ada task yang ambigu, pilih solusi paling sederhana dan tulis catatan singkat di bagian "Catatan agent" di bawah. Jangan berhenti untuk bertanya, dan jangan mengulang pendekatan yang sama kalau sudah gagal 2x.

## Design tokens
- Background halaman: `#FBF7EE`
- Hitam (border, teks, bayangan): `#111111`
- Kuning: `#FFD93D`, kuning muda: `#FFF3B8`
- Biru aksen: `#2447F5`, biru muda: `#C9D3FF`
- Merah peringatan: teks/ikon `#B42318`, latar `#FFE3E0`
- Hijau sukses: `#1B7A3E`
- Teks sekunder: `#444444` (jangan lebih terang dari `#555555` supaya kontras tetap terbaca)
- Font: **Space Grotesk** (700) untuk judul dan angka besar, **Noto Sans** untuk body, **JetBrains Mono** untuk label kecil bergaya kode. Semua dari Google Fonts.
- Kartu besar: `border: 3px solid #111`, `border-radius: 14–16px`, `box-shadow: 6px 6px 0 #111`
- Kartu kecil: `border: 2px solid #111`, `border-radius: 10–12px`, `box-shadow: 4px 4px 0 #111`
- Progress bar: border 2px hitam, rounded penuh, isi biru aksen
- Target sentuh minimal 44px. Pakai ikon SVG garis (stroke), jangan emoji.

## Task

### 1. Sidebar (desktop)
- [x] Logo: kotak biru kecil berisi `{ }` (font mono), lalu teks "BisaNgoding".
- [x] Menu aktif ("Belajar"): latar kuning, border 2px, bayangan 4px.
- [x] "Sertifikat" dan "Komunitas": teks abu, tidak bisa diklik, dengan badge kecil **"SOON"** di sisi kanan item. Badge **tidak boleh menutupi label** (bug di versi sekarang).
- [x] Hapus ilustrasi di bagian bawah sidebar.
- [x] Kartu akun di bawah sidebar:
  - Avatar dari foto Google (fallback: inisial), nama, dan email. Email satu baris dengan ellipsis, dan email lengkap muncul di atribut `title`.
  - Ganti teks "Tersimpan" menjadi ikon centang hijau + "Progres tersinkron ke akun Google". Kalau sinkronisasi gagal atau sedang berjalan, tampilkan status yang sesuai.
  - Tombol "Keluar" bergaya outline (latar putih, teks merah `#B42318`), bukan tombol merah penuh.

### 2. Header / sapaan
- [x] Label kecil mono `// dashboard`, judul "Halo, {namaDepan}. Lanjut ngoding?", dan subjudul "Dari pemula sampai mahir, satu pelajaran setiap hari."
- [x] Hapus ilustrasi besar di kanan atas.
- [x] Di kanan header, tampilkan **chip peringatan reset** (latar `#FFE3E0`, ikon jam merah): "Progres direset jika tidak aktif {N} hari. Terakhir belajar: {tanggal}." Nilai N diambil dari konfigurasi reset yang sudah ada. Kalau sisa waktu ≤ 2 hari, ubah teksnya menjadi lebih mendesak, misalnya "Sisa {x} hari sebelum progres direset".

### 3. Kartu "Lanjutkan Belajar" (lebar 3/5)
- [x] Kartu kuning besar yang menampilkan:
  - Badge hitam "LANJUTKAN" dan "Modul {n} · {namaModul}"
  - "Pelajaran {x} dari {total}" (font mono), diikuti **judul pelajaran berikutnya** yang diambil dari data
  - Progress bar modul, "{selesai}/{total} selesai · {persen}%", dan "Tinggal {sisa} pelajaran lagi + kuis akhir"
  - Tombol biru utama "Lanjutkan Belajar →" yang langsung membuka pelajaran berikutnya
  - Tombol sekunder outline "Lihat daftar pelajaran"
- [x] Kalau user belum pernah belajar, ganti isinya menjadi "Mulai dari Modul 1: Java Dasar".

### 4. Kartu "Progres Total" (lebar 2/5)
- [x] Ring/donut SVG dengan persentase **berdasarkan pelajaran yang sudah tersedia** (modul yang bukan "segera hadir"). Contoh saat ini: 26/72 = 36%.
- [x] Teks besar "{selesai} / {tersedia}" dengan keterangan "pelajaran dari materi yang sudah tersedia".
- [x] Di bawahnya, setelah garis putus-putus: bar tipis hitam "Seluruh kurikulum: {selesai} / {totalKurikulum} · {persen}%".

### 5. Baris statistik (4 kartu kecil)
- [x] Pelajaran selesai
- [x] Modul tuntas: "{x} / {modulTersedia} tersedia"
- [x] Kuis akhir modul: tampilkan **"Belum dikerjakan"** kalau kuis belum pernah diambil. Jangan tampilkan "0%". Kalau sudah dikerjakan, tampilkan nilai terakhir.
- [x] Estimasi sisa waktu: jumlah estimasi jam dari pelajaran yang belum selesai di modul tersedia.

### 6. Seksi "Modul tersedia"
- [x] Judul "Modul tersedia" dan di kanannya "{n} modul · {n} pelajaran".
- [x] Grid 3 kolom. Setiap kartu berisi: nomor dalam lingkaran, nama modul, badge status, progress bar, lalu baris info "{x}/{y} pelajaran · ~{jam} jam · Kuis: {status}".
- [x] Badge status: `SEDANG` (biru muda) kalau progres > 0 dan < 100%, `SELESAI` (hijau) kalau 100%, `BELUM MULAI` (putih) kalau 0, dan `PROYEK` (kuning muda) untuk modul proyek.
- [x] Seluruh kartu bisa diklik (pakai elemen `<a>`).

### 7. Seksi "Segera hadir"
- [x] Ganti kartu besar abu-abu menjadi **baris ringkas** setinggi 56px: border 2px dashed `#8A8578`, nomor mono ("04"), nama modul, dan ikon gembok. Susun dalam grid 3 kolom.
- [x] Hapus teks "Materi belum tersedia" dan badge besar "SEGERA HADIR" di setiap kartu, karena judul seksi sudah menjelaskannya.

### 8. Mobile (< 768px)
- [x] Sidebar diganti **header atas** (logo di kiri, avatar di kanan) dan **bottom navigation** 4 item (Belajar aktif berlatar kuning; Sertifikat dan Komunitas abu).
- [x] Urutan konten: sapaan → kartu Lanjutkan → chip reset → progres materi (bar, bukan ring) → daftar modul 1 kolom → "Segera hadir" sebagai chip yang wrap.
- [x] Tidak boleh ada scroll horizontal. Pastikan konten terakhir tidak tertutup bottom nav (tambahkan padding bawah).

### 9. Verifikasi
- [x] Build, lint, dan test lolos.
- [x] Tambahkan test untuk fungsi hitung progres: persen tersedia, persen kurikulum, status badge, dan teks kuis "Belum dikerjakan".
- [x] Cek di lebar 390px, 768px, dan 1440px: tidak ada teks yang saling menimpa dan tidak ada overflow.

## Catatan agent
(isi di sini kalau ada keputusan atau asumsi yang diambil)
- Asumsi: Badge "SOON" pada menu ditaruh menggunakan komponen `ComingSoon` dengan parameter `inline` agar tidak menutupi label, sementara kartu "Sertifikat" dan "Komunitas" tetap redup dan kursor *not-allowed*.
- Asumsi: Di perangkat mobile, kartu `Progres Total` tidak perlu menampilkan donut chart besar untuk menghemat ruang, melainkan hanya baris *progress bar* dan statistik saja sesuai permintaan ("progres materi (bar, bukan ring)").
- Asumsi: Untuk menyembunyikan "Chip peringatan reset" di mobile dari *header* dan menampilkannya kembali di bawah "kartu Lanjutkan", dibuat dua div dengan *class* utilitas responsif (`hidden md:flex` dan `flex md:hidden`).