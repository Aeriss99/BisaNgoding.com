# TODO — Login Google + Simpan Progres di Supabase

## Tujuan
Login dengan akun Google. Progres belajar tersimpan di Supabase, jadi dibuka dari laptop atau HP hasilnya sama. Tanpa login, aplikasi tetap bisa dipakai seperti sekarang (progres disimpan lokal).

> Rencana "kode sinkronisasi" sebelumnya DIBATALKAN. Jangan dikerjakan.

## Aturan Agent (WAJIB DIBACA)
1. Kerjakan berurutan dari Bagian 3 sampai 8, langsung sampai selesai. Bagian 1–2 dikerjakan user.
2. Maksimal 3 percobaan per masalah. Gagal? Catat di LAPORAN.md, lanjut.
3. **JANGAN** ubah isi `content/`, `javaRunner.ts`, atau logika pelajaran/quiz.
4. **JANGAN** menulis URL/key Supabase di kode. Semua lewat env.
5. Aplikasi **wajib tetap jalan** tanpa login dan tanpa env Supabase.
6. **JANGAN** mengubah HashRouter menjadi BrowserRouter.
7. Tes unit untuk logika penggabungan progres wajib ada.
8. Balas singkat, tanpa menampilkan kode.

---

## Bagian 1 — Setup Google (dikerjakan user)
- [ ] Buka Google Cloud Console → buat project → APIs & Services → OAuth consent screen (External), isi nama aplikasi dan email
- [ ] Credentials → Create OAuth Client ID → tipe **Web application**
- [ ] Authorized redirect URI: isi dengan callback URL dari Supabase (lihat Bagian 2, formatnya `https://<project>.supabase.co/auth/v1/callback`)
- [ ] Salin **Client ID** dan **Client Secret**

## Bagian 2 — Setup Supabase (dikerjakan user)
- [ ] Buat project di supabase.com (gratis)
- [ ] Authentication → Providers → **Google** → aktifkan, tempel Client ID dan Client Secret
- [ ] Authentication → URL Configuration:
      - Site URL: `https://aeriss99.github.io/BisaNgoding.com/`
      - Redirect URLs, tambahkan dua:
        `https://aeriss99.github.io/BisaNgoding.com/`
        `http://localhost:5173/`
- [ ] SQL Editor → jalankan SQL berikut:

```sql
create table if not exists progres (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  diperbarui timestamptz not null default now()
);

alter table progres enable row level security;

create policy "baca progres sendiri" on progres
  for select using (auth.uid() = user_id);

create policy "tambah progres sendiri" on progres
  for insert with check (auth.uid() = user_id);

create policy "ubah progres sendiri" on progres
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

- [ ] Settings → API → salin **Project URL** dan **anon public key** ke `.env.local`:
      `VITE_SUPABASE_URL=...`
      `VITE_SUPABASE_ANON_KEY=...`
- [ ] Tambahkan dua nilai itu sebagai **GitHub Secrets** di repo (Settings → Secrets → Actions)

## Bagian 3 — Client Supabase
- [ ] Install `@supabase/supabase-js`
- [ ] Buat `src/lib/supabase.ts`: buat client dari env. Jika env kosong, ekspor `null`
- [ ] Wajib pakai `auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true }`
      (PKCE mengembalikan `?code=` di query, bukan `#access_token` di hash, sehingga tidak bentrok dengan HashRouter)
- [ ] Pastikan `.env.local` ada di `.gitignore`
- [ ] Workflow deploy membaca `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari GitHub Secrets saat build

## Bagian 4 — Auth
- [ ] Buat `src/context/AuthContext.tsx`: menyimpan `user` dan `loading`, mendengarkan `onAuthStateChange`
- [ ] Fungsi `masukGoogle()`: `signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + import.meta.env.BASE_URL } })`
- [ ] Fungsi `keluar()`: `signOut()`
- [ ] Setelah kembali dari Google, bersihkan `?code=` dari URL tanpa me-reload halaman
- [ ] Jika Supabase `null`, semua fungsi auth tidak melakukan apa-apa dan tombol login disembunyikan

## Bagian 5 — Simpan & Ambil Progres
- [ ] Buat `src/lib/cloudProgress.ts`: `ambilProgres(userId)` dan `simpanProgres(userId, data)` (upsert ke tabel `progres`)
- [ ] Saat progres berubah: simpan ke localStorage **dulu**, lalu kirim ke Supabase jika login (debounce 3 detik)
- [ ] Saat login atau aplikasi dibuka dalam keadaan login: ambil data cloud, **gabungkan** dengan data lokal, simpan hasilnya ke keduanya
- [ ] Aturan penggabungan (bukan saling menimpa):
      - `completedLessons`: gabungkan, buang duplikat
      - `xp`, `streak`: ambil nilai terbesar
      - `quizScores`: ambil skor tertinggi per modul, `passed` true jika salah satu true
      - `unlockedAchievements` dan penghitung achievement: gabungkan / ambil terbesar
      - `lastActiveDate`, `maxSeenDate`: ambil tanggal terbaru
- [ ] Semua panggilan jaringan pakai try/catch dan timeout 8 detik. Gagal = tetap jalan dengan data lokal
- [ ] Saat keluar: berhenti sinkron, progres lokal tetap ada
- [ ] Simpan pemilik data lokal (`ownerId`: null untuk tamu, atau id user). Saat login: gabungkan data lokal HANYA jika ownerId null (tamu) atau sama dengan user yang login. Jika milik user lain, abaikan data lokal dan pakai data cloud.
- [ ] Saat keluar: kosongkan progres lokal, lalu mulai sebagai tamu yang baru. Data tetap aman di cloud.

## Bagian 6 — Reset Otomatis Tidak Aktif
- [ ] Jika fitur reset 7 hari aktif, reset juga harus menulis ulang data di cloud, agar tidak "hidup lagi" dari server
- [ ] Penggabungan tidak boleh mengembalikan progres yang sudah direset (pakai tanggal reset sebagai penanda)

## Bagian 7 — Tampilan
- [ ] Sidebar desktop & halaman Profil: tombol **Masuk dengan Google** (gaya neo-brutalism yang sama)
- [ ] Jika login: tampilkan foto profil, nama, email, tombol **Keluar**
- [ ] Status sinkron kecil: "Tersimpan", "Menyimpan...", atau "Offline, tersimpan di perangkat ini"
- [ ] Banner lembut di Dashboard untuk yang belum login: "Masuk agar progresmu tersimpan di semua perangkat" (bisa ditutup, tidak muncul lagi setelah ditutup)
- [ ] Export/Import lama tetap ada sebagai cadangan

## Bagian 8 — Tes & Pemeriksaan
- [ ] Unit test penggabungan progres untuk semua aturan di Bagian 5
- [ ] Unit test: env kosong → aplikasi jalan normal tanpa tombol login
- [ ] Unit test: gagal jaringan → data lokal tetap dipakai
- [ ] `npm run build` sukses
- [ ] Tambah 1 baris LAPORAN.md

## Uji Manual (dikerjakan user)
- [ ] Login di desktop, selesaikan 1 pelajaran
- [ ] Login di HP dengan akun Google yang sama → pelajaran tadi tercentang
- [ ] Selesaikan pelajaran lain di HP → refresh desktop, ikut tercentang
- [ ] Coba di GitHub Pages, bukan hanya localhost

---

## Nanti (JANGAN sekarang)
- Fitur Pro dan pembayaran
- Iklan
- Upgrade CheerpJ ke Java 17 (dikerjakan terpisah)