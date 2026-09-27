# Perbaikan login, logout, dan sinkronisasi progres — prompt untuk AI agent

Kerjakan 6 tugas berurutan. Tugas 1 dan 2 paling penting karena menyangkut **hilangnya progres pengguna**.
Jangan mengubah file di `content/`.

Setelah selesai jalankan `npm run build` dan `npm run test:unit`, lalu tambah satu baris di `LAPORAN.md`.

Dilarang: menjalankan e2e/Playwright, menyentuh `src/lib/javaRunner.ts`, memakai `.skip`,
dan mengubah angka di test supaya lulus.

---

## Tugas 1 — Jangan pernah menimpa progres di cloud kalau gagal membacanya

### Masalahnya

`fetchCloudProgress` di `src/lib/cloudProgress.ts` mengembalikan `null` untuk **dua keadaan yang berbeda**:
"pengguna ini belum pernah punya progres" dan "gagal membaca" (timeout 8 detik, error jaringan,
atau error dari Supabase). `initSync` di `src/context/ProgressContext.tsx` memperlakukan keduanya sama.

Skenario nyata: pengguna yang sudah menyelesaikan 40 pelajaran login pertama kali di HP baru
dengan sinyal lemah.

1. Membaca progres dari cloud butuh lebih dari 8 detik → timeout → `null`.
2. Progres lokal di HP baru kosong → dipakai progres default (0 pelajaran).
3. `saveCloudProgress(user.id, progresKosong)` dijalankan. Sinyal sudah pulih, penyimpanan berhasil.
4. **Progres 40 pelajaran di cloud tertimpa progres kosong.**

Bahkan kalau langkah 3 gagal, `initializedRef.current = true` tetap dipasang di akhir `initSync`,
sehingga penyimpanan otomatis (debounce 1 detik) berikutnya juga menimpa cloud dengan data lokal saja.

Masalah kedua yang memperparah: client Supabase **tidak melempar exception** untuk error dari server
(misalnya token kedaluwarsa atau ditolak RLS). Ia mengembalikan `{ data, error }`. Kode sekarang tidak
memeriksa `error`, jadi kegagalan seperti ini dianggap berhasil.

### Perbaikannya

**a. `fetchCloudProgress` membedakan tiga hasil.** Ubah tipe kembaliannya:

```ts
export type HasilAmbil =
  | { ok: true; data: UserProgress | null }   // berhasil; null = memang belum ada
  | { ok: false };                            // gagal membaca, jangan dianggap kosong

export async function fetchCloudProgress(userId: string): Promise<HasilAmbil> {
  if (!supabase) return { ok: false };
  try {
    const result = (await Promise.race([
      supabase.from('progres').select('data').eq('user_id', userId).maybeSingle(),
      timeoutPromise(8000),
    ])) as any;
    if (result?.error) {
      console.error('Fetch cloud progress error', result.error);
      return { ok: false };
    }
    return { ok: true, data: (result?.data?.data as UserProgress) ?? null };
  } catch (e) {
    console.error('Fetch cloud progress error', e);
    return { ok: false };
  }
}
```

**b. `saveCloudProgress` melempar error kalau Supabase mengembalikan `error`:**

```ts
const result = (await Promise.race([savePromise, timeoutPromise(8000)])) as any;
if (result?.error) throw result.error;
```

**c. `initSync` di `ProgressContext.tsx`:**

- Kalau `fetch.ok === false`: pakai progres lokal, status `Offline, tersimpan di perangkat ini`,
  **jangan** memanggil `saveCloudProgress`, dan **jangan** memasang `initializedRef.current = true`.
- Kalau `fetch.ok === true`: gabungkan seperti sekarang (`data` null berarti belum ada, pakai lokal),
  simpan ke cloud, lalu baru pasang `initializedRef.current = true`.

**d. Coba lagi otomatis.** Selama `initializedRef.current` masih `false` dan pengguna login, ulangi
`initSync` saat event `online` di `window`, saat tab kembali aktif (`focus`), dan setiap 30 detik.
Hentikan begitu berhasil. Bersihkan semua listener dan interval saat komponen dilepas atau pengguna logout.

**e. Sesuaikan pemanggil lain** `fetchCloudProgress` (handler `focus` di `ProgressContext.tsx`)
dengan tipe baru: gabungkan hanya kalau `ok === true && data`.

### Test yang wajib ditambahkan

Di `src/test/cloudProgress.test.ts` (unit test dengan Supabase di-mock, bukan e2e):

1. `fetchCloudProgress` mengembalikan `{ ok: false }` saat Supabase mengembalikan `{ error }`.
2. `fetchCloudProgress` mengembalikan `{ ok: false }` saat timeout.
3. `fetchCloudProgress` mengembalikan `{ ok: true, data: null }` saat baris memang belum ada.
4. `saveCloudProgress` melempar error saat Supabase mengembalikan `{ error }`.

