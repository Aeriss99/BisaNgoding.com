# Tata letak baru: rail ikon + daftar modul — prompt untuk AI agent

Kerjakan 5 tugas di bawah berurutan. Jangan mengubah file di `content/`.
Setelah selesai jalankan `npm run build` dan `npm run test:unit`, lalu tambah satu baris di `LAPORAN.md`.

Dilarang: menjalankan e2e/Playwright, menyentuh `src/lib/javaRunner.ts`, memakai `.skip`,
mengubah angka di test supaya lulus, dan mengubah halaman pelajaran (`/lesson/:id`) serta quiz (`/quiz/:id`).

---

## Gambaran akhir (desktop, lebar ≥ 768px)

```
┌──────┬────────────────────┬──────────────────────────────────────┐
│ [</>]│ KELAS JAVA         │  Modul 1                             │
│      │ ████░░░░░  3/92    │  Java Dasar                          │
│  📖  │                    │                                      │
│  👤  │ ● Java Dasar  3/32 │  ① Program Pertama: Hello World   ✓  │
│  🏅· │ 🔒 Todolist   0/10 │  ② Variabel dalam Java            ✓  │
│  👥· │ 🔒 Java OOP   0/30 │  ③ Tipe Data Primitif             ✓  │
│      │ 🔒 Collection 0/12 │  ④ Operasi Matematika             📖 │
│      │ 🔒 Java 17     0/8 │  ⑤ Menggabungkan String           🔒 │
│      │                    │  ...                                 │
│      │ ▸ Segera hadir (27)│                                      │
│ (🧑) │                    │                                      │
└──────┴────────────────────┴──────────────────────────────────────┘
  rail      daftar modul                  isi
  72px      280px                         sisa lebar
```

Alasannya:

- Menu global (Belajar, Profil) jarang dipakai saat sedang belajar, tapi sekarang memakan 256px
  permanen hanya untuk 2 link aktif. Dijadikan rail ikon 72px.
- Ruang yang terbebas dipakai untuk **daftar modul** — yang justru dibutuhkan terus saat belajar:
  pindah modul tanpa harus kembali ke halaman kelas.
- Halaman pelajaran tetap tanpa sidebar sama sekali, supaya fokus. Jangan diubah.

---

## Tugas 1 — Komponen logo ikon

Buat `src/components/ui/LogoIcon.tsx`:

- Kotak 40×40px, latar `var(--color-primary)`, border 3px hitam, bayangan keras `3px 3px 0 #111`.
- Isinya teks `</>` hitam, `font-mono`, tebal, ukuran sekitar 16px, rata tengah.
- Terima prop `size` (default 40) supaya bisa dipakai di tempat lain.
- Bungkus dengan `<Link to="/" aria-label="BisaNgoding - Beranda" title="BisaNgoding">`.

Ganti **dua** logo lama `{ }` biru di `src/components/layout/Layout.tsx` (sidebar desktop dan header mobile)
dengan komponen ini. Tulisan "BisaNgoding" di sebelahnya dihapus — cukup ikonnya.

## Tugas 2 — Sidebar desktop jadi rail ikon

Di `src/components/layout/Layout.tsx`, sidebar desktop berubah dari `w-64` menjadi `w-[72px]`
(dan `md:pl-64` di pembungkus luar jadi `md:pl-[72px]`). Isinya dari atas ke bawah:

1. `LogoIcon`
2. Ikon **Belajar** dan **Profil** — ikon saja, tanpa teks. Beri `title` dan `aria-label` berisi namanya.
   Yang aktif tetap kotak kuning bertepi hitam seperti sekarang, hanya ukurannya 44×44px.
3. Ikon **Sertifikat** dan **Komunitas** — redup (`opacity-50`), dengan titik kecil kuning di pojok
   kanan atas sebagai tanda "segera". Tooltip: "Sertifikat — segera hadir".
4. Di paling bawah: **foto profil** 40px bulat. Klik → `/profile`. Di pojok kanan bawah foto ada titik
   status sinkron 10px: hijau (`Tersimpan`), biru berkedip (`Menyimpan...`), merah (offline).
   Tooltip berisi teks status lengkapnya.

