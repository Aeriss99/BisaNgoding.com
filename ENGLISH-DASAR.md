# Tugas: Kelas English — suara pakai rekaman + unit English Dasar

`node pasang-english-dasar.mjs` sudah dijalankan. Skrip itu sudah memasang materi, rekaman suara, dan perbaikan kode. Tugasmu: memeriksa, melengkapi 3 hal kecil, lalu memastikan build dan test lulus.

## Latar belakang (baca dulu)

Pesan **"Suara tidak tersedia di perangkat ini"** muncul karena kode lama hanya memakai suara bawaan browser (`speechSynthesis`). Di banyak browser Linux dan sebagian HP Android, daftar suaranya kosong. Solusinya sekarang:

1. **Rekaman MP3** yang dibuat sebelumnya (`public/audio/en/*.mp3`, 395 file). Terdengar sama di semua perangkat.
2. Suara browser hanya dipakai sebagai cadangan kalau kalimatnya tidak punya rekaman.
3. Kalau keduanya gagal, soal dengar menampilkan pesan dan tombol **"Tampilkan kalimatnya"**. Kalimatnya tidak langsung dibuka, supaya soal dengar tidak berubah menjadi soal baca.

## Yang sudah dipasang skrip (JANGAN dibalik)

| File | Isi |
|---|---|
| `src/lib/suara.ts` | `ucapkan(teks, lambat)` → `Promise<'rekaman' \| 'browser' \| 'diblokir' \| 'gagal'>`, `hentikanSuara()`, `adaRekaman()`, `alamatRekaman()`, `kunciSuara()`. `bisaBersuara()` dipertahankan untuk kode lama. |
| `src/data/rekaman-en.json` | `{ kunci: nama_file }`. Kunci = `kunciSuara(teks)`. |
| `public/audio/en/*.mp3` | 395 rekaman (±3,5 MB). **Wajib ikut di-commit.** |
| `src/lib/latihan.ts` | `normalisasi()` sekarang membuang semua tanda baca (koma di tengah kalimat juga), apostrof tetap. Sebelumnya `"I'm fine, thank you"` dinilai salah terhadap `"i'm fine thank you"`. |
| `SoalSusunUbin.tsx` | Prop baru `direction`. Tombol dengar hanya muncul kalau kalimatnya berbahasa Inggris (listen, atau translate `en-id`). Sebelumnya kalimat bahasa Indonesia dibacakan dengan suara Inggris. |
| `SoalPasangan.tsx` | Logika pencocokan dipindah ke handler klik. Versi lama memanggil `onWrong()` dari `useEffect` yang bergantung pada `onWrong`, sehingga salah pasang memicu render tanpa henti. Mengetuk kata Inggris = mendengar pelafalannya. |
| `SoalKetik.tsx` | Prop baru `direction`, tombol dengar untuk `en-id`, judul soal, autocorrect HP dimatikan. |
| `PemutarLatihan.tsx` | Menampilkan `\n\n` sebagai jeda baris, bukan tulisan mentah. Penjelasan dirender sebagai markdown. Tombol keluar ke `/module/:moduleId`; sebelumnya `/kelas/en` yang tidak ada. `key={status.posisi}` di setiap kartu, supaya kartu yang diulang mulai bersih. Setelah PERIKSA, soal `id-en` membacakan kalimat Inggris yang benar. Chip "Kata Baru" bisa diketuk untuk didengar. |
| `content/english/dasar-0{1..4}-*/` | 24 pelajaran English Dasar (`en-d1` sampai `en-d4`). |
| `content/english/modules.json` | Dasar 1–4 siap, Dasar 5–8 draft (urutan 40–47). Unit IT pindah ke urutan 60–67. **IT 1 sekarang butuh Dasar 2.** |
| `src/test/suara-english.test.ts` | Test rekaman, cakupan suara, normalisasi, dan urutan modul. |
| `cek-modul.mjs` | Sekarang memeriksa semua kelas (english dan git juga). |

Kalau output skrip ada baris berawalan `!`, versi baru file itu ada di `perbaikan-english/`. Gabungkan perubahannya ke file asli, lalu hapus folder `perbaikan-english/`.

## Tugas

### 1. Rekaman bisa dipakai offline (PWA)

