/**
 * Inti pemeriksa TypeScript untuk kelas TypeScript.
 *
 * Kode diperiksa dengan compiler TypeScript resmi (mode strict, target ES2022) lalu diubah menjadi
 * JavaScript, sama seperti `tsc` di komputer sendiri. Fungsi di sini tidak bergantung pada browser:
 * dipakai oleh Web Worker di browser (tsWorker.ts), oleh test, dan oleh pembuat materi, sehingga
 * kunci jawaban dicek dengan aturan yang sama persis dengan yang dialami pengguna.
 *
 * Satu kotak kode boleh berisi beberapa file. Setiap file diawali baris `// === nama.ts ===`.
 * File yang dijalankan adalah main.ts, atau file terakhir kalau tidak ada main.ts.
 */
import type * as TS from 'typescript';

/** File lib bawaan yang dipakai (ES2022 tanpa DOM). Urutan tidak penting. */
export const FILE_LIB_TS = [
  'lib.es2022.d.ts', 'lib.es2021.d.ts', 'lib.es2020.d.ts', 'lib.es2019.d.ts', 'lib.es2018.d.ts', 'lib.es2017.d.ts',
  'lib.es2016.d.ts', 'lib.es2015.d.ts', 'lib.es5.d.ts', 'lib.decorators.d.ts', 'lib.decorators.legacy.d.ts',
  'lib.es2015.core.d.ts', 'lib.es2015.collection.d.ts', 'lib.es2015.iterable.d.ts', 'lib.es2015.symbol.d.ts',
  'lib.es2015.generator.d.ts', 'lib.es2015.promise.d.ts', 'lib.es2015.proxy.d.ts', 'lib.es2015.reflect.d.ts',
  'lib.es2015.symbol.wellknown.d.ts', 'lib.es2016.array.include.d.ts', 'lib.es2016.intl.d.ts',
  'lib.es2017.arraybuffer.d.ts', 'lib.es2017.date.d.ts', 'lib.es2017.intl.d.ts', 'lib.es2017.object.d.ts',
  'lib.es2017.sharedmemory.d.ts', 'lib.es2017.string.d.ts', 'lib.es2017.typedarrays.d.ts',
  'lib.es2018.asynciterable.d.ts', 'lib.es2018.asyncgenerator.d.ts', 'lib.es2018.promise.d.ts',
  'lib.es2018.regexp.d.ts', 'lib.es2018.intl.d.ts', 'lib.es2019.array.d.ts', 'lib.es2019.object.d.ts',
  'lib.es2019.string.d.ts', 'lib.es2019.symbol.d.ts', 'lib.es2019.intl.d.ts', 'lib.es2020.bigint.d.ts',
  'lib.es2020.intl.d.ts', 'lib.es2020.date.d.ts', 'lib.es2020.number.d.ts', 'lib.es2020.promise.d.ts',
  'lib.es2020.sharedmemory.d.ts', 'lib.es2020.string.d.ts', 'lib.es2020.symbol.wellknown.d.ts',
  'lib.es2021.promise.d.ts', 'lib.es2021.string.d.ts', 'lib.es2021.weakref.d.ts', 'lib.es2021.intl.d.ts',
  'lib.es2022.array.d.ts', 'lib.es2022.error.d.ts', 'lib.es2022.intl.d.ts', 'lib.es2022.object.d.ts',
  'lib.es2022.regexp.d.ts', 'lib.es2022.string.d.ts',
];

/**
 * Lingkungan tempat kode berjalan (Web Worker di browser): console, timer, dan fetch ke server latihan
 * https://api.toko.contoh. Bentuknya mengikuti deklarasi resmi lib DOM/Node, tapi hanya bagian yang dipakai.
 */
export const LINGKUNGAN_TS = `
interface Console {
  log(...data: any[]): void;
  info(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
  debug(...data: any[]): void;
}
declare var console: Console;
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearTimeout(id: number | undefined): void;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearInterval(id: number | undefined): void;
declare function structuredClone<T>(value: T): T;
interface AbortSignal {
  readonly aborted: boolean;
  readonly reason: any;
}
declare var AbortSignal: { timeout(milliseconds: number): AbortSignal };
declare class AbortController {
  readonly signal: AbortSignal;
  abort(reason?: any): void;
}
interface Headers {
  get(name: string): string | null;
}
interface RequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}
interface Response {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  json(): Promise<any>;
  text(): Promise<string>;
}
declare function fetch(input: string, init?: RequestInit): Promise<Response>;
`;

/** Opsi compiler: setara tsconfig { "strict": true, "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler" }. */
export function opsiCompiler(ts: typeof TS): TS.CompilerOptions {
  return {
    strict: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    moduleDetection: ts.ModuleDetectionKind.Force,
    lib: ['lib.es2022.d.ts'],
    types: [],
    noEmitOnError: false,
    skipLibCheck: true,
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,
    newLine: ts.NewLineKind.LineFeed,
  };
}

