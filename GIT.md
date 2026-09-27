# Kelas Git & GitHub — prompt untuk AI agent

Materi **sudah ada** di `content/git/` (dipasang dengan `pasang-git.mjs`): modul Git Dasar, Git Branching,
dan Git Remote, masing-masing dengan quiz. Enam modul GitHub terdaftar sebagai `draft` dan diisi nanti.

Tugasmu hanya membuat kelas ini tampil dengan benar. **Jangan mengubah apa pun di `content/`.**
Kalau ada materi yang menurutmu salah, laporkan nomor pelajarannya — jangan diperbaiki sendiri.
Semua output terminal di materi diambil dari Git asli, jadi jangan "merapikan" isinya.

Kerjakan 7 tugas berurutan. Setelah selesai jalankan `node cek-modul.mjs`, `npm run build`, dan
`npm run test:unit`, lalu tambah satu baris di `LAPORAN.md`.

Dilarang: menjalankan e2e/Playwright, menyentuh `src/lib/javaRunner.ts`, memakai `.skip`,
dan mengubah angka di test supaya lulus.

---

## Latar belakang singkat

Git tidak bisa dijalankan di browser seperti Java. Jadi pelajaran kelas ini memakai pola yang sama
dengan modul Java 17 (Record & Sealed): `"runnable": false`, tanpa tombol Jalankan Kode, dengan kartu
teori berjudul **"Coba di komputermu"** berisi perintah dan output aslinya.

Setiap pelajaran berisi 8 kartu: 4 `theory`, 1 `understanding_check`, 1 `predict_output`, 1 `fill_blank`, 1 `summary`.
Kode di kartu-kartu itu adalah **perintah terminal (bash)**, bukan Java.

---

## Tugas 1 — Daftarkan kelas Git

`src/lib/content.ts`:

```ts
import gitModules from '../../content/git/modules.json';
export const modulesData = [...javaModules, ...jsModules, ...englishModules, ...gitModules] as Module[];
```

(Kalau `englishModules` belum ada karena ENGLISH.md belum dikerjakan, tambahkan `gitModules` saja.)

Kelas `git` di `content/courses.json` sudah berstatus `ready` dengan `language: "git"`.

## Tugas 2 — Jangan mewarnai perintah terminal sebagai Java

Saat ini beberapa komponen memilih pewarnaan dengan pola
`language === 'javascript' ? javascript() : java()`. Akibatnya perintah Git diwarnai seperti kode Java.

Buat satu fungsi bantu, misalnya di `src/lib/editorBahasa.ts`:

```ts
export function ekstensiBahasa(language: string) {
  if (language === 'javascript') return [javascript()];
  if (language === 'java') return [java()];
  return [];   // git, english, dan lainnya: teks polos
}
```

Pakai fungsi itu di **semua** tempat yang memakai pola lama. Minimal periksa:

- `src/components/cards/QuizCards.tsx` (kartu `predict_output` dan `fill_blank`)
- `src/pages/Quiz.tsx` (soal quiz yang punya `code`)
- `src/components/cards/InteractiveCards.tsx`

```bash
grep -rn "javascript() : java()" src/
```

harus kosong setelah selesai.

## Tugas 3 — Pertanyaan khusus di kartu prediksi

Kartu `predict_output` sekarang selalu berjudul "Apa output dari program ini?". Materi Git memakai
pertanyaan yang lebih spesifik, misalnya *"Berapa file yang muncul sebagai untracked di git status?"*.

Di `src/types/schema.ts`, tambahkan field opsional ke `PredictOutputCard`:

```ts
question?: string;
```

Di komponennya:

```tsx
<h3 className="font-bold text-lg">{card.question ?? 'Apa output dari program ini?'}</h3>
```

Kartu lama tanpa `question` tidak berubah tampilannya.

## Tugas 4 — Diagram dan blok terminal

Materi memakai dua jenis diagram Mermaid di dalam kartu teori:

- `gitGraph` — menggambar commit dan branch (dipakai di banyak pelajaran)
- `flowchart LR` — alur tiga area Git dan hubungan laptop dengan GitHub

Pastikan keduanya tampil dengan benar dan **terbaca di layar HP**: diagram boleh di-scroll ke samping
di dalam kotaknya sendiri, tapi halaman tidak boleh ikut melebar.

