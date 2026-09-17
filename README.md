# BisaNgoding.com

Website belajar Java interaktif gratis, langsung di browser (Client-Side JVM via CheerpJ).

## Fitur Utama
- **Tanpa Server:** Semua materi, kuis, dan eksekusi kode berjalan 100% di browser tanpa backend (Static Site).
- **Progres Tersimpan:** Progres belajar (XP, streak, dll) disimpan di localStorage dan bisa di-export/import.
- **Eksekusi Kode Live:** Menjalankan kode Java dan memvalidasi output `stdout` langsung di browser menggunakan CheerpJ.

## Cara Menjalankan Lokal

1. **Clone repository:**
   ```bash
   git clone <repo-url>
   cd BisaNgoding.com
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Jalankan development server:**
   ```bash
   npm run dev
   ```
   Lalu buka `http://localhost:5173`.

## Cara Build
```bash
npm run build
```
Folder `dist/` akan dihasilkan dan siap di-deploy ke static hosting (GitHub Pages, Cloudflare Pages, Vercel, dll).

## Menambah Pelajaran
Materi pelajaran berada di folder `content/`. File `.json` setiap pelajaran menggunakan skema yang ada di `src/types/schema.ts`.
Pastikan setiap modul didaftarkan ke `content/modules.json`.