**Tombol Keluar dipindah ke halaman Profil** (`src/pages/Profile.tsx`), taruh di bagian paling bawah
halaman. Nama dan email pengguna juga tampil di Profil, bukan di rail.

Kalau belum login, posisi foto profil diganti ikon `LogIn` yang memanggil `masukGoogle`.

Tampilan mobile (header atas + navigasi bawah) **tidak berubah**, kecuali logonya memakai `LogoIcon`.

## Tugas 3 — Panel daftar modul

Buat `src/components/layout/CourseOutline.tsx`. Panel ini tampil di halaman
`/kelas/:courseId` dan `/module/:moduleId`, di antara rail dan isi halaman, lebar 280px,
tinggi penuh layar, bisa di-scroll sendiri, latar putih, border kanan 3px hitam.

Isinya:

1. **Judul kelas** (dari `coursesData`, contoh "Kelas Java"), lalu progress bar kelas dan teks `3/92`.
2. **Daftar modul yang siap** (`status !== 'draft'`), urut `order`. Tiap baris:
   - ikon status: ✓ hijau kalau semua pelajaran + quiz selesai, lingkaran kuning penuh kalau sedang
     dikerjakan, gembok kalau belum terbuka (pakai `checkModuleUnlocked` yang sudah ada);
   - judul modul;
   - `selesai/total` di kanan, font mono kecil.
   - Modul yang sedang dibuka: latar kuning, border hitam, bayangan keras — sama gaya dengan menu aktif.
   - Modul terkunci tetap tampil tapi redup dan tidak bisa diklik.
3. **Modul draft** tidak ditampilkan satu per satu. Cukup satu baris lipat
   `▸ Segera hadir (27)` yang kalau diklik membuka daftar judulnya (redup, tidak bisa diklik).
   Jumlahnya dihitung, jangan ditulis manual.

Menentukan kelas yang sedang aktif:
- di `/kelas/:courseId` → dari parameter;
- di `/module/:moduleId` → dari `getModule(moduleId).courseId`, default `'java'`.

Hitungan progress pakai fungsi yang sudah ada (`getVisibleLessons`, `progress.completedLessons`,
`progress.quizScores`). **Jangan** menulis logika hitung baru yang berbeda dari Dashboard.

Pasang panel di `Layout.tsx` dengan mengecek `location.pathname`.

**Panel permanen hanya di layar ≥ 1024px (`lg:`)**, bukan `md:`. Di 768px, rail 72px + panel 280px
menyisakan isi halaman cuma ~416px — terlalu sempit untuk daftar pelajaran. Jadi:
isi halaman bergeser `lg:pl-[352px]` saat panel tampil, dan tetap `md:pl-[72px]` di bawah 1024px.

Di bawah 1024px panel dibuka lewat laci — lihat Tugas 4.

## Tugas 4 — Versi HP dan tablet

Tiga ukuran layar, tiga perilaku:

| Lebar layar | Menu global | Daftar modul |
|---|---|---|
| < 768px (HP) | header atas + navigasi bawah (yang sekarang) | laci dari kiri |
| 768–1023px (tablet) | rail 72px | laci dari kiri |
| ≥ 1024px (laptop) | rail 72px | panel permanen 280px |

### 4a. Tombol pembuka laci

Di `ModuleDetail.tsx`, tepat di bawah judul modul, tambahkan tombol (hanya `lg:hidden`):

```
[ ☰  Daftar modul · 3/32 ]
```

- Tinggi minimal 44px, lebar penuh di HP, gaya tombol brutal putih bertepi hitam.
- Angka `3/32` adalah progres modul yang sedang dibuka, supaya tombol ini juga berguna tanpa dibuka.

Di `CourseDetail.tsx` **tidak perlu** tombol ini — halaman itu sendiri sudah berupa daftar modul.

### 4b. Lacinya

Pakai komponen `CourseOutline` yang sama, jangan membuat versi kedua.

