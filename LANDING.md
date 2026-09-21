# LANDING PAGE — Spesifikasi Desain

> File ini MENGGANTIKAN spesifikasi landing page di TODO.md Bagian 2.
> Gambar acuan: `docs/landing-mockup.jpeg`. Buka dan ikuti tata letaknya semirip mungkin.
> Ikuti AGENTS.md. Jangan jalankan e2e. Jangan ubah content/ atau javaRunner.ts.

## A. Aturan Visual (wajib sama dengan gambar acuan)

### Warna
- Latar halaman: krem `#FBF6EC`
- Kuning hero: `#FFE838`
- Cyan (tombol utama, highlight, panel modul): `#2FE6F0`
- Ungu (ikon, highlight judul "Mengapa"): `#A78BFA`
- Magenta (panel kedua): `#FF3DCB`
- Hitam garis & teks: `#111111`
- Kartu: putih krem `#FFFDF7`

### Tipografi
- Judul besar & judul section: **Bungee** (Google Fonts), HURUF BESAR semua
- Navigasi, tombol, isi: **Barlow Condensed** weight 600–700
- Isi paragraf: Barlow Condensed 500, ukuran 18–20px
- Fallback: `system-ui, sans-serif`

### Gaya Neo-Brutalism
- Semua kartu, tombol, panel: border **3px solid #111**
- Bayangan keras tanpa blur: kartu `8px 8px 0 #111`, tombol `4px 4px 0 #111`
- **Sudut terpotong (chamfer)** pada hero dan kartu keunggulan, pakai `clip-path: polygon(...)` dengan potongan 20–28px. Hero terpotong di keempat sudut, kartu keunggulan terpotong di pojok kanan atas.
- Tombol ditekan: geser 2px kanan-bawah, bayangan mengecil
- Judul section punya **stabilo di belakang teks**: blok warna setinggi ~40% bawah teks (pakai `linear-gradient` atau pseudo-element), warnanya berbeda tiap section

## B. Struktur Halaman (urut dari atas)

### 1. Navbar
- Kiri: logo teks **BisaNgoding.com**, font Bungee, dengan efek garis tepi cyan di belakang huruf (text-shadow cyan)
- Kanan: tautan **Beranda**, **Modul**, **Cara Belajar**, **FAQ** (scroll ke section terkait)
- Tombol **Masuk** cyan, border hitam, bayangan hitam → login Google
- Di bawah navbar: garis cyan tebal 6px selebar layar

### 2. Hero (panel kuning, sudut terpotong)
- Judul (Bungee, 3 baris di desktop):
  `BISANGODING: TEMPAT BELAJAR JAVA DARI NOL, LANGSUNG PRAKTIK` dengan kata **GRATIS** ditaruh di akhir dan diberi warna cyan dengan garis tepi hitam (seperti "NO.1" di gambar)
- Subjudul: `Belajar lewat cerita, tulis kodenya langsung di browser, dan bangun proyek nyata dari nol.`
- Tombol 1 (cyan): **MASUK DENGAN GOOGLE (GRATIS)** → login
- Tombol 2 (hitam, bayangan cyan): **LIHAT MODUL** → scroll ke section Modul
- Kanan: ilustrasi di dalam **tumpukan 3 kartu miring** (rotasi -3°, 2°, 0°), masing-masing berborder hitam. Pakai `public/illustrations/hero.png` jika ada, kalau tidak pakai `undraw_programming_j1zw.svg`
- Mobile: ilustrasi pindah ke bawah teks, judul mengecil

### 3. Mengapa BisaNgoding? (stabilo UNGU)
Tiga kartu putih, sudut kanan atas terpotong, ikon garis ungu di kiri judul:
- **MATERI BERCERITA** — Setiap konsep dijelaskan lewat cerita dan kasus nyata, bukan hafalan definisi.
- **PRAKTIK DI BROWSER** — Tulis dan jalankan kode Java langsung, tanpa install apa pun. Latihan dinilai otomatis.
- **PROYEK NYATA** — Bangun aplikasi Todolist dan sistem perpustakaan dari nol, langkah demi langkah.
Ikon pakai lucide-react (BookOpen, Code, Hammer), warna ungu, stroke 2.

### 4. Modul Tersedia (stabilo CYAN)
Panel cyan berborder hitam berisi kartu-kartu modul berjejer (grid 4 kolom desktop, 2 kolom tablet, 1 kolom mobile):
- Setiap kartu: area gambar di atas (warna solid + ikon besar, border hitam), nama modul, `X pelajaran · Gratis`, tombol hitam **MULAI BELAJAR** → login
- Ambil data dari modules.json, tampilkan modul yang punya pelajaran: Java Dasar, Proyek: Aplikasi Todolist, Java OOP
- Kartu ke-4: **SEGERA HADIR** dengan ikon gembok, tombol nonaktif
- TIDAK ADA harga dan rating bintang

