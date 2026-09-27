# Perbaikan tampilan — prompt untuk AI agent

Kerjakan 6 tugas berikut berurutan. Setiap tugas kecil dan sudah ditunjuk barisnya.
Jangan mengubah file di `content/` (isi materi diurus terpisah).
Setelah semua selesai, jalankan `npm run build` dan `npm run test:unit`, lalu tambah satu baris di `LAPORAN.md`.

Dilarang: menjalankan e2e/Playwright, menyentuh `src/lib/javaRunner.ts`, memakai `.skip` pada test,
dan mengubah angka di test supaya lulus.

---

## Tugas 1 — Logo jadi kuning

`src/pages/Landing.tsx`, sekitar baris 36. Ganti bayangan logo dari cyan ke kuning:

```diff
- style={{ textShadow: '2px 2px 0 var(--color-landing-cyan)' }}
+ style={{ textShadow: '3px 3px 0 var(--color-landing-yellow)' }}
```

Tulisannya tetap hitam supaya tetap terbaca di atas latar krem.
Lakukan hal yang sama pada logo di footer (sekitar baris 525) kalau bayangannya juga cyan.

Kalau nama variabel warnanya berbeda, cek dulu di `src/index.css` — pakai token kuning yang sudah ada,
jangan menulis kode warna langsung.

## Tugas 2 — Hilangkan menu Bootcamp

`src/pages/Landing.tsx`, sekitar baris 57–63. Hapus seluruh blok ini:

```jsx
<ComingSoon inline>
  <span className="hover:text-[var(--color-landing-cyan)] transition-colors cursor-not-allowed">
    Bootcamp
  </span>
</ComingSoon>
```

Menu **Komunitas** tetap ada. Periksa juga menu versi mobile kalau daftarnya ditulis terpisah —
jangan sampai Bootcamp masih muncul di layar HP.

## Tugas 3 — Ganti judul hero

`src/pages/Landing.tsx`, bagian hero. Judulnya jadi:

> BisaNgoding: Tempat Belajar Coding, Langsung Praktik

Kata terakhir yang disorot cyan saat ini adalah "GRATIS" — biarkan apa adanya, jangan dihapus.

## Tugas 4 — Rapikan kartu pelajaran yang terlalu kosong

`src/pages/Lesson.tsx` baris 528. Saat isi kartunya pendek, teksnya menempel di atas dan
menyisakan ruang kosong sangat besar di bawahnya.

```diff
- <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
+ <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full lg:my-auto">
```

Pakai `lg:my-auto`, **jangan** `justify-center` pada induknya — dengan `overflow-y-auto`,
`justify-center` membuat bagian atas konten terpotong saat isinya panjang.

Setelah diubah, cek dua keadaan: pelajaran dengan teks pendek (Modul 1 pelajaran 2, kartu pertama)
dan pelajaran dengan kode panjang. Keduanya harus tetap bisa di-scroll penuh.

## Tugas 5 — Muat Mermaid hanya saat dibutuhkan

Ini perbaikan yang paling besar dampaknya, dan tidak terlihat di layar.

`src/components/ui/Mermaid.tsx` memanggil `import mermaid from 'mermaid'` di baris paling atas,
dan `Lesson.tsx` mengimpornya secara langsung. Akibatnya seluruh pustaka diagram ikut masuk ke
bundle utama dan diunduh **setiap pengunjung**, padahal dari sekitar 150 file pelajaran, yang
memakai diagram cuma **3 file**.

Ubah jadi dimuat saat dipakai saja. Di `src/pages/Lesson.tsx`:

```ts
import { lazy, Suspense } from 'react';
const Mermaid = lazy(() =>
  import('../components/ui/Mermaid').then((m) => ({ default: m.Mermaid }))
);
```

lalu bungkus pemakaiannya:

```jsx
<Suspense fallback={<div className="text-sm text-gray-400">Memuat diagram...</div>}>
  <Mermaid chart={String(children).replace(/\n$/, '')} />
</Suspense>
```

Hapus `import { Mermaid } from '../components/ui/Mermaid'` yang lama.

**Laporkan angkanya**: catat ukuran `dist/assets/index-*.js` sebelum dan sesudah perubahan
(dari keluaran `npm run build`). Sebelum perubahan ukurannya sekitar 2.664 kB.
Kalau setelah diubah ukurannya tidak turun berarti caranya belum tepat — laporkan, jangan dipaksakan.

Pastikan pelajaran yang memang memakai diagram masih menampilkan diagramnya:

```bash
grep -rl '```mermaid' content/
```

## Tugas 6 — Jaring pengaman sebelum deploy

Di `package.json`, tambahkan script dan pasang ke build:

```json
"cek:konten": "node cek-modul.mjs",
"build": "node cek-modul.mjs && tsc -b && vite build"
```

`cek-modul.mjs` sudah ada di root project dan keluar dengan kode 1 kalau ada modul berstatus
`ready` yang file pelajarannya belum ada. Dengan dipasang ke `build`, modul kosong tidak bisa
lolos ke produksi lagi — masalah yang kemarin terjadi pada modul Java Collection.

---

## Baris untuk LAPORAN.md

```
| 27 | 2026-09-XX HH:mm | Logo kuning, hapus Bootcamp, judul hero, kartu pelajaran, mermaid lazy | LULUS x/y | ... | ... | Bundle utama turun dari 2664 kB jadi ... kB |
```