# TODO — Gerbang Pemahaman (Paham Dulu, Baru Challenge)

## Tujuan
Paksa user benar-benar paham dan berpikir sendiri, bukan mengandalkan petunjuk atau AI.

User tidak boleh langsung disuruh mengerjakan code challenge sebelum benar-benar paham materinya. Kalau belum paham, jelaskan ulang dengan cara lain, bukan cuma "salah, coba lagi". Berlaku untuk SEMUA modul.

## Aturan Agent (WAJIB DIBACA)
1. Ikuti AGENTS.md. Kerjakan Bagian 1–8 langsung sampai selesai.
2. Maksimal 3 percobaan per masalah.
3. **JANGAN** ubah isi `content/` kecuali menambahkan contoh di Bagian 6. Soal pemahaman untuk semua pelajaran disediakan user.
4. **JANGAN** ubah `javaRunner.ts`.
5. Pelajaran yang BELUM punya kartu `understanding_check` harus tetap berjalan seperti sekarang (kompatibel mundur).
6. Cukup `npm run build` dan `npm run test:unit`. Balas singkat.

---

## Bagian 1 — Tipe Kartu Baru: `understanding_check`
Tambahkan ke `src/types/schema.ts`:

```ts
export interface UnderstandingCheckCard {
  type: 'understanding_check';
  minCorrect: number;              // jumlah benar berturut-turut untuk lulus, biasanya 2
  questions: {
    question: string;
    code?: string;                 // opsional, ditampilkan sebagai blok kode
    options: string[];
    answer: number;
    explanation: string;           // ditampilkan saat benar
    remedial: string;              // markdown, penjelasan ulang dengan cara lain saat salah
  }[];                             // biasanya 4 soal
}
```

Tambahkan juga field opsional di `CodeChallengeCard`:
```ts
steps?: string[];      // rencana langkah pengerjaan, ditampilkan sebelum menulis kode
skeleton?: string;     // kerangka kode berisi ___ untuk bantuan bertahap
```

## Bagian 2 — Perilaku Kartu Cek Pemahaman
- [ ] Judul kartu: "Cek Pemahaman" dengan penjelasan singkat: "Jawab dulu pertanyaan ini sebelum lanjut ke tantangan."
- [ ] Tampilkan satu soal per waktu, urutan soal diacak
- [ ] Jawaban **benar**: tampilkan `explanation`, hitung benar berturut-turut
- [ ] Jawaban **salah**: reset hitungan, tampilkan kotak **"Coba kita lihat dari sisi lain"** berisi `remedial` (render markdown)
- [ ] Setelah salah, ada dua tombol: **Baca Lagi Teorinya** (loncat ke kartu teori pertama pelajaran ini) dan **Coba Soal Lain** (soal berikutnya dari daftar, bukan soal yang sama)
- [ ] Lulus jika benar berturut-turut sebanyak `minCorrect`
- [ ] Kalau semua soal sudah terpakai, putar ulang dari awal dengan urutan acak baru
- [ ] Tampilkan indikator kecil: "2 dari 2 benar" / progres titik

## Bagian 3 — Gerbang ke Code Challenge
- [ ] Kartu `code_challenge` **terkunci** jika di pelajaran itu ada `understanding_check` yang belum lulus
- [ ] Tampilan terkunci: ikon gembok + "Selesaikan Cek Pemahaman dulu, supaya kamu siap menulis kodenya sendiri."
- [ ] Tombol Lanjut di footer tidak bisa melewati cek pemahaman yang belum lulus
- [ ] Status lulus cek disimpan di progres per pelajaran, agar tidak mengulang saat pelajaran dibuka lagi
- [ ] Pelajaran yang sudah pernah selesai sebelumnya dianggap sudah lulus cek

## Bagian 4 — Code Challenge: Paksa Berpikir, Bukan Mengandalkan Petunjuk

### 4a. Sebelum menulis kode
- [ ] Jika ada `steps`: tampilkan di atas editor sebagai "Rencana Pengerjaan" (daftar bernomor, bisa dilipat)
- [ ] Tombol **Saya Belum Paham** selalu ada → kembali ke kartu teori pertama