const POLA_FILE = /^\/\/ === ([\w./-]+\.ts) ===[ \t]*$/;

/** Pecah isi editor menjadi file-file .ts. Tanpa penanda, semuanya dianggap main.ts. */
export function pecahFileTs(kode: string): { files: Record<string, string>; urutan: string[]; utama: string } {
  const files: Record<string, string> = {};
  const urutan: string[] = [];
  let nama: string | null = null;
  let isi: string[] = [];
  const simpan = () => {
    if (nama === null) {
      if (isi.join('').trim() === '') return;
      nama = 'main.ts';
    }
    if (files[nama] === undefined) urutan.push(nama);
    files[nama] = isi.join('\n');
  };
  for (const b of kode.replace(/\r\n?/g, '\n').split('\n')) {
    const m = b.match(POLA_FILE);
    if (m) {
      simpan();
      nama = m[1].replace(/^\.\//, '');
      isi = [];
    } else {
      isi.push(b);
    }
  }
  simpan();
  if (urutan.length === 0) {
    files['main.ts'] = '';
    urutan.push('main.ts');
  }
  const utama = files['main.ts'] !== undefined ? 'main.ts' : urutan[urutan.length - 1];
  return { files, urutan, utama };
}

export interface HasilPeriksaTs {
  /** Pesan error seperti keluaran `tsc`, satu error per elemen, misalnya "main.ts(3,7): error TS2322: ...". */
  galat: string[];
  /** Kode error TypeScript (misalnya 2322), urutannya sama dengan `galat`. */
  kodeGalat: number[];
  /** JavaScript siap dijalankan oleh jsRunner (beberapa file memakai penanda `// === nama.js ===`). */
  js: string;
}

/** Penyimpan SourceFile lib supaya pemeriksaan berikutnya cepat (lib hanya di-parse sekali). */
export function buatPemeriksa(ts: typeof TS, lib: Record<string, string>) {
  const opsi = opsiCompiler(ts);
  const cacheLib = new Map<string, TS.SourceFile>();
  const LINGKUNGAN = '/lingkungan.d.ts';

  return function periksa(kode: string): HasilPeriksaTs {
    const { files, urutan, utama } = pecahFileTs(kode);
    const virtual: Record<string, string> = { [LINGKUNGAN]: LINGKUNGAN_TS };
    for (const n of urutan) virtual['/' + n] = files[n];
    const keluaran: Record<string, string> = {};

    const ambilLib = (nama: string): string | undefined => lib[nama.replace(/^.*\//, '')];
    const host: TS.CompilerHost = {
      getSourceFile(fileName, bahasa) {
        const namaLib = fileName.replace(/^.*\//, '');
        if (/^lib\..*\.d\.ts$/.test(namaLib) && ambilLib(fileName) !== undefined) {
          let sf = cacheLib.get(namaLib);
          if (!sf) {
            sf = ts.createSourceFile(fileName, ambilLib(fileName)!, bahasa, false);
            cacheLib.set(namaLib, sf);
          }
          return sf;
        }
        const isi = virtual[fileName];
        return isi === undefined ? undefined : ts.createSourceFile(fileName, isi, bahasa, false);
      },
      getDefaultLibFileName: () => '/lib.es2022.d.ts',
      getDefaultLibLocation: () => '/',
      writeFile(fileName, data) {
        keluaran[fileName] = data;
      },
      getCurrentDirectory: () => '/',
      getDirectories: () => [],
      fileExists: (f) => virtual[f] !== undefined || (/\/lib\..*\.d\.ts$/.test(f) && ambilLib(f) !== undefined),
      readFile: (f) => virtual[f] ?? ambilLib(f),
      getCanonicalFileName: (f) => f,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
    };

    const program = ts.createProgram({ rootNames: [LINGKUNGAN, ...urutan.map((n) => '/' + n)], options: opsi, host });
    const diag = [...program.getSyntacticDiagnostics(), ...program.getGlobalDiagnostics(), ...program.getSemanticDiagnostics()];
    const galat: string[] = [];
    const kodeGalat: number[] = [];
    for (const d of diag) {
      if (d.category !== ts.DiagnosticCategory.Error) continue;
      const pesan = ts.flattenDiagnosticMessageText(d.messageText, '\n');
      if (d.file && d.start !== undefined) {
        const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
        galat.push(`${d.file.fileName.replace(/^\//, '')}(${line + 1},${character + 1}): error TS${d.code}: ${pesan}`);
      } else {
        galat.push(`error TS${d.code}: ${pesan}`);
      }
      kodeGalat.push(d.code);
    }
    program.emit();

    const jsDari = (n: string) => {
      let js = keluaran['/' + n.replace(/\.ts$/, '.js')] ?? '';
      // Import relatif diarahkan ke file .js hasil compile (./todo, ./todo.js, ./todo.ts -> ./todo.js).
      js = js.replace(/(\bfrom\s*|\bimport\s*\(?\s*)(["'])(\.\.?\/[^"']+?)(\.js|\.ts)?\2/g, (_m, a, q, p) => `${a}${q}${p}.js${q}`);
      return js;
    };
    let js: string;
    if (urutan.length === 1) {
      // Satu file: buang "export {};" penanda module supaya dijalankan sebagai script biasa (await tetap boleh).
      js = jsDari(utama).replace(/\n?export \{\};\s*$/, '\n');
    } else {
      const lain = urutan.filter((n) => n !== utama);
      js = [...lain, utama].map((n) => `// === ${n.replace(/\.ts$/, '.js')} ===\n${jsDari(n)}`).join('\n');
    }
    return { galat, kodeGalat, js };
  };
}

/** Arti singkat error TypeScript yang paling sering ditemui pemula. */
export function artiGalatTs(kode: number): string {
  const arti: Record<number, string> = {
    2322: 'Nilainya tidak cocok dengan tipe yang ditulis. Samakan tipenya, atau ubah tipe variabelnya.',
    2345: 'Argumen yang dikirim ke fungsi tidak cocok dengan tipe parameternya.',
    2339: 'Properti itu tidak ada di tipe tersebut. Periksa ejaan, atau tambahkan properti itu ke tipenya.',
    2304: 'Nama itu belum dibuat. Periksa ejaan, atau buat dulu variabel/fungsi/tipenya.',
    2554: 'Jumlah argumen tidak sesuai dengan jumlah parameter fungsi.',
    2741: 'Ada properti wajib yang belum diisi.',
    2353: 'Ada properti yang tidak dikenal oleh tipe itu. Periksa ejaannya.',
    2367: 'Perbandingan ini selalu salah karena kedua tipenya tidak pernah sama.',
    2531: 'Nilainya mungkin null. Periksa dulu dengan if sebelum dipakai.',
    2532: 'Nilainya mungkin undefined. Periksa dulu dengan if sebelum dipakai.',
    18047: 'Nilainya mungkin null. Periksa dulu dengan if sebelum dipakai.',
    18048: 'Nilainya mungkin undefined. Periksa dulu dengan if sebelum dipakai.',
    18046: 'Nilai bertipe unknown harus diperiksa dulu (typeof, instanceof, atau if) sebelum dipakai.',
    7006: 'Parameter belum diberi tipe. Di mode strict, setiap parameter wajib punya tipe.',
    7053: 'Objek ini tidak bisa diakses dengan kunci bertipe string sembarang. Pakai tipe kunci yang jelas (keyof atau Record).',
    2365: 'Operator itu tidak bisa dipakai untuk tipe-tipe ini.',
    2362: 'Sisi kiri operasi hitung harus bertipe number atau bigint.',
    2363: 'Sisi kanan operasi hitung harus bertipe number atau bigint.',
    2540: 'Properti readonly tidak boleh diubah setelah dibuat.',
    2341: 'Properti private hanya bisa dipakai di dalam class itu sendiri.',
    2445: 'Properti protected hanya bisa dipakai di class itu dan turunannya.',
    2366: 'Ada jalur kode yang tidak mengembalikan nilai.',
    2355: 'Fungsi yang punya tipe kembalian wajib mengembalikan nilai.',
    2564: 'Properti class belum diberi nilai awal di constructor.',
    2588: 'Variabel const tidak boleh diisi ulang. Pakai let kalau nilainya perlu berubah.',
    2551: 'Properti itu tidak ada. Mungkin salah ketik, lihat saran nama di pesannya.',
    2552: 'Nama itu tidak ditemukan. Mungkin salah ketik, lihat saran nama di pesannya.',
    2307: 'File atau module yang di-import tidak ditemukan.',
    2305: 'File itu tidak meng-export nama tersebut.',
    1005: 'Penulisan kode belum lengkap (kurang tanda baca seperti ; ) } atau ,).',
    2769: 'Tidak ada versi fungsi (overload) yang cocok dengan argumen ini.',
    2352: 'Konversi tipe dengan as ini tidak masuk akal karena kedua tipe terlalu berbeda.',
    2416: 'Method di class turunan tidak cocok dengan method di class induk atau interface.',
    2420: 'Class belum memenuhi semua isi interface yang di-implements.',
    2515: 'Class turunan wajib membuat method abstract dari class induknya.',
    2511: 'Class abstract tidak bisa dibuat langsung dengan new.',
    2349: 'Nilai ini bukan fungsi, jadi tidak bisa dipanggil.',
    2448: 'Variabel dipakai sebelum dibuat.',
    2454: 'Variabel dipakai sebelum diberi nilai.',
    2344: 'Tipe yang dikirim ke generic tidak memenuhi batasan (extends) parameternya.',
    2589: 'Tipe ini terlalu dalam untuk dihitung.',
  };
  return arti[kode] ?? '';
}