Di `src/context/ProgressContext.test.tsx`:

5. Saat fetch gagal, `saveCloudProgress` **tidak pernah dipanggil**, termasuk setelah progres berubah.

---

## Tugas 2 — Logout tidak boleh menghapus progres yang belum tersimpan

### Masalahnya

`keluar()` di `src/context/AuthContext.tsx` memanggil `bersihkanProgresLokal(user.id)` **sebelum**
memastikan progres sudah sampai di cloud. Kalau pengguna belajar sambil offline, satu-satunya salinan
progres ada di `localStorage`. Begitu klik Keluar, salinan itu dihapus. Progresnya hilang permanen.

### Perbaikannya

**a.** Tambahkan ke `ProgressContext` fungsi:

```ts
flushKeCloud: () => Promise<boolean>   // true kalau progres terbaru berhasil tersimpan
```

Isinya: kalau `initializedRef.current` false (fetch awal belum berhasil) → kembalikan `false` tanpa
menyimpan. Kalau true → batalkan timer debounce, panggil `saveCloudProgress` dengan progres terbaru,
kembalikan `true` kalau berhasil, `false` kalau gagal.

**b.** Pindahkan urusan hapus data lokal **keluar** dari `AuthContext.keluar()`. `keluar()` cukup
memanggil `supabase.auth.signOut()`.

**c.** Di `src/pages/Profile.tsx`, tombol Keluar memanggil handler baru:

```ts
const handleKeluar = async () => {
  setSedangKeluar(true);
  const tersimpan = await flushKeCloud();
  if (!tersimpan) {
    setTampilDialogBelumTersimpan(true);   // lihat di bawah
    setSedangKeluar(false);
    return;
  }
  bersihkanProgresLokal(user?.id);
  await keluar();
  navigate('/', { replace: true });
};
```

Dialog "belum tersimpan" (pakai gaya kartu brutal yang sudah ada, **bukan** `window.confirm`):

> **Progres terbaru belum tersimpan ke akun**
> Sepertinya koneksi internet sedang bermasalah. Progres tetap aman di perangkat ini dan akan
> dikirim otomatis saat kamu masuk lagi di perangkat yang sama.
>
> [ Coba simpan lagi ]  [ Keluar saja ]

- **Coba simpan lagi** → jalankan `handleKeluar` lagi.
- **Keluar saja** → `await keluar()` **tanpa** `bersihkanProgresLokal`, lalu `navigate('/', { replace: true })`.
  Data lokal per akun (`bisangoding_progress:<userId>`) tetap ada, dan akan digabung saat login berikutnya.

Selama proses, tombol Keluar menampilkan "Menyimpan..." dan tidak bisa diklik dua kali.

**d.** Setelah logout, progres di memori dikosongkan. Di `ProgressProvider`, saat `user` berubah
dari ada menjadi `null` (dan `authLoading` false): `setProgress(makeDefaultProgress())`,
`initializedRef.current = false`, batalkan timer debounce, dan `setCurrentUserId(null)`.
Tanpa ini, data akun sebelumnya masih ada di memori dan bisa tertulis ke kunci tamu
`bisangoding_progress` — masalah di komputer bersama seperti lab sekolah atau warnet.

---

## Tugas 3 — Semua halaman selain beranda wajib login

### Masalahnya

Di `src/App.tsx`, hanya rute `/` yang memeriksa login. Rute `/profile`, `/kelas/:courseId`,
`/module/:moduleId`, `/lesson/:lessonId`, dan `/quiz/:moduleId` tetap terbuka untuk yang belum login.

Akibat yang terlihat pengguna:

- Setelah klik Keluar di halaman Profil, pengguna **tetap di halaman Profil** (sekarang tombol Keluar
  memang ada di sana), bukan kembali ke landing page.
- Tombol Back setelah logout membuka lagi halaman pelajaran.
- Link pelajaran yang dibagikan bisa dibuka tanpa login, dan progresnya tertulis ke kunci tamu.

### Perbaikannya

Buat `src/components/RequireAuth.tsx`:

```tsx
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const bypass = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS === 'true';

  if (loading) return <LayarMemuat />;           // pakai loader yang sama dengan App.tsx
  if (!user && !bypass) {
    const tujuan = location.pathname + location.search;
    if (tujuan !== '/') {
      try { sessionStorage.setItem('bn_tujuan', tujuan); } catch {}
    }
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
```

Bungkus rute berikut di `App.tsx`:

- rute `Layout` untuk `/profile`, `/kelas/:courseId`, `/module/:moduleId`
- `/lesson/:lessonId`
- `/quiz/:moduleId`

