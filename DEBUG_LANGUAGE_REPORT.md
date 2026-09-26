# Laporan Investigasi Bug Bahasa: JavaScript menjalankan Java

## 1. Analisis `src/pages/Lesson.tsx`
Halaman ini menentukan `language` **bukan** dari sisa-sisa state localStorage atau context (seperti pilihan kursus di Dashboard), melainkan murni dari `moduleId` pada lesson tersebut yang kemudian dicari ke `coursesData`. 

Namun, terjadi kesalahan pemanggilan modul yang menyebabkan bahasa jatuh (fallback) ke Java. Berikut adalah kode persis yang digunakan untuk menentukannya:
```tsx
const mod = getModule(lesson.moduleId);
if (mod && !checkModuleUnlocked(mod, progress)) {
  return <Navigate to={`/kelas/${mod.courseId || 'java'}`} replace />;
}

const course = coursesData.find((c) => c.id === (mod?.courseId || 'java'));
const language = course?.language || 'java';
```

## 2. Analisis `src/components/cards/InteractiveCards.tsx`
Komponen ini menerima `language` langsung melalui **prop**, bukan context. `Lesson.tsx` secara eksplisit meneruskan `language` yang ia temukan ke `CodeChallengeCardComponent` dan `RunnableCardComponent`. Tidak ada *hardcode* default yang memaksa jika nilai valid diteruskan. 

Berikut bagian yang memilih runner berdasarkan prop tersebut:
```tsx
const res = language === 'javascript'
  ? await runJsCode(code, card.html, (s) => setStatusText(s))
  : await runJavaCode(code, test.input, (s) => setStatusText(s));
```

## 3. Riwayat Refactor "Kelas"
Di halaman `Dashboard.tsx`, masih ada penggunaan `localStorage.getItem('lastCourse')`. Tetapi state tersebut hanya dipakai murni untuk tampilan UI di Dashboard (kartu "Lanjutkan Belajar") dan sama sekali tidak di-*import* atau dibaca oleh `Lesson.tsx` atau eksekusi materi. Jadi bug ini **tidak disebabkan** oleh sisa state refactor.

## 4. Uji Alur Akses Langsung & Penyebab Utama (The Bug)
Jika seseorang membuka `/lesson/js-dasar-01` secara langsung:
1. `useParams()` mengambil `lessonId = "js-dasar-01"`.
2. `getLesson("js-dasar-01")` mengambil data lesson JSON, yang memiliki properti `moduleId: "js-dasar"`.
3. `Lesson.tsx` memanggil `getModule("js-dasar")` yang kemudian memanggil fungsi helper `sameModule()`.
4. Di sinilah **akar masalahnya**: array `modulesData` dideklarasikan sebagai `[...javaModules, ...jsModules]`, sehingga modul Java selalu diperiksa lebih dulu.
5. Fungsi `sameModule(a, b)` di `src/lib/content.ts` dirancang dengan logika toleransi prefix:
   ```tsx
   function sameModule(a: string, b: string): boolean {
     if (!a || !b) return false;
     if (a === b) return true;
     return a.endsWith('-' + b) || b.endsWith('-' + a);
   }
   ```
6. Saat array loop sampai pada modul Java `"dasar"` (di mana `a = "dasar"`), ia dicocokkan dengan `b = "js-dasar"`.
7. Karena logika `b.endsWith('-' + a)` menghasilkan `"js-dasar".endsWith("-dasar")` yang bernilai **TRUE**, fungsi tersebut mengembalikan modul **Java "dasar"**, BUKAN modul JavaScript "js-dasar".
8. Modul Java tersebut tidak memiliki `courseId` khusus (atau default), sehingga `mod?.courseId || 'java'` menghasilkan `'java'`. 
9. `Lesson.tsx` akhirnya menetapkan `language = 'java'` dan meneruskannya ke `InteractiveCards.tsx`, yang secara keliru mengeksekusi sintaks JS ke compiler CheerpJ/Java.

## 5. Pemeriksaan `modules.json` dan `courses.json`
- **Konfirmasi modul JavaScript:** Ya, modul "js-dasar" di dalam `content/javascript/modules.json` **sudah memiliki** field `courseId: "javascript"`.
- **Konfirmasi courses:** Ya, entri "javascript" di `content/courses.json` **sudah memiliki** field `language: "javascript"`.

**Kesimpulan:** Seluruh struktur data sudah benar. Bug mutlak disebabkan oleh logika string-matching di fungsi `sameModule` yang terlalu longgar, sehingga `js-dasar` disangka sebagai alias dari modul Java `dasar`.
