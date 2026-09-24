# Laporan Percobaan Upgrade Java 17 (ECJ + CheerpJ 4.3)

## Tujuan
Melakukan *upgrade* sistem eksekutor Java dari versi 8 menjadi versi 17 menggunakan compiler **ECJ (Eclipse Compiler for Java)** di dalam *environment* **CheerpJ 4.3**, murni berjalan di sisi klien (browser).

## Langkah-langkah yang Dieksekusi
1. Mengubah script loader CheerpJ menjadi versi 4.3: `https://cjrtnc.leaningtech.com/4.3/loader.js`.
2. Melakukan inisialisasi runtime Java 17 dengan perintah: `await cheerpjInit({ version: 17 })`.
3. Memastikan file compiler `ecj.jar` (dari `public/ecj.jar`) dipanggil menggunakan path dinamis berbasis `import.meta.env.BASE_URL`.
4. Mengubah proses kompilasi pada `src/lib/javaRunner.ts` dengan menggunakan *main class* ECJ: `org.eclipse.jdt.internal.compiler.batch.Main`.
5. Memberikan argumen kompilasi spesifik: `"-17", "-nowarn", "-proceedOnError", "-d", "/files/", "/str/Main.java"`.

## Hasil Pengujian (Gagal)
Pada saat pengujian eksekusi program `Hello World`, proses kompilasi gagal atau terhenti (*hang*). Setelah dilakukan pemeriksaan mendalam terhadap log internal ECJ dan *virtual file system* CheerpJ, ditemukan pesan error berikut dari ECJ:

```text
invalid location for system libraries: /lt/17
```

**Analisis Masalah:**
- Java 17 menggunakan arsitektur modular (`jrt-fs.jar` atau *Jimage module system*). 
- CheerpJ menempatkan runtime system Java 17 pada *virtual filesystem* di direktori `/lt/17`. 
- Namun, ECJ mencoba membaca struktur direktori *system libraries* Java standar dan gagal mengenali struktur yang ada di dalam `/lt/17` sebagai *system library* yang valid.
- Karena sistem perpustakaan utama (*core classes* seperti `java.lang.Object` atau `java.lang.System`) tidak ditemukan, ECJ membatalkan proses kompilasi (berhenti memproduksi `Main.class`).

## Tindakan Resolusi
Sesuai instruksi batas percobaan dan penanganan kegagalan (*fallback*), perubahan pada `javaRunner.ts` **telah dibatalkan sepenuhnya** menggunakan perintah:
```bash
git checkout src/lib/javaRunner.ts
```
Saat ini, proyek sudah dikembalikan ke eksekutor Java 8 asli (menggunakan `tools.jar` dan `com.sun.tools.javac.Main`) yang berjalan dengan normal. 

*Tidak ada file sumber (source file) utama proyek yang terpengaruh atau di-commit akibat kegagalan integrasi ini.*