- Muncul dari kiri, lebar `min(85vw, 320px)`, tinggi penuh.
- Di belakangnya latar hitam transparan 50%. Klik latar → laci tertutup.
- Di pojok kanan atas laci ada tombol tutup `✕` berukuran minimal 44×44px.
- Tertutup otomatis saat pengguna memilih modul (dengarkan perubahan `location.pathname`).
- Tombol `Esc` menutup laci.
- Selama laci terbuka, halaman di belakangnya **tidak boleh ikut ter-scroll**
  (`document.body.style.overflow = 'hidden'`, dikembalikan saat laci tertutup atau komponen dilepas).
- `z-index` laci harus **di atas** navigasi bawah HP (yang sekarang `z-50`) — pakai `z-[60]`.
  Kalau tidak, bagian bawah laci tertutup navigasi.
- Beri `padding-bottom: env(safe-area-inset-bottom)` supaya modul terakhir tidak tertutup garis home iPhone.
- Aksesibilitas: `role="dialog"`, `aria-modal="true"`, `aria-label="Daftar modul"`.
- Animasi geser cukup `transition-transform duration-200`. Hormati `prefers-reduced-motion`.

### 4c. Header HP

Foto profil di pojok kanan header sekarang tidak bisa diklik. Jadikan link ke `/profile`,
dan beri titik status sinkron yang sama seperti di rail (hijau / biru berkedip / merah).
Ini penting karena tombol Keluar pindah ke halaman Profil.

### 4d. Navigasi bawah HP

Sertifikat dan Komunitas di navigasi bawah diberi titik kuning kecil di pojok kanan atas ikonnya,
sama seperti di rail, supaya tanda "segera hadir"-nya konsisten di semua ukuran layar.
Keduanya tetap tidak bisa diklik.

## Tugas 5 — Singkatan kelas di kartu Dashboard

`src/pages/Dashboard.tsx` baris sekitar 304 menampilkan `course.language.toUpperCase().substring(0, 2)`.
Akibatnya Java dan JavaScript sama-sama tampil **"JA"**.

Ganti jadi:

```ts
{course.short ?? course.language.toUpperCase().substring(0, 2)}
```

dan tambahkan `short?: string;` pada `interface Course` di `src/types/schema.ts`.
Nilai `short` sudah diisi di `content/courses.json` (J, JS, GIT, SB, NODE).

---

## Cek sebelum lapor selesai

Buka `npm run dev` dan periksa sendiri, satu per satu. Ubah lebar layar lewat DevTools
(Toggle device toolbar), bukan dengan menebak.

**Laptop — lebar 1280px**

1. Dashboard: rail 72px di kiri, tidak ada panel daftar modul.
2. Klik Kelas Java: panel daftar modul muncul, "Kelas Java" di atasnya.
3. Klik Java Dasar: baris Java Dasar kuning di panel, daftar pelajarannya di kanan.
4. Klik modul lain dari panel tanpa kembali ke halaman kelas: pindah langsung.
5. Buka satu pelajaran: tidak ada rail maupun panel.
6. Halaman Profil: nama, email, status sinkron, dan tombol Keluar ada di sana.

**Tablet — lebar 820px**

7. Halaman modul: rail ada, panel **tidak** tampil permanen, tombol "Daftar modul" ada.
8. Tombol itu membuka laci; isi halaman tidak terhimpit.

**HP — lebar 375px**

9. Halaman modul: tidak ada rail, header atas dan navigasi bawah tetap, tombol "Daftar modul · x/y" ada.
10. Buka laci: modul paling bawah bisa di-scroll sampai terlihat, tidak tertutup navigasi bawah.
11. Saat laci terbuka, halaman di belakang tidak ikut ter-scroll.
12. Laci tertutup lewat ✕, lewat klik latar gelap, dan otomatis saat memilih modul.
13. Foto profil di header bisa diklik dan membuka Profil.
14. Tidak ada scroll ke samping di halaman mana pun.

Tulis hasil ke-14 cek ini di laporan, bukan cuma "sudah dicek".

## Baris untuk LAPORAN.md

```
| 28 | 2026-09-XX HH:mm | Rail ikon, panel & laci daftar modul, logo ikon, singkatan kelas | LULUS x/y | ... | ... | 14/14 cek manual lulus |
```
