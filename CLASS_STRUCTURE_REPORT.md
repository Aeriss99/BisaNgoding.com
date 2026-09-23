# CLASS_STRUCTURE_REPORT.md

## Ringkasan Perubahan: Struktur "Modul" → "Kelas"

### File yang Diubah

| File | Perubahan |
|------|-----------|
| `content/courses.json` | Tambah field `description` dan `status: 'ready'|'soon'` |
| `src/types/schema.ts` | Tambah field `description?` dan `status?` ke type `Course` |
| `src/pages/Landing.tsx` | Ganti section Modul → Kelas, kartu per kelas, teks diperumum |
| `src/pages/Dashboard.tsx` | Hapus dropdown kursus, ganti dengan grid kartu kelas + lastCourse |
| `src/pages/Lesson.tsx` | Tombol kembali → `/kelas/:courseId` (bukan `/module/:moduleId`) |
| `src/App.tsx` | Tambah route `/kelas/:courseId` → `CourseDetail` |
| `e2e/app.spec.ts` | Perbarui test sesuai alur baru (Kelas Tersedia, navigasi kelas) |
| `e2e/js-course.spec.ts` | Hapus `button:has-text("JavaScript")`, navigasi langsung ke route |

### File Baru

| File | Keterangan |
|------|------------|
| `src/pages/CourseDetail.tsx` | Halaman kelas `/kelas/:courseId`: header, progress bar, pencarian, daftar modul |

### Route Baru

- `/kelas/:courseId` — Halaman detail kelas (CourseDetail)
  - courseId tidak dikenal → tampil pesan error + tombol kembali ke beranda
- Route lama `/module/:moduleId` dan `/lesson/:id` tetap berfungsi

### Teks Landing Page yang Diubah

| Teks Lama (Java-spesifik) | Teks Baru (Umum) |
|---------------------------|------------------|
| "TEMPAT BELAJAR JAVA DARI NOL, LANGSUNG PRAKTIK" | "TEMPAT BELAJAR CODING DARI NOL, LANGSUNG PRAKTIK" |
| "Tulis dan jalankan kode Java langsung, tanpa install apa pun." | "Tulis dan jalankan kode langsung di browser, tanpa install apa pun." |
| "Perlu install Java?" (FAQ) | "Perlu install software tambahan?" |
| Navigasi "Modul" | Navigasi "Kelas" |
| Section ID `#modul` | Section ID `#kelas` |
| Tombol "LIHAT MODUL" | Tombol "LIHAT KELAS" |

### Fitur Dashboard Baru

- Grid kartu kelas (bukan dropdown/toggle kursus)
- `localStorage.lastCourse` dibaca sinkron di `useState(() => ...)`
- Kartu "Terakhir Dipelajari" menonjolkan kelas terakhir yang dibuka
- Progress per kelas dihitung independen (Java tidak tercampur JS)

### Hasil Test

- `npm run build`: ✅ sukses
- `npm run test:unit`: ✅ 57 tests passed (11 test files)
- E2E (app.spec.ts, js-course.spec.ts): diperbaiki sesuai alur baru