### 4b. Wajib mengetik sendiri
- [ ] Editor challenge **menolak tempel (paste)**. Tangkap event paste dan drop, batalkan, lalu tampilkan toast: "Ketik sendiri ya. Jari yang mengetik, otak yang ingat."
- [ ] Menyalin DARI editor tetap boleh
- [ ] Kartu `runnable` (contoh kode) TIDAK dibatasi, hanya `code_challenge`

### 4c. Saat gagal: arahkan berpikir dulu, petunjuk belakangan
Hitung hanya percobaan yang **sungguh-sungguh**: kode harus berbeda dari percobaan sebelumnya dan berbeda dari starterCode. Kalau sama persis, jangan dihitung, tampilkan: "Kodenya belum berubah dari percobaan tadi. Coba ubah sesuatu dulu."

- [ ] **Gagal 1x:** tampilkan pesan error/perbedaan output, lalu kotak **"Berhenti sebentar"**:
      - "Baca lagi pesan errornya pelan-pelan. Baris berapa yang disebut?"
      - Tombol **Baca Lagi Materinya** (loncat ke kartu teori)
      - TIDAK ada petunjuk
- [ ] **Gagal 2x:** kotak **"Jelaskan dengan kata-katamu"**: textarea wajib diisi minimal 20 karakter berisi apa yang user pikir salah. Tidak dinilai, tapi tombol Cek Jawaban terkunci sampai diisi. Tujuannya memaksa user merumuskan masalahnya sendiri.
- [ ] **Gagal 3x:** baru muncul tombol **Lihat Petunjuk 1** (`hints[0]`)
- [ ] **Gagal 4x:** tombol **Lihat Petunjuk 2** (`hints[1]`)
- [ ] **Gagal 5x:** tombol **Lihat Kerangka Kode** (`skeleton`, hanya dibaca, tidak mengisi editor)
- [ ] **Gagal 7x:** sebelum solusi boleh dilihat, user WAJIB lulus ulang `understanding_check` pelajaran itu (soal diacak ulang). Kalau gagal cek, arahkan ke teori.
- [ ] Setelah lulus cek ulang: tombol **Lihat Solusi**. Solusi tampil sebagai teks yang tidak bisa disalin (user-select: none), tidak mengisi editor, dengan keterangan: "Pelajari alurnya, tutup, lalu ketik ulang dari ingatanmu."
- [ ] Challenge yang selesai setelah melihat solusi ditandai "Selesai dengan bantuan" dan tidak mendapat bonus XP

### 4d. Pesan semangat saat gagal
Setiap kali gagal, tampilkan satu pesan acak (tidak mengulang pesan yang sama dua kali berturut-turut):
- "Gagal itu bagian dari belajar. Yang bikin masa depan suram bukan gagal, tapi berhenti."
- "Programmer senior pun lebih sering melihat error daripada kode yang langsung jalan."
- "Kamu sudah sampai sini. Sayang kalau berhenti sekarang."
- "Setiap error yang kamu pecahkan sendiri, nempel lebih lama daripada seratus jawaban dari AI."
- "Pelan-pelan tidak apa-apa. Yang penting paham, bukan cepat."
- "Jangan berhenti di tengah jalan. Yang setengah-setengah hasilnya madesu, yang tuntas hasilnya jadi."
Gaya: kotak kuning neo-brutalism kecil di atas pesan error, nada menyemangati, TIDAK merendahkan.

### 4e. Pesan error yang ramah
- [ ] Tampilkan maksimal 5 error compiler pertama, plus: "Perbaiki error pertama dulu, biasanya sisanya ikut hilang."
- [ ] Nomor baris diberi warna aksen

## Bagian 7 — Playground yang Menjelaskan & Mini Playground di Teori

### 7a. Kartu `runnable` dilengkapi penjelasan
Tambahkan field opsional di `RunnableCard`:
```ts
predict?: {                       // tebak dulu sebelum menjalankan
  question: string;               // contoh: "Sebelum menekan Jalankan, menurutmu apa outputnya?"
  options: string[];
  answer: number;
};
annotations?: { line: number; note: string }[];  // penjelasan per baris
explanation?: string;             // markdown, penjelasan setelah kode dijalankan
tryThis?: { task: string; hint?: string }[];     // tantangan kecil "coba ubah ini"
```

