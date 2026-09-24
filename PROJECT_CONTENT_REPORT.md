# PROJECT_CONTENT_REPORT.md

## 1. Tech Stack

- **Framework & Bahasa**: React 19, TypeScript, Vite.
- **Styling**: Tailwind CSS (v4), Tailwind Typography, Tailwind Animate.
- **Library Utama**:
  - `react-router-dom` (Routing)
  - `@uiw/react-codemirror` & `@codemirror/lang-java` (Code Editor)
  - `lucide-react` (Ikon)
  - `react-markdown` & `remark-gfm` (Render teks/materi)
  - `@supabase/supabase-js` (Database/Sinkronisasi cloud)
  - `CheerpJ` (Client-side Java JVM)
- **Testing**: Vitest (Unit), Playwright (E2E), Oxlint, Prettier.

## 2. Struktur Folder

```text
Development/BisaNgoding.com
├── content/
│   ├── module-01c-todolist/
│   ├── module-01-dasar/
│   ├── module-02-oop/
│   ├── achievements.json
│   └── modules.json
├── e2e/
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── scripts/
│   ├── test/
│   └── types/
└── root-level config files (package.json, vite.config.ts, dll)
```

## 3. Penyimpanan Data Kursus

- **Lokasi**: Semua materi disimpan di dalam direktori `content/` dalam format `.json`.
- **Daftar Modul**: Didaftarkan secara terpusat di file `content/modules.json`.
- **Daftar Materi (Lessons)**: Tidak ada _registry_ spesifik untuk materi; pelajaran secara otomatis di-load menggunakan _Vite Glob Import_ (`import.meta.glob`) dari semua subfolder di dalam `content/`. Folder otomatis dipetakan ke modul yang dituju dengan mencocokkan field `moduleId` yang terdapat di setiap file JSON pelajaran.
- **Catatan mengenai "Kursus JavaScript"**: **Tidak ditemukan.** Proyek `BisaNgoding.com` adalah murni kursus interaktif untuk bahasa pemrograman **Java** (saat ini terdaftar 31 modul di `modules.json` seperti Java Dasar, Java OOP, Todolist, dsb). Tidak ditemukan sama sekali modul (7 modul, 173 materi) terkait JavaScript.

## 4. Skema Data

Skema yang didefinisikan dalam `src/types/schema.ts`:

- **Course**: **Tidak ditemukan**. Aplikasi ini bersifat _single-course linear_, sehingga tingkatan tertingginya langsung berupa _Module_.
- **Module**:
  - `id` (string)
  - `title` (string)
  - `order` (number)
  - `lessonCount` (number)
  - `status` (opsional: 'ready' | 'draft')
  - `requires` (opsional: string)
  - `estimatedHours` (opsional: number)
- **Lesson**:
  - `id` (string)
  - `moduleId` (string)
  - `order` (number)
  - `title` (string)
  - `estimatedMinutes` (number)
  - `cards` (Array of Card, sebagai susunan elemen di dalam pelajaran)
- **Code Challenge** (`CodeChallengeCard`):
  - `type`: 'code_challenge'
  - `prompt` (string)
  - `starterCode` (string)
  - `steps` (opsional: string[])
  - `skeleton` (opsional: string)
  - `tests` (Array of `{ input: string, expectedOutput: string }`)
  - `hints` (string[])
  - `solution` (opsional: string)
- **Quiz** (`QuizQuestion`):
  - `id` (string)
  - `question` (string)
  - `code` (opsional: string)
  - `options` (string[])
  - `answer` (number, index opsi yang benar)
  - `explanation` (string)
- **ID, Slug, & Urutan**: `id` dan `order` ditulis secara manual di dalam setiap JSON materi (contoh `id: "java-dasar-01"`). ID ini tidak hanya mengidentifikasi data tetapi secara langsung digunakan sebagai _slug_ pada URL (seperti `/lesson/java-dasar-01`).
- **Penghitungan Durasi**: "8 Jam 7 Menit" dihitung secara otomatis (di file `Dashboard.tsx`) dengan menjumlahkan field `estimatedMinutes` dari setiap _Lesson_ yang belum diselesaikan (jika data kosong diberi default 5 menit). Nilai tersebut lalu dikonversi menjadi satuan jam.

## 5. Format Isi Materi