Materi juga memakai blok kode ` ```bash ` (perintah) dan ` ```text ` (output terminal). Keduanya harus
tampil sebagai blok kode biasa dengan tombol salin, **tanpa** tombol Jalankan. Output yang panjang
di-scroll ke samping di dalam bloknya, bukan membungkus baris, supaya tampilan terminal tetap utuh.

Karakter tab di output `git status` (sebelum `new file:` dan `modified:`) harus tetap tampil sebagai jarak.

## Tugas 5 — Tanda "Praktik di komputermu"

Di halaman modul dan di kartu kelas Git pada Dashboard, tampilkan label kecil
**"Praktik di terminal komputermu"**, dengan gaya yang sama seperti label "BUTUH JDK 17 DI KOMPUTER"
yang sudah ada di `ModuleDetail.tsx`. Syaratnya: modul dari kelas dengan `language === 'git'`.

Enam modul GitHub (`gh-*`) berstatus `draft`, jadi otomatis tampil sebagai "Segera hadir" di panel daftar modul.
Pastikan tidak ada yang bisa diklik.

## Tugas 6 — Test

**`src/test/content-git.test.ts`**, untuk semua pelajaran kelas `git`:

1. `runnable` bernilai `false`.
2. Tidak ada kartu bertipe `runnable` atau `code_challenge`.
3. Setiap `fill_blank`: jumlah `___` di `code` sama dengan panjang `answers`.
4. Setiap `predict_output`: 4 opsi, tidak ada yang kembar, `answer` di dalam rentang.
5. Setiap blok ` ```mermaid ` diawali `gitGraph` atau `flowchart`.

**`src/test/mermaid-valid.test.ts`**: ambil semua blok ` ```mermaid ` dari seluruh `content/`, lalu
validasi masing-masing dengan `await mermaid.parse(teks)`. Test ini menangkap diagram yang akan tampil
sebagai "Error rendering diagram".

Kalau `mermaid` tidak bisa dimuat di lingkungan vitest setelah 3 percobaan, **berhenti dan laporkan**
pesan errornya di LAPORAN.md. Jangan menghapus test itu dan jangan mengubahnya jadi selalu lulus.

**Tambahkan juga ke test yang sudah ada:** `ekstensiBahasa('git')` dan `ekstensiBahasa('english')`
mengembalikan array kosong.

## Tugas 7 — Cek manual

Jalankan `npm run dev`. Tulis hasil tiap nomor di laporan.

**Laptop, lebar 1280px**

1. Dashboard menampilkan Kelas Git & GitHub dengan label "Praktik di terminal komputermu".
2. Buka Git Dasar → Pelajaran 4 (Tiga Area Kerja Git). Diagram alur tiga area tampil, bukan tulisan error.
3. Pelajaran 6 (git log): diagram commit dengan label HEAD tampil.
4. Kartu "Coba di komputermu": ada blok perintah dengan tombol salin, lalu blok output. Tidak ada tombol Jalankan.
5. Kartu prediksi Pelajaran 8 menampilkan pertanyaan "Berapa file yang muncul sebagai untracked di git status?",
   bukan "Apa output dari program ini?".
6. Perintah di kartu prediksi dan isian **tidak** diwarnai seperti Java.
7. Git Branching → Pelajaran 5 (Merge Conflict): output dengan `<<<<<<<` dan `>>>>>>>` tampil utuh.
8. Quiz Git Dasar bisa dikerjakan sampai selesai; soal yang punya kode menampilkan perintahnya dengan benar.
9. Modul GitHub tampil sebagai "Segera hadir" dan tidak bisa diklik.

**HP, lebar 375px**

10. Diagram gitGraph bisa di-scroll di dalam kotaknya, halaman tidak melebar.
11. Output terminal yang panjang (misalnya `git status` saat conflict) di-scroll di dalam bloknya.

**Kelas lain tidak rusak**

12. Satu pelajaran Java Dasar: kode masih berwarna seperti Java, tombol Jalankan Kode masih berfungsi.
13. Satu pelajaran JavaScript: kode masih berwarna seperti JavaScript.

## Baris untuk LAPORAN.md

```
| 31 | 2026-09-XX HH:mm | Kelas Git: daftar modul, pewarnaan per bahasa, question di prediksi, test mermaid | LULUS x/y | ... | ... | 13/13 cek manual lulus |
```