Perilaku:
- [ ] Jika ada `predict`: tombol Jalankan terkunci sampai user memilih tebakan. Setelah dijalankan, tampilkan "Tebakanmu benar!" atau "Ternyata berbeda, coba perhatikan baris X" berdampingan dengan output asli. Tebakan salah TIDAK menghalangi lanjut, tujuannya melatih berpikir.
- [ ] `annotations`: tampilkan nomor kecil berwarna di samping baris kode terkait (gutter). Klik nomor → penjelasan muncul. Di HP, tampilkan sebagai daftar di bawah editor.
- [ ] `explanation`: muncul setelah kode dijalankan pertama kali, judul "Apa yang barusan terjadi?"
- [ ] `tryThis`: daftar tantangan kecil di bawahnya, judul "Coba Ubah Sendiri". Tidak dinilai, user bebas bereksperimen di editor yang sama. Tombol **Kembalikan Kode Awal** tersedia.
- [ ] Kartu runnable tanpa field baru tetap berjalan seperti sekarang

### 7b. Mini playground di dalam kartu teori
- [ ] Di markdown kartu teori, blok kode dengan penanda ```java run dirender sebagai **mini editor** yang bisa dijalankan, memakai runner yang sama
- [ ] Blok ```java biasa (tanpa `run`) tetap tampil sebagai kode statis
- [ ] Mini editor: tinggi menyesuaikan isi, word wrap, tombol Jalankan kecil, output tampil tepat di bawahnya
- [ ] Mini editor boleh di-paste dan diubah bebas (bukan challenge)
- [ ] Beberapa mini editor dalam satu kartu harus saling terpisah (output tidak tercampur)
- [ ] JVM dipanaskan saat pelajaran dibuka, jadi mini editor pertama tidak menunggu lama

### 7c. Contoh
Tambahkan contoh di `content/module-01-dasar/lesson-11.json`:
- Satu blok ```java run di kartu teori kedua
- Field `predict`, `annotations`, `explanation`, dan `tryThis` di kartu runnable
Isi contohnya bebas mengikuti materi pelajaran 11. Isi untuk semua pelajaran lain akan disediakan user.

### 7d. Tes
- [ ] Unit test: Jalankan terkunci sebelum tebakan dipilih; tebakan salah tetap bisa lanjut
- [ ] Unit test: ```java run dirender sebagai editor, ```java biasa tetap statis
- [ ] Unit test: dua mini editor dalam satu kartu tidak berbagi output

## Bagian 8 — Panel Output Bergaya Terminal IntelliJ IDEA

Berlaku untuk SEMUA panel output: kartu runnable, mini playground di teori, dan code challenge.

### 8a. Warna (pakai CSS variable)
| Bagian | Warna |
|---|---|
| Latar panel | `#1E1F22` |
| Bar judul panel | `#2B2D30` |
| Output normal (stdout) | `#DFE1E5` (abu terang, BUKAN hijau) |
| Error (stderr, exception, compile error) | `#F75464` |
| Peringatan | `#E0B25B` |
| Tautan baris kode (`Main.java:5`) | `#548AF7`, bergaris bawah |
| Teks meta (perintah, exit code) | `#6F737A` |
| Input yang dibaca Scanner | `#56A8F5` miring |

### 8b. Font
- **JetBrains Mono** dari Google Fonts (display=swap), fallback `ui-monospace, Consolas, monospace`
- Ukuran 14px, line-height 1.6

### 8c. Struktur panel
- [ ] **Bar judul**: ikon ▶ + `Run: Main`, dan tombol kecil **Bersihkan** di kanan
- [ ] **Baris pertama** (warna meta): `java Main`
- [ ] **Isi output** sesuai warna di atas
- [ ] **Baris terakhir** (warna meta): `Process finished with exit code 0` atau `exit code 1`. Di depannya titik kecil: abu jika 0, merah jika 1. Tidak ada teks hijau.
- [ ] Jika program membaca input (challenge dengan test input), tampilkan input yang dipakai dengan warna input

### 8d. Tampilan error seperti IntelliJ
- [ ] **Error kompilasi**, tiap error ditampilkan:
      ```
      Main.java:5:23
      java: ';' expected
          System.out.println("Halo")
                                    ^
      ```
      Baris pertama berupa tautan biru. Baris kode ditampilkan, lalu tanda `^` di bawah posisi kolom.
