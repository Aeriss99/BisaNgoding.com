# TODO — Tampilan Soft Neo-Brutalism & Mobile

## Aturan Agent (WAJIB DIBACA)
1. Kerjakan **satu bagian per sesi**, berurutan dari atas.
2. Maksimal **3 percobaan** per masalah. Gagal? Catat di LAPORAN.md, lanjut tugas berikutnya.
3. **JANGAN** ubah isi file di `content/` (materi pelajaran, quiz, achievements).
4. **JANGAN** ubah logika progres, penguncian modul, atau `javaRunner.ts` di TODO ini. Ini murni tampilan.
5. **JANGAN** menambah library animasi (framer-motion, gsap, dll). Cukup CSS transition/keyframes.
6. Jangan jalankan tes pengukuran performa. Cukup `npm run build` dan tes unit yang sudah ada.
7. Setiap bagian selesai: tambah 1 baris di `LAPORAN.md`.
8. Balas ke user **singkat**, tanpa menampilkan kode.

---

## Bagian 1 — Token Desain
Buat di `src/index.css`, lalu dipakai di seluruh komponen. Jangan tulis warna mentah di tiap file.

- [ ] Warna: latar `#FAF7F0` (krem hangat), kartu `#FFFFFF`, teks `#1A1A1A`
- [ ] Aksen: biru `#2B4EFF`, kuning `#FFD84D`, hijau `#4ADE80`, merah lembut `#FF6B6B`
- [ ] Border standar: `2px solid #1A1A1A` untuk kartu, tombol, input
- [ ] Shadow keras tanpa blur: kartu `4px 4px 0 #1A1A1A`, tombol `3px 3px 0 #1A1A1A`
- [ ] Sudut: `rounded-xl` (lembut, bukan kotak tajam)
- [ ] Font: judul `font-extrabold`, isi normal, kode tetap monospace
- [ ] Simpan sebagai CSS variable agar mudah diubah nanti

## Bagian 2 — Terapkan ke Komponen
- [ ] Dashboard: kartu modul pakai border + shadow keras
- [ ] Kartu modul terkunci: latar abu, shadow lebih tipis, tidak ada efek hover
- [ ] Halaman modul: daftar pelajaran, item selesai diberi aksen hijau
- [ ] Halaman pelajaran: kartu teori, kuis, dan challenge memakai gaya yang sama
- [ ] Tombol: primer biru, sekunder putih, sukses hijau, bahaya merah, semua ber-border hitam
- [ ] Progress bar: ber-border hitam, isi warna aksen
- [ ] Badge "Segera Hadir" dan skor quiz: latar kuning, border hitam
- [ ] Panel output kode: tetap gelap, tapi ber-border hitam dan shadow keras
- [ ] Blok kode inline: latar kuning muda, border tipis, tidak memakan satu baris penuh

## Bagian 3 — Interaksi Tombol & Kartu
- [ ] Tombol ditekan: bergeser 2px kanan-bawah, shadow mengecil jadi `1px 1px 0` (seperti tertekan)
- [ ] Tombol hover: shadow membesar jadi `5px 5px 0`
- [ ] Kartu modul hover: naik 2px, shadow jadi `6px 6px 0`
- [ ] Semua transisi 120ms, `ease-out`
- [ ] Tombol nonaktif: tanpa shadow, opacity 60%, kursor not-allowed

## Bagian 4 — Animasi & Sentuhan 3D
- [ ] Pindah kartu pelajaran: kartu baru masuk slide dari kanan + fade, 200ms
- [ ] Jawaban benar: kartu `rotate(1deg)` lalu kembali + `scale(1.02)`, 300ms
- [ ] Jawaban salah: getar horizontal kecil 2 kali, 250ms
- [ ] Kartu teori punya sedikit kedalaman: `perspective` + `translateZ` halus saat muncul
- [ ] Progress bar bergerak halus, transition 300ms
- [ ] Badge achievement terbuka: pop kecil (scale 0.8 → 1.05 → 1)
- [ ] Hormati `prefers-reduced-motion`: semua animasi dimatikan jika aktif

## Bagian 5 — Mobile (target lebar 360px)
- [ ] Navigasi bawah: tinggi minimal 64px, tap target minimal 44px
- [ ] Ikon menu aktif: membesar sedikit + warna aksen
- [ ] Halaman pelajaran: padding 16px, ukuran teks isi 16px, judul 20px
- [ ] Blok kode dan tabel: scroll horizontal sendiri, halaman tidak ikut bergeser
- [ ] Footer tombol Lanjut/Kembali: selalu terlihat, aman dari gesture bar (`safe-area-inset-bottom`)
- [ ] Editor kode: tinggi maksimal 40% layar di HP agar tombol tetap terlihat
- [ ] Panel output: tinggi maksimal 30% layar, bisa di-scroll
- [ ] Dashboard di HP: kartu modul satu kolom, info progres tidak terpotong
- [ ] Tidak ada scroll horizontal di seluruh halaman

## Bagian 6 — Pemeriksaan Akhir
- [ ] Cek di 360px, 768px, dan desktop
- [ ] Kontras teks cukup terbaca (jangan kuning di atas putih)
- [ ] `npm run build` sukses
- [ ] Tes unit yang ada tetap lulus
- [ ] Tambah 1 baris LAPORAN.md: bagian yang selesai + yang diubah

---

## Nanti (JANGAN dikerjakan sekarang)
- Mode gelap
- Narasi konten modul OOP
- Modul OOP batch 2
- Halaman sertifikat