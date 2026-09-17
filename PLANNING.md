# Perencanaan (Tahap 0)

## Rencana Struktur Folder
```text
BisaNgoding.com/
├── public/
│   ├── manifest.json         # Konfigurasi PWA
│   └── vite.svg
├── src/
│   ├── assets/               # Gambar, ikon
│   ├── components/
│   │   ├── cards/            # Komponen untuk tiap jenis kartu (Theory, Runnable, Quiz, dll)
│   │   ├── editor/           # Wrapper untuk CodeMirror/Monaco Editor
│   │   ├── layout/           # AppShell, TopBar, BottomNavigation (Mobile)
│   │   └── ui/               # Reusable UI (Button, Modal, ProgressBar)
│   ├── context/              # React Context untuk State/Progres User & Settings
│   ├── hooks/                # Custom hooks (contoh: useCheerpJ, useLocalStorage)
│   ├── pages/
│   │   ├── Dashboard.tsx     # Daftar modul & progres
│   │   ├── Lesson.tsx        # Player pelajaran interaktif (swipe/next card)
│   │   ├── Playground.tsx    # Code editor bebas
│   │   └── Profile.tsx       # Pengaturan, Export/Import, Sertifikat
│   ├── lib/                  # Services & Utilities
│   │   ├── javaRunner.ts     # Logika eksekusi CheerpJ & validasi output
│   │   └── storage.ts        # try/catch wrapper untuk localStorage
│   ├── types/                # Definisi TypeScript (Course, Lesson, Card, dll)
│   │   └── schema.ts         
│   ├── App.tsx
│   └── main.tsx
├── content/                  # Folder JSON kurikulum
│   ├── modules.json          # Index semua modul (1-30)
│   ├── module-01-java-dasar/
│   │   ├── lesson-01-hello-world.json
│   │   ├── lesson-02-variables.json
│   │   └── ...
│   └── module-02-java-oop/
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts            # Konfigurasi base path untuk GitHub Pages
└── .github/
    └── workflows/
        └── deploy.yml        # CI/CD otomatis ke GitHub Pages
```

## Skema TypeScript (src/types/schema.ts)
```typescript
export interface Module {
  id: string;
  title: string;
  order: number;
  lessonCount: number;
  estimatedHours?: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  estimatedMinutes: number;
  cards: Card[];
}

export type Card = 
  | TheoryCard 
  | RunnableCard 
  | MultipleChoiceCard 
  | FillBlankCard 
  | CodeChallengeCard 
  | SummaryCard
  | ReorderCard
  | PredictOutputCard;

export interface TheoryCard {
  type: 'theory';
  content: string; // Markdown
}

export interface RunnableCard {
  type: 'runnable';
  code: string;
}

export interface MultipleChoiceCard {
  type: 'multiple_choice';
  question: string;
  options: string[];
  answer: number; // Index of correct option
  explanation: string;
}

export interface FillBlankCard {
  type: 'fill_blank';
  code: string;
  answers: string[]; // Correct answers for each blank
}

export interface CodeChallengeCard {
  type: 'code_challenge';
  prompt: string;
  starterCode: string;
  tests: {
    input: string;
    expectedOutput: string;
  }[];
  hints: string[];
}

export interface ReorderCard {
  type: 'reorder';
  prompt: string;
  lines: string[]; // Lines to be reordered
  correctOrder: number[]; // Correct indices order
}

export interface PredictOutputCard {
  type: 'predict_output';
  code: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface SummaryCard {
  type: 'summary';
  points: string[];
}

export interface UserProgress {
  completedLessons: string[]; // Array of lesson IDs
  moduleStatus: Record<string, 'locked' | 'unlocked' | 'completed'>;
  xp: number;
  streak: number;
  lastActiveDate: string;
}
```

## Contoh 1 Pelajaran Lengkap dalam JSON
```json
{
  "id": "java-dasar-01",
  "moduleId": "java-dasar",
  "order": 1,
  "title": "Program Pertama: Hello World",
  "estimatedMinutes": 5,
  "cards": [
    {
      "type": "theory",
      "content": "Selamat datang di dunia Java! Java adalah bahasa pemrograman populer yang kuat dan aman.\n\nSetiap program Java harus memiliki setidaknya satu *class* dan sebuah *method* (fungsi) utama bernama `main`. Tanpa `main`, program tidak tahu dari mana harus mulai berjalan."
    },
    {
      "type": "runnable",
      "code": "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Halo, Dunia!\");\n    }\n}"
    },
    {
      "type": "theory",
      "content": "Mari kita bedah kode di atas:\n- `public class Main`: Deklarasi nama class. Nama file biasanya sama dengan nama class.\n- `public static void main(String[] args)`: Ini adalah *entry point*, titik awal program berjalan.\n- `System.out.println(...)`: Perintah untuk mencetak teks ke layar, lalu pindah baris."
    },
    {
      "type": "multiple_choice",
      "question": "Apa nama method yang wajib ada sebagai titik awal berjalannya program Java?",
      "options": ["start", "init", "main", "run"],
      "answer": 2,
      "explanation": "Program Java selalu mulai dieksekusi dari method 'main'."
    },
    {
      "type": "fill_blank",
      "code": "public class Main {\n    public static void ___(String[] args) {\n        System.out.println(\"Belajar Java itu seru!\");\n    }\n}",
      "answers": ["main"]
    },
    {
      "type": "code_challenge",
      "prompt": "Ubah kode berikut agar mencetak teks: 'Saya siap belajar Java!'",
      "starterCode": "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Teks Lama\");\n    }\n}",
      "tests": [
        {
          "input": "",
          "expectedOutput": "Saya siap belajar Java!\n"
        }
      ],
      "hints": [
        "Ganti teks 'Teks Lama' di dalam tanda kutip.",
        "Jangan lupa akhiri perintah System.out.println dengan titik koma (;)."
      ]
    },
    {
      "type": "summary",
      "points": [
        "Semua program Java berjalan mulai dari method 'main'.",
        "Perintah System.out.println() digunakan untuk menampilkan teks ke layar.",
        "Setiap baris pernyataan (statement) dalam Java wajib diakhiri dengan titik koma (;)."
      ]
    }
  ]
}
```