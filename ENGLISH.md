# Kelas English for IT Professionals: mode latihan — prompt untuk AI agent

Materi Unit 1 **sudah ada** di `content/english/` (dipasang dengan `pasang-english-unit1.mjs`).
Tugasmu membangun **mode latihan** supaya materi itu bisa dimainkan. **Jangan mengubah apa pun di `content/`.**
Kalau ada soal yang menurutmu salah, laporkan nomornya — jangan diperbaiki sendiri.

Kerjakan 8 tugas berurutan. Setelah selesai jalankan `node cek-modul.mjs`, `npm run build`, dan
`npm run test:unit`, lalu tambah satu baris di `LAPORAN.md`.

Dilarang: menjalankan e2e/Playwright, menyentuh `src/lib/javaRunner.ts`, memakai `.skip`,
mengubah angka di test supaya lulus, dan meniru nama, maskot, atau tampilan Duolingo.
Pakai gaya neo-brutalism yang sudah ada (border hitam tebal, bayangan keras, kuning-cyan).

---

## Gambaran

Kelas Java memakai gaya **baca dulu, baru latihan**. Kelas English memakai gaya **langsung latihan**:

- satu soal per layar, tombol **Periksa** di bawah;
- setelah menjawab, panel muncul dari bawah: hijau "Benar!" atau merah dengan jawaban yang benar;
- **soal yang salah diulang di akhir pelajaran sampai benar**;
- tanpa sistem nyawa;
- pelajaran selesai setelah semua soal akhirnya dijawab benar.

Pelajaran yang memakai mode ini ditandai `"mode": "latihan"` di file JSON-nya.

---

## Tugas 1 — Daftarkan kelas English

`src/lib/content.ts`:

```ts
import englishModules from '../../content/english/modules.json';
export const modulesData = [...javaModules, ...jsModules, ...englishModules] as Module[];
```

Periksa bahwa `Dashboard`, `CourseDetail`, `ModuleDetail`, dan `CourseOutline` tidak rusak untuk
kelas dengan `language: "english"`. Kalau ada kode yang memilih runner atau CodeMirror berdasarkan
`language`, pastikan `english` tidak jatuh ke Java secara diam-diam.

## Tugas 2 — Tipe data baru

Tambahkan ke `src/types/schema.ts`:

```ts
export interface TranslateTilesCard {
  type: 'translate_tiles';
  direction: 'en-id' | 'id-en';
  prompt: string;          // kalimat sumber
  tiles: string[];         // ubin jawaban + pengecoh
  answers: string[][];     // urutan ubin yang diterima; answers[0] = jawaban utama
  explanation?: string;
}

export interface ListenTilesCard {
  type: 'listen_tiles';
  text: string;            // kalimat Inggris yang dibacakan
  tiles: string[];
  answers: string[][];
  explanation?: string;
}

export interface MatchPairsCard {
  type: 'match_pairs';
  pairs: { en: string; id: string }[];   // 4-5 pasang
}

export interface TypeTranslationCard {
  type: 'type_translation';
  direction: 'en-id' | 'id-en';
  prompt: string;
  answers: string[];       // sudah huruf kecil, tanpa tanda baca akhir; answers[0] = jawaban utama
  explanation?: string;
}
```

Masukkan keempatnya ke union `Card`. Tambahkan field opsional ke `Lesson`:

```ts
mode?: 'latihan';
tips?: string;                                // markdown singkat
newWords?: { word: string; meaning: string }[];
glossary?: Record<string, string>;            // kata atau frasa Inggris -> arti Indonesia
```

`multiple_choice` yang sudah ada dipakai ulang di mode latihan.

## Tugas 3 — Logika murni (tanpa React), wajib ada unit test

Buat `src/lib/latihan.ts`. Semua fungsi di sini murni supaya mudah diuji.

```ts
// Membandingkan ubin tanpa peduli huruf besar kecil
export function cekUbin(pilihan: string[], answers: string[][]): boolean

// huruf kecil, trim, spasi ganda jadi satu, buang . ! ? di akhir, ganti ’ dengan '
export function normalisasi(s: string): string

// 'benar'  : sama persis dengan salah satu jawaban setelah normalisasi
// 'hampir' : jarak Levenshtein ke jawaban terdekat <= max(1, floor(panjang / 10)) → dianggap benar,
//            tapi tampilkan "Perhatikan ejaannya: <jawaban terdekat>"
// 'salah'  : selain itu
export function cekKetik(input: string, answers: string[]): { hasil: 'benar' | 'hampir' | 'salah'; terdekat: string }

// Antrean soal: soal yang salah ditaruh lagi di akhir
export interface StatusLatihan { antrean: number[]; posisi: number; salahPertama: Set<number>; selesai: Set<number>; }
export function mulaiLatihan(jumlahSoal: number): StatusLatihan
export function setelahJawab(s: StatusLatihan, benar: boolean): StatusLatihan
export function progres(s: StatusLatihan, jumlahSoal: number): number   // 0..1, dari soal yang sudah benar
export function sudahSelesai(s: StatusLatihan): boolean
```