Di `vite.config.ts`, tambahkan `runtimeCaching` di `workbox`. **Jangan** memasukkan mp3 ke precache (3,5 MB akan diunduh semua saat pertama buka).

```ts
runtimeCaching: [
  {
    urlPattern: ({ url }) => url.pathname.includes('/audio/en/'),
    handler: 'CacheFirst',
    options: {
      cacheName: 'suara-en',
      expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 90 },
      cacheableResponse: { statuses: [0, 200] },
      rangeRequests: true,
    },
  },
],
```

### 2. Halaman kelas English: pisahkan dua jalur

Kelas English sekarang punya dua jalur: **English Dasar** (`en-d*`) dan **English untuk Dunia IT** (`en-u*`). Di halaman kelas (dan panel daftar modul di sidebar, kalau ada), tampilkan judul kelompok di atas masing-masing jalur. Cukup dua judul kecil. Jangan ubah struktur data dan jangan buat komponen baru yang besar. Kelas lain tidak boleh berubah tampilannya. Kalau tampilan sekarang tidak punya tempat yang wajar untuk judul kelompok, lewati tugas ini dan tulis alasannya di laporan.

### 3. Jalankan dan perbaiki sampai lulus

```bash
node cek-modul.mjs && npm run build && npm run test:unit
```

- Kalau `suara-english.test.ts` gagal, **jangan** mengubah test atau `rekaman-en.json` supaya lulus. Laporkan pesan gagalnya.
- `content-english.test.ts` memakai `normalisasi()`. Dengan versi baru, teks dengar seperti `"Hi, good morning."` cocok dengan jawabannya. Dengan versi lama, test ini gagal di materi baru.
- Jangan mengembalikan urutan "suara browser dulu". Jangan membuat ulang rekaman.

## Larangan

- Jangan mengedit file JSON materi, `rekaman-en.json`, atau file mp3.
- Jangan menambah library suara atau layanan TTS online.
- Jangan menampilkan kalimat soal dengar secara otomatis saat suara gagal. Pengguna yang memilih lewat tombol "Tampilkan kalimatnya".

## Cek manual (laporkan hasil tiap nomor)

1. `npm run dev`, buka kelas English. Terlihat Dasar 1–4, lalu IT 1 (terkunci sampai Dasar 2 selesai).
2. Buka Dasar 1 pelajaran 1, klik Mulai Latihan. Soal dengar langsung bersuara (suara perempuan, bahasa Inggris Amerika).
3. Tombol **pelan** memutar lebih lambat.
4. DevTools → Network: file `audio/en/xxxxxxxxxxxx.mp3` status 200. Setelah build dengan `GITHUB_PAGES=true`, alamatnya diawali `/BisaNgoding.com/audio/en/`.
5. DevTools → Network → Offline, lalu buka soal dengar yang **belum pernah** diputar. Muncul pesan "Suara tidak bisa diputar..." dan tombol "Tampilkan kalimatnya". Kalimat muncul setelah diketuk.
6. Soal susun ubin dari bahasa Indonesia ke Inggris: **tidak ada** tombol speaker di samping kalimat Indonesia. Setelah PERIKSA, kalimat Inggris yang benar dibacakan.
7. Soal pasangan: sengaja salah pasang 3 kali. Halaman tidak macet, tidak ada error di console. Mengetuk kata Inggris memutar suaranya.
8. Dasar 1 pelajaran 3, soal ketik "How are you?": jawab `Apa kabar, kamu?` (dengan koma dan tanda tanya). Hasilnya **Benar**, bukan "Hampir benar" atau salah.
9. Jawab salah satu soal susun ubin. Penjelasan tampil rapi, tanpa tulisan `\n`, dan huruf miring tampil miring.
10. Klik X di tengah pelajaran, lalu Keluar. Kembali ke halaman modul, bukan halaman 404.
11. Di halaman selesai, ketuk salah satu chip "Kata Baru". Suaranya terputar.
12. Tes di HP Android (Chrome) dan di Chrome/Firefox Linux: soal dengar bersuara. Ini perangkat tempat bug awal muncul.
13. Kelas Java, JavaScript, dan Git tetap normal.

## Laporan

Tulis `ENGLISH_DASAR_REPORT.md`: file yang diubah, hasil ketiga perintah di tugas 3 (tempel ringkasannya), dan hasil 13 cek manual.