- Isi materi ditulis sepenuhnya menggunakan **JSON** yang menampung _Cards_ (_theory, runnable, multiple_choice, code_challenge_, dll).
- Di dalam kartu dengan field teks panjang (seperti `content` atau `explanation`), digunakan sintaks **Markdown**.
- Terdapat komponen khusus saat rendering:
  - Blok statis Java menggunakan Markdown standar: \`\`\`java
  - Blok _mini-playground_ Java yang bisa di-_run_ menggunakan: \`\`\`java run
  - Dukungan baris spesifik lewat fitur `annotations` yang akan merender anotasi terkait baris kode.

**Contoh File Materi Penuh (Verbatim dari `content/module-01-dasar/lesson-01.json`)**:

````json
{
  "id": "java-dasar-01",
  "moduleId": "java-dasar",
  "order": 1,
  "title": "Program Pertama: Hello World",
  "estimatedMinutes": 8,
  "cards": [
    {
      "type": "theory",
      "content": "Setiap orang yang belajar memrogram selalu mulai dari hal yang sama: membuat komputer menulis satu kalimat di layar.\n\nTerdengar sepele. Tapi begitu tulisan itu muncul, rasanya berbeda. Kita baru saja menyuruh mesin melakukan sesuatu, dan dia menurut.\n\nMari kita lihat programnya dulu, baru kita bedah satu per satu."
    },
    {
      "type": "theory",
      "content": "```java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Halo, Dunia!\");\n    }\n}\n```\n\nLima baris untuk satu kalimat. Banyak? Memang. Java terkenal agak bertele-tele di awal, tapi setiap bagian ada gunanya.\n\n`public class Main` adalah wadahnya. Di Java, semua kode harus berada di dalam sebuah class.\n\n`public static void main(String[] args)` adalah pintu masuknya. Saat program dijalankan, Java mencari method bernama `main` dan mulai dari situ. Tanpa itu, Java bingung harus mulai dari mana.\n\n`System.out.println(...)` artinya: tampilkan ini ke layar, lalu pindah baris.\n\nCoba sendiri di sini. Ganti tulisannya dengan namamu, lalu tekan Jalankan:\n\n```java run\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Halo, nama saya Budi\");\n    }\n}\n```"
    },
    {
      "type": "theory",
      "content": "Dua hal kecil yang sering bikin pemula frustrasi di hari pertama.\n\n**Titik koma.** Setiap perintah diakhiri titik koma. Lupa satu, program menolak jalan. Anggap saja titik di akhir kalimat.\n\n**Huruf besar dan kecil itu penting.** `System` berbeda dengan `system`. `Println` berbeda dengan `println`. Java tidak memaafkan yang satu ini.\n\nKalau nanti muncul pesan error merah panjang, jangan panik. Biasanya penyebabnya sesederhana dua hal tadi. Membaca error adalah keterampilan yang akan kita latih terus sepanjang perjalanan ini."
    },
    {
      "type": "runnable",
      "code": "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Halo, Dunia!\");\n        System.out.println(\"Saya sedang belajar Java.\");\n    }\n}",
      "predict": {
        "question": "Sebelum menekan Jalankan, tebak dulu: apa baris TERAKHIR yang akan tercetak?",
        "options": [
          "Halo, Dunia!",
          "Saya sedang belajar Java",
          "Saya sedang belajar Java.",
          "Tidak ada output"
        ],
        "answer": 2
      },
      "annotations": [
        {
          "line": 1,
          "note": "Wadah program. Semua kode Java harus ada di dalam class."
        },
        {
          "line": 2,
          "note": "Pintu masuk. Java selalu mulai menjalankan program dari sini."
        },
        {
          "line": 3,
          "note": "Mencetak teks ke layar, lalu pindah baris."
        }
      ],
      "explanation": "Java membaca isi `main` dari atas ke bawah. Baris pertama mencetak \"Halo, Dunia!\" lalu pindah baris, kemudian baris kedua mencetak kalimat berikutnya.\n\nUrutan output selalu sama dengan urutan penulisan perintah. Kalau dua baris itu ditukar, outputnya juga ikut bertukar.",
      "tryThis": [
        {
          "task": "Tukar urutan kedua baris println. Apa yang berubah?",
          "hint": "Perhatikan urutan output."
        },
        {
          "task": "Hapus titik koma di akhir salah satu baris, lalu jalankan. Baca pesan errornya.",
          "hint": "Error akan menyebut ';' expected."
        }
      ]
    },
    {
      "type": "understanding_check",
      "minCorrect": 2,
      "questions": [
        {
          "question": "Apa output kode ini?",
          "code": "System.out.println(\"A\");\nSystem.out.println(\"B\");",
          "options": ["B ⏎ A", "A ⏎ B", "AB", "A"],
          "answer": 1,
          "explanation": "Perintah dijalankan dari atas ke bawah, masing-masing di baris baru.",
          "remedial": "Coba bayangkan program Java seperti **surat resmi**. Ada amplopnya (`public class Main`), ada bagian yang wajib dibaca pertama (`main`), dan ada isi pesannya (`System.out.println`).\n\nKomputer selalu membuka surat dari bagian `main`. Semua yang ada di dalam kurung kurawal `main` dijalankan **dari atas ke bawah**, satu per satu.\n\nDan setiap kalimat perintah diakhiri **titik koma**, sama seperti titik di akhir kalimat. Tanpa titik koma, Java bingung di mana perintah itu berakhir."
        },
        {
          "question": "Method apa yang menjadi titik awal jalannya program Java?",
          "options": ["start()", "main()", "run()", "begin()"],
          "answer": 1,
          "explanation": "Java selalu mulai menjalankan program dari method main.",
          "remedial": "Coba bayangkan program Java seperti **surat resmi**. Ada amplopnya (`public class Main`), ada bagian yang wajib dibaca pertama (`main`), dan ada isi pesannya (`System.out.println`).\n\nKomputer selalu membuka surat dari bagian `main`. Semua yang ada di dalam kurung kurawal `main` dijalankan **dari atas ke bawah**, satu per satu.\n\nDan setiap kalimat perintah diakhiri **titik koma**, sama seperti titik di akhir kalimat. Tanpa titik koma, Java bingung di mana perintah itu berakhir."
        }
      ]
    },
    {
      "type": "code_challenge",
      "prompt": "Ubah programnya agar mencetak `Saya siap belajar Java!`",
      "starterCode": "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Teks Lama\");\n    }\n}",
      "steps": [
        "Cari teks di dalam tanda kutip pada perintah println.",
        "Ganti isinya persis dengan kalimat yang diminta.",
        "Pastikan tanda kutip dan titik koma tetap ada."
      ],
      "skeleton": "public class Main {\n    public static void main(String[] args) {\n        System.out.println(___);\n    }\n}",
      "tests": [
        {
          "input": "",
          "expectedOutput": "Saya siap belajar Java!\n"
        }
      ],
      "hints": [
        "Ganti teks di dalam tanda kutip.",
        "Jangan hapus titik koma di akhir baris."
      ],
      "solution": "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Saya siap belajar Java!\");\n    }\n}"
    },
    {
      "type": "summary",
      "points": [
        "Semua kode Java berada di dalam class.",
        "Program dimulai dari method main.",
        "Setiap perintah diakhiri titik koma.",
        "Huruf besar dan kecil dibedakan."
      ]
    }
  ]
}
````