Test di `src/lib/latihan.test.ts`, minimal:

1. `cekUbin(['saya','menemukan','bug'], [['Saya','menemukan','bug']])` → true (huruf besar diabaikan).
2. `cekUbin` dengan urutan salah → false.
3. `normalisasi('  Thanks!  ')` → `'thanks'`.
4. `cekKetik('servernya mati', [...])` → benar. `cekKetik('servernya mtai', ['servernya mati'])` → hampir.
   `cekKetik('saya lapar', ['servernya mati'])` → salah.
5. Soal yang dijawab salah muncul lagi di akhir antrean. Soal yang benar tidak muncul lagi.
6. `sudahSelesai` hanya true setelah semua soal pernah dijawab benar.
7. Menjawab salah berkali-kali pada soal yang sama tidak membuat antrean bertambah tanpa batas:
   soal itu hanya ada **satu** salinan di sisa antrean pada satu waktu.

## Tugas 4 — Suara dari browser

Buat `src/lib/suara.ts` memakai `window.speechSynthesis`:

```ts
export function bisaBersuara(): Promise<boolean>        // true kalau ada suara bahasa Inggris
export function ucapkan(teks: string, lambat = false): void
```

- Pilih suara yang `lang`-nya diawali `en` (utamakan `en-US`, lalu `en-GB`).
- `rate` 0.9 untuk normal, 0.6 untuk lambat.
- Panggil `speechSynthesis.cancel()` sebelum mengucapkan kalimat baru.
- Daftar suara di beberapa browser baru tersedia setelah event `voiceschanged` — tunggu event itu,
  dengan batas waktu 2 detik.
- Tidak boleh melempar error kalau `speechSynthesis` tidak ada.

Unit test: kalau `window.speechSynthesis` tidak ada, `bisaBersuara()` menghasilkan false dan `ucapkan()` tidak error.

## Tugas 5 — Komponen soal

Buat di `src/components/latihan/`. Semua ubin dan tombol minimal tinggi 44px.

**`KalimatBerarti.tsx`** — menampilkan kalimat Inggris yang setiap kata atau frasanya bisa diketuk.
- Pecah kalimat jadi kata. Cocokkan dengan `lesson.glossary`, **frasa terpanjang dulu** (sampai 3 kata),
  misalnya "take a look" dicocokkan sebagai satu kesatuan sebelum "take".
- Kata yang ada di glossary diberi garis bawah titik-titik. Ketuk → popover kecil berisi artinya.
- Kata yang ada di `lesson.newWords` diberi latar kuning muda, supaya pengguna tahu itu kata baru.
- Dipakai untuk: prompt `translate_tiles` dan `type_translation` arah `en-id`.

**`SoalSusunUbin.tsx`** (untuk `translate_tiles` dan `listen_tiles`)
- Acak ulang ubin saat soal muncul (Fisher–Yates).
- Ubin di bank diketuk → pindah ke baris jawaban. Ubin di baris jawaban diketuk → kembali ke bank.
- Ubin dengan teks sama (misalnya dua "saya") dibedakan berdasarkan posisinya, bukan teksnya.
- `translate_tiles` arah `en-id`: tombol speaker kecil di samping prompt.
- `listen_tiles`: tidak ada teks; yang tampil tombol speaker besar dan tombol "pelan".
  Coba putar sekali saat soal muncul, abaikan kalau browser menolak. Kalau `bisaBersuara()` false,
  tampilkan teksnya dengan label kecil "Suara tidak tersedia di perangkat ini".

**`SoalPasangan.tsx`** (untuk `match_pairs`)
- Dua kolom, masing-masing diacak terpisah.
- Ketuk satu di kiri lalu satu di kanan. Cocok → keduanya hijau dan tidak bisa diklik lagi.
  Tidak cocok → berkedip merah, pilihan dibatalkan.
- Soal selesai otomatis saat semua cocok. Tidak perlu tombol Periksa.
- Soal ini **tidak** diulang di akhir, tapi kalau ada salah pasang, dihitung salah untuk akurasi.

**`SoalKetik.tsx`** (untuk `type_translation`)
- Kotak teks, Enter untuk Periksa. Nilai dengan `cekKetik`.

**`SoalPilihan.tsx`** (untuk `multiple_choice` di mode latihan)
- Pilih satu, lalu Periksa. **Jangan** memakai komponen pilihan ganda kelas Java,
  karena komponen itu menampilkan penjelasan dan tombol Lanjut sendiri.
- Soal dan opsi berisi markdown ringan (`**tebal**`, `*miring*`) — render dengan ReactMarkdown.

## Tugas 6 — Pemutar latihan

