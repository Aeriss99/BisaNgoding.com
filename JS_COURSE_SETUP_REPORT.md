# Ringkasan Pengaturan Kursus JavaScript (Multi-course Setup)

## File yang Diubah/Dibuat
1. **`content/courses.json`** (Baru): Mendefinisikan list course yang didukung (Java & JavaScript).
2. **`content/modules.json`**: Menambahkan modul `js-dasar` dengan status "ready".
3. **`content/js-module-01-dasar/js-dasar-01.json`** (Baru): Materi ujicoba yang memuat theory (markdown javascript statis/run), runnable, DOM runnable (html field), code challenge, dan summary.
4. **`src/types/schema.ts`**: Menambah tipe `Course`, field `courseId?: string` di `Module`, serta field `html?: string` di `RunnableCard` dan `CodeChallengeCard`.
5. **`src/lib/content.ts`**: Modifikasi filter `import.meta.glob` untuk membaca `courses.json` namun mengecualikannya dari lesson parsing, dan export variabel `coursesData`.
6. **`src/lib/jsRunner.ts`** (Baru): Mengimplementasikan runner JavaScript menggunakan `Worker` untuk evaluasi string code (dilengkapi proxy `console` untuk format output, bungkus async agar mendukung *top-level await*, hitung `setTimeout/setInterval` agar tau kapan idle, dan 5s *hard-timeout*). Tersedia juga dukungan DOM dengan mode `iframe` jika `html` disediakan. Termasuk fallback `eval` simpel untuk lingkungan tes yang tidak punya akses `Worker`.
7. **`src/lib/jsRunner.test.ts`** (Baru): Unit test untuk mengecek log data, runtime/syntax error, async, setTimeout, timeout error loop, dan mode DOM.
8. **`src/pages/Dashboard.tsx`**: Ditambahkan state pilihan `selectedCourseId` (disimpan ke `localStorage`), filter modul berdasarkan kursus aktif (fallback ke `java` untuk modul lama), update text conditional (`Java Dasar` fallback).
9. **`src/pages/Lesson.tsx`**: Mengekstrak `course.language` dan meneruskan property prop `language` ke komponen interaktif (Runnable/CodeChallenge). Mode syntax highlighting markdown juga mendukung `` `javascript run` ``.
10. **`src/components/cards/InteractiveCards.tsx`**: Membaca prop `language`, lalu menerapkan runner dinamis (`runJsCode` jika javascript, `runJavaCode` jika java) dan `CodeMirror` syntax extension dinamis. Menyuntikkan DOM box khusus untuk DOM-runner.
11. **`e2e/js-course.spec.ts`** (Baru): Tes E2E (Playwright) bypass mode untuk mengecek navigasi kursus, klik halaman `Pengenalan JavaScript`, jalankan runnable basic, DOM, dan menyelesaikan code_challenge.
12. **`e2e/app.spec.ts`**: Perbaikan assertion count dashboard module link, untuk mengkomodir pergantian kursus, bukan hardcode 30 modul statis lagi.
13. **`src/App.tsx`**: Menambahkan opsi untuk mengaktifkan dev bypass khusus E2E Test dari `localStorage('e2e_bypass')`.

## Schema Final (Yang Berubah)
```typescript
export interface Course {
  id: string;
  title: string;
  language: string;
  order: number;
}

export interface Module {
  id: string;
  courseId?: string; // field baru (opsional, default ke Java jika undefined)
  title: string;
  order: number;
  lessonCount: number;
  status?: 'ready' | 'draft';
  requires?: string;
  estimatedHours?: number;
}

export interface RunnableCard {
  type: 'runnable';
  html?: string; // dukungan DOM opsional
  code: string;
  // ... (sisanya sama)
}

export interface CodeChallengeCard {
  type: 'code_challenge';
  html?: string; // dukungan DOM opsional
  prompt: string;
  starterCode: string;
  // ... (sisanya sama)
}
```

## Format Output Console
Output distandardisasi sedekat mungkin dengan Node.js/Browser Console bawaan.
- **String**: Tidak diubah (tanpa kutip, kecuali berada di dalam Object).
- **Number, Boolean, Null, Undefined**: Menjadi string secara konvensional (contoh: `123`, `true`, `null`).
- **Array**: Disajikan memanjang mirip format node. Contoh: `[ 1, 2, 3 ]`.
- **Object**: Memakai formatting mirip node. Contoh: `{ a: 1, b: 'dua' }`.
- **Error**: Di-format menjadi "NameError: message". Contoh: `ReferenceError: x is not defined`.
- **Multiple Arguments**: Dipisahkan oleh spasi jika diberikan beberapa argumen. Contoh `console.log("a", 1)` -> `a 1\n`.

## Hasil Test
- **Unit Test (jsRunner.test.ts)**: Seluruh test (data type parsing, syntax/runtime error, setTimeout, async/await Promise, timeout infinite loop, dan basic DOM text fetch) **PASSED**.
- **Java E2E (app.spec.ts)**: Semua test berjalan sukses (termasuk modul check karena logic course backward-compatible: modul Java lama otomatis ter-filter ke course "java").
- **JS Course E2E (js-course.spec.ts)**: Bypass auth -> buka kursus JS -> buka materi JS -> cek output Runnable (Halo Runnable) -> cek output DOM -> selesaikan Challenge CodeMirror -> sukses **PASSED**.
- **Linter & Prettier**: Sudah di-run menggunakan oxlint/eslint dan Code formatted via Prettier (tidak ada fatal errors).

## Masalah yang Belum Selesai (TODO / Perlu Perhatian)
1. **Styling/Resize DOM iframe**: Kotak `iframe` yang berisi `html` sekarang memiliki style default (`height: 300px`, `width: 100%`). Jika pengguna menulis HTML yang panjang, diperlukan responsivitas (mungkin resize otomatis lewat postMessage dari iframe).
2. **Infinite Loop dalam DOM Mode**: Worker memilki limitasi isolasi yang kuat untuk timeout (`worker.terminate()`). Mode DOM Iframe JavaScript (karena memakai tag iframe sandbox biasa untuk interaksi DOM) lebih rawan nge-*freeze* browser/tab jika User mengetikkan `while(true)` dan dieksekusi secara sinkronous. `sandbox` iframe menahan cross-origin/akses sistem lokal, tetapi loop sinkronous tetap menyandera thread utama UI (di level tab). Ini hal yang masih umum terjadi bahkan di platform sejenis seperti CodePen/JSFiddle tanpa pengamanan proxy eksternal. Perlu disisipkan *Babel-based loop protector* di masa depan.
3. **Persistensi Pilihan Kursus Terakhir**: Saat di-refresh, halaman bisa terlihat sekilas menampilkan Java lalu switch ke JavaScript jika load dari localStorage sedikit tertunda sebelum React hydration (bukan isu major, tetapi patut diperhatikan demi perbaikan UX).
4. **Error Stack Trace User Friendly**: Error saat runtime sekarang memunculkan pesan asli (contoh: `ReferenceError: x is not defined`). Perlu dirapikan line-number mappingnya ke baris kode user, karena penambahan fungsi wrapper (`async function() ...`) menggeser line number asli pada throw error stack.