## 6. Code Challenge

- **Definisi**: Ditangani oleh tipe card `code_challenge`. Berisi arahan pengerjaan (`prompt`), kode bawaan (`starterCode`), tahap pengerjaan terpandu (`steps`), `tests` test case, serta bantuan logis berupa `hints` (array bertahap) dan hasil akhir dari `solution`.
- **Eksekutor**: Kode Java **dijalankan sepenuhnya di dalam Browser** (bukan Eval native dan bukan menggunakan Web Worker JS biasa) namun memanfaatkan compiler mandiri via **CheerpJ**. File `src/lib/javaRunner.ts` menyuntikkan instruksi Java (`com.sun.tools.javac.Main`) secara native ke dalam _hidden iframe_ untuk mengompilasi dan menjalankan instruksi. Hasil `stdout` dari intervensi _intercept_ file `Runner` disandingkan dengan `expectedOutput` yang ada pada JSON.

**Contoh Code Challenge**:

```json
{
  "type": "code_challenge",
  "prompt": "Mulai dari saldo 100. Tambah 50 dengan `+=`, kurangi 30 dengan `-=`, lalu tambah 1 dengan `++`. Cetak saldo akhirnya.",
  "starterCode": "public class Main {\n    public static void main(String[] args) {\n        int saldo = 100;\n        // Tulis kode kamu di sini\n    }\n}",
  "tests": [
    {
      "input": "",
      "expectedOutput": "121\n"
    }
  ],
  "hints": ["Urutannya: += 50, -= 30, lalu ++.", "Hasil akhirnya harus 121."],
  "solution": "public class Main {\n    public static void main(String[] args) {\n        int saldo = 100;\n        saldo += 50;\n        saldo -= 30;\n        saldo++;\n        System.out.println(saldo);\n    }\n}",
  "steps": [
    "Tambah 50 ke saldo dengan +=.",
    "Kurangi 30 dengan -=.",
    "Tambah 1 dengan ++, lalu cetak."
  ],
  "skeleton": "public class Main {\n    public static void main(String[] args) {\n        int saldo = 100;\n        saldo ___ 50;\n        saldo ___ 30;\n        saldo___;\n        System.out.println(saldo);\n    }\n}"
}
```

