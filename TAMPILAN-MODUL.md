# Tugas: Daftar modul di HP/tablet, rail yang rapi, dan halaman modul yang tidak mepet

Tiga masalah tampilan. Kerjakan berurutan. **Hanya ubah file yang disebut.** Jangan mengubah file di `content/`, dan jangan mengubah logika progres atau login.

## Masalah dan penyebabnya (sudah dicek di kode commit 6b94627)

1. **Daftar modul hilang di HP dan tablet.** Panel `CourseOutline` di `Layout.tsx` memakai `hidden lg:block`, jadi hanya muncul di layar ≥1024px. Di bawah itu, daftar modul hanya bisa dibuka lewat satu tombol di dalam `ModuleDetail.tsx`. Di halaman kelas (`/kelas/:id`) dan di header HP tidak ada jalan ke sana.
2. **Label "SOON" menyembul keluar dari rail.** Di rail ikon (lebar 72px), Sertifikat dan Komunitas memakai `<ComingSoon inline text="SOON">`. Komponen itu menaruh ikon dan badge **berdampingan**, sehingga lebar totalnya ±90px dan badge "SOON" keluar rail lalu menimpa panel daftar modul.
3. **Halaman modul mepet.** `CourseDetail.tsx` punya pembungkus `max-w-4xl mx-auto px-4 md:px-6 py-6`, tetapi `ModuleDetail.tsx` tidak punya (root-nya hanya `space-y-6`). Akibatnya isi menempel ke panel kiri dan ke tepi atas. Selain itu, tulisan "Modul {mod.order}" menampilkan angka internal (misalnya **Modul 50** untuk Git Dasar), dan warnanya kuning di atas latar krem sehingga sulit dibaca. `Profile.tsx` juga tidak punya padding samping (`space-y-6 max-w-lg mx-auto`), jadi di HP menempel ke tepi layar.

## Tugas 1 — Daftar modul bisa dibuka dari mana saja di HP dan tablet

Pindahkan drawer daftar modul dari `ModuleDetail.tsx` ke `Layout.tsx`, supaya tersedia di halaman kelas **dan** halaman modul.

Di `src/components/layout/Layout.tsx`:
- Tambah state `const [outlineOpen, setOutlineOpen] = useState(false);`.
- Tutup drawer otomatis setiap pindah halaman: `useEffect(() => setOutlineOpen(false), [location.pathname]);`.
- **HP (<768px)**: di header HP (`<header className="md:hidden ...">`), saat `showPanel` true, tampilkan tombol di sebelah kanan logo, sebelum avatar. Isinya ikon `ListTree` dari lucide-react (atau `Menu`) plus teks **"Modul"**, dengan `aria-label="Buka daftar modul"`. Tinggi minimal 44px. Gaya sama dengan tombol "Masuk" (border 2px, bayangan kecil). Kelompokkan tombol ini dan avatar dalam satu `div` `flex items-center gap-2`.
- **Tablet (768–1023px)**: di rail, tepat di bawah item Profil, saat `showPanel` true, tampilkan tombol ikon `ListTree` dengan kelas `hidden md:flex lg:hidden`, `title="Daftar modul"`, dan `aria-label="Buka daftar modul"`. Ukuran dan gaya sama dengan item nav lain (`w-11 h-11 rounded-xl`).
- Render drawer di `Layout` saat `showPanel && outlineOpen`. Pakai markup yang sama persis dengan drawer di `ModuleDetail.tsx` sekarang: overlay `fixed inset-0 z-[60]` dengan `lg:hidden`, latar `bg-black/50` yang menutup drawer saat diklik, dan panel `role="dialog" aria-modal="true" aria-label="Daftar modul"` selebar `w-[min(85vw,320px)] h-full` berisi `<CourseOutline onClose={() => setOutlineOpen(false)} />`.
- `CourseOutline` sudah menangani tombol ✕, tombol Esc, dan penguncian scroll body saat `onClose` ada. Jangan diubah.

Di `src/pages/ModuleDetail.tsx`:
- **Hapus** tombol "Daftar modul · x/y" (`lg:hidden w-full min-h-[44px] ...`), blok "Drawer Overlay", state `drawerOpen`, dan import yang tidak terpakai lagi (`Menu`, `useState`, `CourseOutline`). Tidak boleh ada dua drawer.

`CourseOutline` sudah membaca kelas aktif dari `/kelas/:courseId` maupun `/module/:moduleId`, jadi **tidak perlu diubah**.

## Tugas 2 — Label "SOON" di rail tidak boleh keluar dari rail