Buat `src/components/latihan/PemutarLatihan.tsx`. Di `src/pages/Lesson.tsx`, kalau
`lesson.mode === 'latihan'`, render `<PemutarLatihan lesson={lesson} />` sebagai gantinya.

**Layar pembuka**: judul pelajaran, jumlah soal, perkiraan menit, tombol **Mulai**, dan tombol
**Tips** (kalau `lesson.tips` ada) yang membuka kartu berisi markdown tips.

**Selama latihan**:
- Atas: tombol ✕ dan progress bar (dari `progres()`).
- Tengah: soal aktif.
- Bawah: tombol **Periksa**, nonaktif sampai ada jawaban.
- Setelah Periksa: panel bawah berubah warna.
  - Benar: hijau, "Benar!" (atau "Hampir benar — perhatikan ejaannya: ..." untuk `hampir`).
  - Salah: merah, "Jawaban yang benar:" diikuti `answers[0]` (digabung spasi), lalu `explanation` kalau ada.
  - Tombol berubah jadi **Lanjut**. Enter juga bisa dipakai untuk Periksa dan Lanjut.
- Panel memakai `aria-live="polite"`.

**Keluar di tengah jalan**: klik ✕ saat sudah menjawab minimal satu soal → kartu konfirmasi
"Progres pelajaran ini akan hilang. Keluar?" (gaya kartu brutal, bukan `window.confirm`).

**Layar selesai**:
- XP: 10, ditambah 5 kalau semua soal benar pada percobaan pertama.
- Akurasi: soal yang benar pada percobaan pertama ÷ jumlah soal.
- Kata baru yang dipelajari (dari `lesson.newWords`).
- Panggil `markLessonCompleted(lesson.id)` dan `addXP(...)` **sekali saja**.
- Tombol **Lanjut** ke halaman modul.

**Tampilan HP**: baris jawaban di atas, bank ubin di bawahnya, tombol Periksa menempel di bawah layar
dengan `padding-bottom: env(safe-area-inset-bottom)`. Tidak boleh ada scroll ke samping di lebar 360px.

## Tugas 7 — Test isi materi English

Buat `src/test/content-english.test.ts` yang memeriksa semua pelajaran dengan `mode: 'latihan'`:

1. Setiap jawaban `translate_tiles` dan `listen_tiles` bisa disusun dari ubin yang tersedia (huruf besar kecil diabaikan).
2. Setiap soal susun ubin punya minimal 2 ubin pengecoh.
3. Teks `listen_tiles` (tanpa tanda baca) sama dengan `answers[0]`.
4. `match_pairs` berisi 4-5 pasang tanpa kembar.
5. `multiple_choice`: opsi unik dan `answer` di dalam rentang.
6. Setiap kata di `newWords` punya arti di `glossary`.

Test ini menjaga supaya materi yang ditambahkan nanti tidak rusak diam-diam.

## Tugas 8 — Kartu kelas

Di Dashboard dan halaman kelas, kelas English menampilkan label kecil **"Latihan 5 menit"**
sebagai pengganti info yang tidak relevan (misalnya "butuh JDK"). Singkatannya sudah ada di data: `EN`.

---

## Cek manual sebelum lapor selesai

Jalankan `npm run dev`. Tulis hasil tiap nomor di laporan.

**Laptop, lebar 1280px**

1. Dashboard menampilkan Kelas English di urutan ke-3.
2. Buka Unit 1 → Pelajaran 1. Layar pembuka tampil, tombol Tips membuka penjelasan a/an/the.
3. Kerjakan soal susun ubin dengan jawaban benar → panel hijau.
4. Sengaja salah di satu soal → panel merah dengan jawaban yang benar → soal itu muncul lagi di akhir.
5. Ketuk kata "fix" di sebuah prompt → muncul arti "memperbaiki".
6. Soal dengar: suara terdengar, tombol "pelan" bekerja.
7. Selesaikan pelajaran → layar selesai menampilkan XP dan akurasi → kembali ke modul, Pelajaran 1 tercentang,
   Pelajaran 2 terbuka.
8. Klik ✕ di tengah pelajaran → kartu konfirmasi muncul.

**HP, lebar 375px**

9. Ubin tidak terpotong dan tidak ada scroll ke samping.
10. Tombol Periksa selalu terlihat di bawah, tidak tertutup keyboard saat soal ketik.
11. Soal pasangan bisa dikerjakan dengan jari tanpa salah ketuk.

**Kelas lain tidak rusak**

12. Buka satu pelajaran Java Dasar → masih memakai tampilan kartu biasa, tombol Jalankan Kode masih berfungsi.

## Baris untuk LAPORAN.md

```
| 30 | 2026-09-XX HH:mm | Mode latihan + 4 tipe soal + suara, kelas English Unit 1 | LULUS x/y | ... | ... | 12/12 cek manual lulus |
```