Rute `*` (NotFound): kalau belum login arahkan ke `/`, kalau sudah login tampilkan NotFound seperti sekarang.

Pindahkan komponen loader yang sekarang ada di `App.tsx` ke komponen sendiri (`LayarMemuat`)
supaya dipakai di dua tempat tanpa menyalin kode.

---

## Tugas 4 — Setelah login, kembali ke halaman yang tadi dituju

Contoh: teman membagikan link Pelajaran 5. Kamu membukanya tanpa login, diarahkan ke landing page,
lalu login dengan Google. Sekarang kamu mendarat di Dashboard dan harus mencari Pelajaran 5 sendiri.

Di `AppRoutes` (`src/App.tsx`), tambahkan `useEffect` yang berjalan saat `user` berubah menjadi ada:

```ts
useEffect(() => {
  if (!user) return;
  let tujuan: string | null = null;
  try {
    tujuan = sessionStorage.getItem('bn_tujuan');
    sessionStorage.removeItem('bn_tujuan');
  } catch {}
  if (tujuan && tujuan.startsWith('/') && !tujuan.startsWith('//')) {
    navigate(tujuan, { replace: true });
  }
}, [user]);
```

Pemeriksaan `startsWith('/')` dan `!startsWith('//')` mencegah nilai aneh membawa pengguna ke situs lain.
`sessionStorage` (bukan `localStorage`) dipakai supaya tujuan tidak tersisa sampai besok.

---

## Tugas 5 — Tutup jalan pintas `e2e_bypass` di produksi

`src/App.tsx` baris 23:

```ts
localStorage.getItem('e2e_bypass') === 'true';
```

Baris ini **tidak** dibatasi mode DEV. Siapa pun bisa membuka DevTools, menjalankan
`localStorage.setItem('e2e_bypass', 'true')`, lalu masuk ke seluruh aplikasi tanpa akun.
Aplikasinya jadi dalam keadaan setengah login: dianggap masuk, tapi `user` kosong.

Hapus bagian `localStorage.getItem('e2e_bypass')`. Test e2e memang sudah tidak dipakai (lihat AGENTS.md).
Bypass cukup lewat `import.meta.env.DEV && VITE_DEV_BYPASS === 'true'`, yang tidak ikut ke build produksi.

Periksa juga tidak ada lagi pemakaian `e2e_bypass` di file lain:

```bash
grep -rn "e2e_bypass" src/
```

---

## Tugas 6 — Tombol masuk tidak bisa diklik dua kali

`masukGoogle` tidak punya status loading. Klik dua kali cepat memulai dua proses OAuth.
Di Landing, Layout, dan Profile: setelah diklik, tombol menampilkan "Membuka Google..." dan dinonaktifkan.
Kalau `signInWithOAuth` mengembalikan `error`, tampilkan pesan singkat dan aktifkan lagi tombolnya.

---

## Cek manual sebelum lapor selesai

Jalankan `npm run dev`. Gunakan DevTools → Network → **Offline** untuk mensimulasikan tanpa internet.
Tulis hasil tiap nomor di laporan.

**Login dan logout**

1. Belum login, buka `#/profile` langsung di address bar → diarahkan ke landing page.
2. Belum login, buka `#/lesson/java-dasar-05` → landing page. Login → langsung mendarat di pelajaran 5.
3. Sudah login, klik Keluar di Profil → pindah ke landing page.
4. Setelah logout, tekan tombol Back browser → tetap di landing page, tidak kembali ke halaman dalam.
5. Buka dua tab. Logout di tab pertama → tab kedua ikut kembali ke landing page setelah diklik atau di-refresh.
6. Di konsol: `localStorage.setItem('e2e_bypass','true')` lalu refresh → **tetap** di landing page.

**Progres aman**

7. Login, selesaikan satu pelajaran, tunggu status "Tersimpan". Nyalakan mode Offline.
   Selesaikan satu pelajaran lagi. Klik Keluar → dialog "belum tersimpan" muncul.
8. Pilih "Keluar saja". Matikan Offline. Login lagi → pelajaran yang diselesaikan saat offline **masih tercatat**.
9. Mode Offline sejak awal, buka aplikasi dalam keadaan sudah login → status offline,
   dan di tab Network **tidak ada** request `upsert` ke tabel `progres`. Matikan Offline →
   dalam 30 detik status berubah jadi "Tersimpan" dan progres tidak berkurang.

## Baris untuk LAPORAN.md

```
| 29 | 2026-09-XX HH:mm | Guard login, kembali ke tujuan, logout aman, fetch gagal tidak menimpa cloud, hapus e2e_bypass | LULUS x/y | ... | ... | 9/9 cek manual lulus |
```