- [ ] **Runtime exception**:
      ```
      Exception in thread "main" java.lang.ArithmeticException: / by zero
          at Main.main(Main.java:4)
      ```
      `Main.java:4` berupa tautan biru.
- [ ] **Sembunyikan baris internal** dari stack trace: semua baris milik `Runner`, `jdk.internal`, `java.lang.reflect`, `sun.reflect`. User hanya melihat baris dari kodenya sendiri.
- [ ] Hapus prefix path seperti `/str/` atau `/files/`, cukup tampilkan `Main.java`
- [ ] Klik tautan baris → editor melompat dan menyorot baris itu selama 2 detik
- [ ] Tampilkan maksimal 5 error pertama, sisanya diringkas "dan N error lainnya"

### 8e. Kotak "Artinya" (terjemahan error untuk pemula)
Di bawah error, tampilkan kotak kecil berlatar `#2B2D30` berjudul **Artinya:** berisi penjelasan Bahasa Indonesia untuk error PERTAMA saja. Buat kamus di `src/lib/errorHints.ts`:

| Pola error | Penjelasan |
|---|---|
| `';' expected` | Ada perintah yang belum diakhiri titik koma. Cek baris yang ditunjuk atau baris sebelumnya. |
| `cannot find symbol` | Java tidak mengenal nama itu. Cek salah ketik, huruf besar-kecil, atau apakah variabelnya sudah dibuat. |
| `incompatible types` | Tipe data tidak cocok, misalnya mengisi teks ke variabel int. |
| `missing return statement` | Method yang punya tipe kembalian belum mengembalikan nilai di semua kemungkinan. |
| `class, interface, enum, or record expected` | Ada kurung kurawal yang kelebihan atau kurang. |
| `reached end of file while parsing` | Ada kurung kurawal `{` yang belum ditutup. |
| `unclosed string literal` | Tanda kutip teks belum ditutup. |
| `might not have been initialized` | Variabel dipakai sebelum diberi nilai. |
| `already defined` | Nama variabel atau method yang sama dibuat dua kali. |
| `non-static` ... `static context` | Method static mencoba memakai sesuatu yang bukan static. |
| `ArithmeticException: / by zero` | Program membagi dengan nol. |
| `ArrayIndexOutOfBoundsException` | Mengakses index array di luar batas. Ingat, index terakhir adalah panjang dikurangi 1. |
| `NullPointerException` | Memakai object yang masih null (belum dibuat dengan new atau belum diisi). |
| `NumberFormatException` | Mengubah teks yang bukan angka menjadi angka. |
| `InputMismatchException` | Scanner meminta angka tapi yang diberikan bukan angka. |
| `NoSuchElementException` | Program meminta input lebih banyak dari yang tersedia. |
| `StackOverflowError` | Method rekursif tidak pernah berhenti. Cek base case-nya. |
| `ClassCastException` | Casting object ke tipe yang bukan tipe aslinya. Cek dengan instanceof dulu. |
Jika tidak ada pola yang cocok, jangan tampilkan kotak ini.

### 8f. Tes
- [ ] Unit test: baris Runner/reflection terhapus dari stack trace
- [ ] Unit test: prefix /str/ terhapus
- [ ] Unit test: kamus errorHints mencocokkan pola dengan benar, termasuk kasus tidak cocok
- [ ] Unit test: exit code 0 dan 1 tampil dengan benar

## Bagian 5 — Urutan Kartu yang Disarankan
Urutan standar tiap pelajaran (tidak perlu dipaksakan di kode, cukup didukung):
teori → teori → teori → runnable → **understanding_check** → multiple_choice → code_challenge → summary

## Bagian 6 — Contoh & Tes
- [ ] Tambahkan contoh `understanding_check` di SATU pelajaran saja: `content/module-01-dasar/lesson-11.json`, diletakkan sebelum kartu code_challenge. Pakai contoh di bawah.
- [ ] Unit test: salah → remedial tampil; salah → soal berganti; 2 benar berturut → lulus; challenge terkunci sebelum lulus
- [ ] Unit test: pelajaran tanpa understanding_check tetap bisa langsung ke challenge
- [ ] Unit test: bantuan muncul sesuai jumlah gagal (1: arahkan ke materi, 2: wajib isi refleksi, 3–4: petunjuk, 5: kerangka, 7: cek ulang lalu solusi)
- [ ] Unit test: percobaan dengan kode yang tidak berubah tidak dihitung
- [ ] Unit test: paste di editor challenge ditolak, paste di kartu runnable tetap boleh
- [ ] Unit test: pesan semangat tidak sama dua kali berturut-turut
- [ ] `npm run build` dan `npm run test:unit` lulus
- [ ] Commit, push, tambah 1 baris LAPORAN.md