## 7. Kuis Akhir Modul

- **Format Soal**: Pilihan Ganda (seperti Array statis pada field `options`). Terletak di file tersendiri dengan nama khusus `quiz.json` (ditempatkan di dalam folder modul itu sendiri).
- **Penilaian**: Penilaian dilakukan dengan membandingkan index yang di klik pengguna (_zero-based_) terhadap index pada field `answer`. Setelah klik hitung hasil, sistem menyimpan _passing state_ berupa boolean `passed` (lulus/tidaknya) beserta `score` numeriknya (0-100) di database.

**Contoh 3 Kuis Pertama (dari `content/module-02-oop/quiz.json`)**:

```json
[
  {
    "id": "java-oop-quiz-01",
    "question": "Apa perbedaan class dan object?",
    "options": [
      "Object adalah cetakan class",
      "Keduanya sama",
      "Class hanya berisi method",
      "Class adalah cetakan, object adalah hasil yang dibuat dengan new"
    ],
    "answer": 3,
    "explanation": "Class adalah rancangan, object adalah wujud nyatanya."
  },
  {
    "id": "java-oop-quiz-02",
    "question": "Ciri constructor yang benar adalah...",
    "options": [
      "Selalu bertipe void",
      "Harus static",
      "Namanya sama dengan class dan tidak punya tipe return",
      "Namanya selalu init"
    ],
    "answer": 2,
    "explanation": "Constructor tidak punya tipe return, bahkan void."
  },
  {
    "id": "java-oop-quiz-03",
    "question": "Apa gunanya kata kunci this di dalam constructor?",
    "options": [
      "Membuat object baru",
      "Menandai bahwa variabel itu milik object yang sedang dibuat",
      "Mengembalikan nilai true",
      "Memanggil class lain"
    ],
    "answer": 1,
    "explanation": "this membedakan atribut object dari parameter constructor yang bernama sama."
  }
]
```

## 8. Cara Menambahkan Konten Baru

- **Materi Baru di Modul yang Ada**: Cukup ciptakan file baru (contoh: `lesson-33.json`) di folder bersangkutan, lengkapi field `moduleId` serta struktur _Cards_, maka materi langsung ter-_load_ ke dalam sistem (melalui deteksi otomatis dari `import.meta.glob` di `content.ts`).
- **Modul Baru**: Daftarkan objek modulnya pada `content/modules.json`, lalu buatlah subfolder baru di dalam `content/`. Selanjutnya isi folder tersebut dengan rentetan file _lesson JSON_ yang menautkan nama ID Modul barunya ke field `moduleId`.
- **Kursus Baru**: Proyek ini **tidak** dirancang untuk _multi-course_ (misalnya penambahan Java dan JavaScript berdampingan). Segala file eksekusi (_runner_) dan format kode sudah sangat kuat didesain khusus untuk melayani Java (dengan CheerpJ). Membuat kursus di luar spesifikasi Java memerlukan perombakan skala besar pada Runner (`src/lib/javaRunner.ts`).

## 9. Progress & Integrasi

- **Penyimpanan**: Sistem menyimpan `UserProgress` ke dalam dua tempat. Pertama, secara statis dan sementara di **localStorage** browser di bawah kunci (`bisangoding_progress`). Kedua, melakukan persistensi (_upsert_) ke Supabase (tabel `progres`, kolom json `data`, mencocokkan parameter `user_id` yang sesuai di sesi Login Auth).
- **Pengaruh Perubahan ID**: Mengubah `id` materi di file _JSON_ sangat dilarang karena akan memutus rantai validasi kelulusan. Data _progress_ yang disimpan (berupa array identitas unik: `"completedLessons": ["java-dasar-01", "java-dasar-02"]`) akan langsung tersesat jika string referensinya Anda ganti.

## 10. Konvensi & Catatan

- **Bahasa Konten**: Konten ditulis dengan santai bergaya _neo-brutalism_, memprioritaskan "Paham dulu, baru ngoding" dengan melarang akses kode yang bertele-tele jika pemahaman (`understanding_check`) gagal ditebak oleh pengguna.
- **Konsistensi Folder**: Perlu diperhatikan bahwa identifikasi folder (seperti `module-01-dasar`) tidak serta merta menjadi `id` yang di-_track_ di `modules.json` (ID-nya murni: `java-dasar`). Resolusi direpresentasikan dari kepemilikan `moduleId` yang dipanen dari _lesson_ JSON pada folder tersebut, sehingga kesalahan penamaan JSON di dalamnya akan membuat pelajaran gagal di-render di antarmuka modul.
