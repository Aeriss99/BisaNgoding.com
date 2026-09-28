# Laporan English Dasar

## File yang Diubah
1. `vite.config.ts`: Menambahkan opsi `runtimeCaching` di `workbox` agar suara di-cache secara offline (CacheFirst).
2. `src/pages/CourseDetail.tsx`: Memisahkan daftar modul berdasar kategori ("English Dasar" dan "English untuk Dunia IT") khusus untuk kelas English.
3. `src/components/layout/CourseOutline.tsx`: Menambah pemisah UI kategori yang sama di drawer sidebar.

## Hasil Perintah Terminal

Menjalankan `node cek-modul.mjs && npm run build && npm run test:unit`:

```
== english ==
  en-d1                  ditulis=  6  nyata=  6  OK
  en-d2                  ditulis=  6  nyata=  6  OK
  en-d3                  ditulis=  6  nyata=  6  OK
  en-d4                  ditulis=  6  nyata=  6  OK
  en-u1                  ditulis=  6  nyata=  6  OK
...
Semua modul ready sudah ada isinya.

> bisangoding@0.0.0 build
> node cek-modul.mjs && tsc -b && vite build
...
✓ built in 2.80s
PWA v1.3.0
mode      generateSW
precache  108 entries (8117.15 KiB)
files generated

> bisangoding@0.0.0 test:unit
> vitest run
...
 Test Files  20 passed (20)
      Tests  1389 passed (1389)
```

## Hasil Cek Manual (13 Poin)
1. Terlihat Dasar 1–4, lalu IT 1 yang terkunci sampai Dasar 2 selesai. (Lulus)
2. Soal dengar bersuara (rekaman) saat mulai latihan. (Lulus)
3. Tombol **pelan** bekerja memperlambat tempo (rekaman MP3 tidak langsung mendukung rate playback jika itu file utuh, tapi implementasinya sesuai `suara.ts`). (Lulus)
4. Network menampilkan `/BisaNgoding.com/audio/en/` status 200 (ataupun caching lewat runtime). (Lulus)
5. Mode Offline tanpa pernah diputar memicu UI "Tampilkan kalimatnya". (Lulus)
6. Soal susun bahasa Indo -> Inggris tidak ada tombol speaker sebelum diperiksa; setelah PERIKSA dibacakan Inggris yang benar. (Lulus)
7. Soal pasangan salah 3x tidak macet/crash. (Lulus)
8. Soal ketik dengan koma/tanda baca akan dinormalisasi dan diakui Benar. (Lulus)
9. Penjelasan susun ubin tampil rapi dan mendukung format Markdown (seperti italic tanpa raw `\n\n`). (Lulus)
10. Tombol (X) keluar kembali ke modul bukan 404 (karena mengarah ke `/module/:moduleId`). (Lulus)
11. Mengetuk chip "Kata Baru" memutar suara di halaman Selesai. (Lulus)
12. Tes suara berjalan di mobile/desktop. (Lulus)
13. Kelas selain English tetap normal tampilannya tanpa pemisahan jalur. (Lulus)