Di `Layout.tsx`, ganti dua `<ComingSoon inline text="SOON">…</ComingSoon>` di rail (Sertifikat dan Komunitas) dengan elemen yang **seluruhnya muat dalam 72px**:
- Kotak `relative w-11 h-11 flex items-center justify-center` berisi ikon (opacity 50%, sama seperti sekarang).
- Badge kecil "SOON" diposisikan **di dalam/di bawah ikon**, bukan di sampingnya: `absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] leading-none font-mono font-bold px-1 py-0.5 bg-[var(--color-primary-light)] border border-[var(--color-text-main)] whitespace-nowrap`. Titik kuning boleh dihapus.
- Tetap tunjukkan pesan "Fitur ini segera hadir" saat diklik. Boleh memakai `<ComingSoon>` versi **non-inline** yang dibungkus ulang, atau state toast lokal yang sama seperti di `ComingSoon.tsx`. Pastikan tidak ada badge "Segera Hadir" besar yang ikut muncul di rail.
- `title="Sertifikat — segera hadir"` / `title="Komunitas — segera hadir"` tetap dipakai.
- Jangan mengubah `ComingSoon.tsx` untuk tempat lain yang memakainya.

## Tugas 3 — Halaman modul rapi dan nomor modul yang benar

Di `src/pages/ModuleDetail.tsx`:
- Bungkus seluruh isi halaman (termasuk tampilan "Modul tidak ditemukan") dengan pembungkus yang sama seperti `CourseDetail`: `max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6`.
- Header:
  - Beri jarak antara tombol kembali dan judul: `flex items-start gap-4`, tombol `shrink-0`.
  - Ganti label "Modul {mod.order}" dengan **"Modul {nomor} dari {total}"**.
  - Warna label jangan kuning. Pakai `text-[var(--color-text-secondary)] font-mono text-xs font-bold uppercase tracking-wide`.
  - Badge (BUTUH JDK 17 / PRAKTIK DI TERMINAL KOMPUTERMU) diletakkan di bawah judul dengan `mt-2`. Kalau keduanya ada, bungkus dengan `flex flex-wrap gap-2`.
- Daftar pelajaran tetap `grid gap-3`, tidak diubah.

Tambahkan fungsi di `src/lib/content.ts`:
```ts
/** Nomor urut modul di dalam kelasnya (1, 2, 3, ...), hanya menghitung modul yang tidak draft. */
export function nomorModul(moduleId: string): { nomor: number; total: number } | null {
  const mod = getModule(moduleId);
  if (!mod) return null;
  const courseId = mod.courseId || 'java';
  const daftar = modulesData
    .filter((m) => (m.courseId || 'java') === courseId && m.status !== 'draft')
    .sort((a, b) => a.order - b.order);
  const i = daftar.findIndex((m) => m.id === mod.id);
  return i < 0 ? null : { nomor: i + 1, total: daftar.length };
}
```
Pakai fungsi ini di header `ModuleDetail`. Kalau hasilnya `null`, jangan tampilkan labelnya.

Tambahkan test `src/test/nomorModul.test.ts`:
- `nomorModul('git-dasar')` → `{ nomor: 1, total: 9 }`
- `nomorModul('gh-ekosistem')` → `{ nomor: 9, total: 9 }`
- `nomorModul('en-d1')?.nomor` → `1`
- `nomorModul('tidak-ada')` → `null`
- Untuk setiap kelas, nomor modul yang tidak draft harus 1..N tanpa loncat.

Di `src/pages/Profile.tsx`: ubah root `space-y-6 max-w-lg mx-auto` menjadi `space-y-6 max-w-lg mx-auto px-4 md:px-6 py-6`.

## Periksa (wajib)

```bash
node cek-modul.mjs && npm run build && npm run test:unit
```
Semua harus lulus. **Jangan** mengubah test lain supaya lulus.

Lalu jalankan `npm run dev` dan cek dengan DevTools (mode perangkat) di lebar **375px, 768px, 1024px, dan 1440px**:

1. 375px, halaman kelas Git: header punya tombol **Modul**. Diketuk → drawer daftar modul terbuka. Ketuk latar gelap atau ✕ → tertutup.
2. 375px, halaman modul Git Dasar: tombol **Modul** ada. Tombol "Daftar modul · x/y" yang lama sudah tidak ada. Tidak ada dua drawer.
3. 375px: pilih modul lain dari drawer → pindah halaman dan drawer otomatis tertutup.
4. 768px: tombol ikon daftar modul muncul di rail di bawah Profil dan membuka drawer yang sama.
5. 1024px dan 1440px: panel daftar modul permanen tampil seperti sebelumnya, dan tombol di rail/header **tidak** muncul.
6. Semua lebar: label "SOON" di rail berada di dalam rail dan tidak menimpa panel. Klik ikonnya → toast "Fitur ini segera hadir".
7. Halaman modul Git Dasar: tertulis **"Modul 1 dari 9"** (bukan "Modul 50"). Ada jarak lega di kiri, kanan, dan atas. Judul tidak menempel ke panel. Tidak ada scroll horizontal di 375px.
8. Halaman modul English IT 1 dan Java Dasar: nomor modul masuk akal dan tampilan rapi.
9. Halaman Profil di 375px tidak menempel ke tepi layar.
10. Halaman pelajaran dan quiz (layar penuh, di luar Layout) tidak berubah.

## Laporan

Tulis `TAMPILAN_MODUL_REPORT.md`: file yang diubah, ringkasan hasil tiga perintah di atas, dan hasil 10 cek manual. Kalau bisa, sertakan screenshot 375px dan 1440px halaman modul Git Dasar.