### 5. Cara Belajar (stabilo MAGENTA, panel magenta)
Menggantikan section testimoni di gambar. Tiga kartu berbentuk **balon percakapan** (ekor segitiga di bawah kiri), sama seperti gaya testimoni di gambar:
- **1. Masuk dengan Google** — Sekali klik, progresmu langsung tersimpan.
- **2. Baca ceritanya** — Setiap pelajaran dimulai dari masalah nyata.
- **3. Tulis kodenya** — Jalankan, lihat hasilnya, dan selesaikan tantangannya.
Tiap kartu diberi lingkaran nomor besar di pojok kiri atas (pengganti foto profil).

> JANGAN membuat testimoni atau nama alumni palsu. Section testimoni baru ditambahkan jika sudah ada ulasan asli.

### 6. FAQ
Accordion sederhana, gaya kartu neo-brutalism:
- Apakah gratis? — Ya, seluruh materi saat ini gratis.
- Perlu install Java? — Tidak. Kode dijalankan langsung di browser.
- Bisa belajar di HP? — Bisa. Progres tersimpan dan tersinkron antara HP dan laptop.
- Kenapa harus login? — Agar progres belajarmu tersimpan dan bisa dilanjutkan di perangkat lain.

### 7. CTA Penutup (panel cyan)
- Kiri: **TUNGGU APA LAGI? MULAI SEKARANG!** (Bungee, 2 baris)
- Kanan: tombol putih **MASUK DENGAN GOOGLE** → login

### 8. Footer (hitam)
- Kiri: logo BisaNgoding.com warna cyan
- Kanan: Beranda, Modul, FAQ, Kebijakan Privasi, Ketentuan Layanan (teks putih)
- Baris bawah: `© 2026 BisaNgoding. Dibuat untuk belajar.`

## C. Aturan Teknis
- Muat font Bungee dan Barlow Condensed dari Google Fonts di index.html, dengan `display=swap`
- Semua warna dari CSS variable, jangan ditulis mentah di komponen
- Responsif: 360px, 768px, 1280px. Tidak boleh ada scroll horizontal
- Gambar pakai `${import.meta.env.BASE_URL}` dan `loading="lazy"`
- Hormati `prefers-reduced-motion`
- Hanya tampil untuk pengunjung yang belum login. Setelah login, tetap ke Dashboard

## D. Selesai Jika
- [ ] Tata letak dan gaya visual cocok dengan `docs/landing-mockup.jpeg`
- [ ] Tidak ada klaim palsu, harga, rating, atau testimoni fiktif
- [ ] Semua tombol login berfungsi
- [ ] `npm run build` dan `npm run test:unit` lulus
- [ ] Commit, push, dan tambah 1 baris LAPORAN.md

## E. Fitur yang Belum Ada → "Segera Hadir"

Buat satu komponen `ComingSoon` yang dipakai ulang di mana saja, gayanya sama seperti kartu modul terkunci:
- Badge kuning "SEGERA HADIR", border hitam, huruf besar kecil
- Ikon gembok, teks agak pudar, tidak bisa diklik (cursor not-allowed)
- Saat diklik/disentuh di HP: tampilkan toast singkat "Fitur ini segera hadir"

Terapkan pada:
1. Navbar: tambahkan menu **Bootcamp** dan **Komunitas** seperti di mockup, masing-masing dengan badge kecil "SEGERA". Urutan menu: Beranda, Modul, Bootcamp, Komunitas, FAQ, lalu tombol Masuk.
2. Section "Mengapa BisaNgoding?": tambahkan kartu ke-4 **MENTOR & KOMUNITAS** bertanda Segera Hadir, dengan deskripsi "Diskusi dan tanya jawab bersama sesama pelajar."
3. Section Modul: kartu modul tanpa pelajaran tetap "SEGERA HADIR" (sudah ada).
4. Section testimoni seperti di mockup (panel magenta) boleh ditampilkan, tapi isinya SATU kartu saja: "Jadilah yang pertama berbagi cerita belajarmu di BisaNgoding" dengan badge Segera Hadir. Jangan buat nama atau testimoni palsu.
5. Di dalam aplikasi setelah login: fitur yang belum ada (misalnya Sertifikat) memakai komponen yang sama.

Nanti saat fiturnya jadi, cukup hapus pembungkus ComingSoon tanpa mengubah tata letak.