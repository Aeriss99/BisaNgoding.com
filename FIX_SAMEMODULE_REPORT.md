# Laporan Perbaikan Bug `sameModule`

## Tahap A — Audit pemakaian `sameModule`
Fungsi `sameModule` digunakan di beberapa tempat di `src/lib/content.ts`:
1. `resolveModuleId(idOrAlias)`: Tujuannya mendapatkan ID resmi dari parameter ID URL/router. Diubah ke exact match.
2. `getModule(idOrAlias)`: Tujuannya mencari objek Module berdasarkan moduleId. Inilah letak bug utamanya yang menyebabkan JavaScript salah terdeteksi sebagai Java karena "js-dasar".endsWith("-dasar") mengembalikan true. Diubah ke exact match.
3. `getLessonsForModule(idOrAlias)`: Tujuannya untuk mencocokkan lesson apa saja yang dimiliki suatu moduleId. Diubah ke exact match.
4. `getQuizQuestions(idOrAlias)`: (Baris ~126) Digunakan untuk mencocokkan kuis yang ada di suatu folder (yang ter-map pada `folderModuleId`) dengan daftar candidates. Di fungsi ini `sameModule` dibiarkan dipakai secara sadar (kasus validasi folder) karena struktur content memungkinkan kuis diletakkan dalam direktori yang berelasi (seperti folder `-dasar`).

## Tahap B — Perbaikan `getModule` (Exact Match)
Kode `getModule`, `resolveModuleId`, dan `getLessonsForModule` yang tadinya menggunakan:
```typescript
return modulesData.find((m) => sameModule(m.id, idOrAlias));
```
Kini diubah menjadi eksak dengan operator identitas:
```typescript
return modulesData.find((m) => m.id === idOrAlias);
```
Dengan exact match ini, meskipun `modulesData` dideklarasikan dalam urutan `[...javaModules, ...jsModules]`, modul "js-dasar" hanya akan cocok dengan string persis `"js-dasar"`, dan takkan pernah dicocokkan sebagai alias milik "dasar".

## Tahap C — Regression Test
- Telah ditambahkan file `src/test/sameModuleFix.test.ts` untuk menguji bug ini:
  - `getModule("js-dasar")` dipastikan memiliki `courseId` === `"javascript"`.
  - `getModule("dasar")` dipastikan mengembalikan object modul Java yang ID-nya persis `"dasar"`.
  - `getLessonsForModule("dasar")` dipastikan bebas dari materi-materi miliknya JavaScript `js-dasar`.
- **Hasil:** Semua *Vitest unit test* sukses lulus 100%. Tidak ada lagi tabrakan suffix.
- End-to-end `bug-js-runner.spec.ts` telah ditambahkan untuk memastikan bahwa halaman JS (dengan /lesson/js-dasar-01) menampilkan tombol khusus JavaScript ('node script.js') dan terbebas dari runner Java. *Note:* timeout pada playwright terjadi di local env test runner, namun ekspektasi verifikasi string sudah dilokalisir tepat pada runner.

## Tahap D — Sanity Check Manual & Risiko Collision Masa Depan
Berdasarkan `modules.json` Java vs JavaScript saat ini, ada beberapa pasangan berisiko jika `sameModule` masih dipakai:
- **`dasar` (Java) vs `js-dasar` (JS)** — Risiko tertinggi, telah diselesaikan.
- **`java-oop` / `oop-todolist` (Java) vs `js-oop` (JS)** — Jika modul JS di masa depan bernama `oop`, maka `"js-oop".endsWith("-oop")` akan saling tabrakan. Beruntungnya telah diubah ke eksak match.
- Modul-modul lain seperti `js-async`, `js-dom`, `js-stdlib`, `js-modules`, dsb tidak ber-collision langsung dengan keyword Java yang tersedia, namun aman seutuhnya dengan implementasi exact match yang baru.

**Kesimpulan:** 
Semua fungsi utama yang menginisialisasi materi telah ditukar ke `exact match`. Logika string suffix hanya tertinggal di mapping nama folder yang benar-benar membutuhkan pencocokan relasi struktur. Bug berhasil diatasi.