### Contoh kartu (untuk lesson-11, Percabangan if)
```json
{
  "type": "understanding_check",
  "minCorrect": 2,
  "questions": [
    {
      "question": "Apa output kode ini?",
      "code": "int nilai = 60;\nif (nilai >= 75) {\n    System.out.println(\"Lulus\");\n}\nSystem.out.println(\"Selesai\");",
      "options": ["Lulus lalu Selesai", "Selesai saja", "Tidak ada output", "Lulus saja"],
      "answer": 1,
      "explanation": "60 tidak lebih dari atau sama dengan 75, jadi blok if dilewati. Baris setelah blok tetap dijalankan.",
      "remedial": "Bayangkan `if` seperti **pintu dengan penjaga**. Penjaga mengecek syaratnya: `nilai >= 75`. Nilai 60 tidak memenuhi, jadi pintu tertutup dan isi ruangan (`Lulus`) tidak dijalankan.\n\nTapi perhatikan: `System.out.println(\"Selesai\")` ada **di luar** kurung kurawal. Baris itu bukan bagian dari ruangan, jadi tetap dijalankan, apa pun hasil pengecekannya."
    },
    {
      "question": "Kondisi di dalam if harus bernilai...",
      "options": ["Angka", "Teks", "true atau false", "Apa saja"],
      "answer": 2,
      "explanation": "Kondisi if harus bernilai boolean, yaitu true atau false.",
      "remedial": "`if` hanya bisa menjawab satu pertanyaan: **ya atau tidak?** Karena itu isinya harus sesuatu yang hasilnya `true` atau `false`, misalnya `umur >= 17` atau `sudahBayar`.\n\nKalau kita menulis `if (nilai)` dengan nilai berupa angka, Java bingung: angka 60 itu ya atau tidak? Makanya Java menolaknya."
    },
    {
      "question": "Berapa baris yang tercetak?",
      "code": "boolean hujan = false;\nif (hujan)\n    System.out.println(\"Bawa payung\");\n    System.out.println(\"Berangkat\");",
      "options": ["0 baris", "1 baris", "2 baris", "Error"],
      "answer": 1,
      "explanation": "Tanpa kurung kurawal, hanya baris pertama yang ikut if. \"Berangkat\" selalu tercetak.",
      "remedial": "Jorokan (spasi di depan baris) **tidak berarti apa-apa** bagi Java. Itu cuma untuk mata manusia.\n\nTanpa `{ }`, Java hanya menganggap **satu baris** tepat setelah `if` sebagai isinya. Jadi \"Bawa payung\" ikut `if` dan tidak tercetak karena `hujan` bernilai `false`, sedangkan \"Berangkat\" berdiri sendiri dan selalu tercetak.\n\nItulah kenapa kita selalu memakai kurung kurawal."
    },
    {
      "question": "Apa yang salah dari kode ini?",
      "code": "if (nilai >= 75); {\n    System.out.println(\"Lulus\");\n}",
      "options": ["Tidak ada yang salah", "Titik koma setelah kurung membuat if langsung berakhir", "Harus pakai ==", "Kurung kurawal tidak boleh dipakai"],
      "answer": 1,
      "explanation": "Titik koma mengakhiri if seketika, sehingga blok di bawahnya selalu dijalankan.",
      "remedial": "Titik koma di Java artinya **perintah selesai**. Jadi `if (nilai >= 75);` dibaca Java sebagai: \"kalau nilainya 75 ke atas, lakukan... tidak ada apa-apa. Selesai.\"\n\nBlok `{ }` di bawahnya jadi berdiri sendiri, bukan milik `if`, sehingga selalu dijalankan. Setelah tanda `)` pada `if`, langsung buka `{`, tanpa titik koma."
    }
  ]
}
```