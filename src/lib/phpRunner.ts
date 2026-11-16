import type { RunResult } from './javaRunner';

/**
 * Menjalankan PHP 8.3 asli di browser (WebAssembly) lewat Web Worker.
 * Unduhan pertama sekitar 18 MB, lalu disimpan di cache browser.
 * Program yang terlalu lama (misalnya perulangan tanpa akhir) dihentikan dengan mematikan worker.
 */
const BATAS_MUAT_MS = 120000;
const BATAS_JALAN_MS = 10000;
const NAMA_FILE = 'main.php';

let worker: Worker | null = null;
let idBerikut = 0;
let sudahDimuat = false;
const menunggu = new Map<number, (data: any) => void>();

function ambilWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./phpWorker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => {
    const selesai = menunggu.get(e.data.id);
    if (selesai) {
      menunggu.delete(e.data.id);
      selesai(e.data);
    }
  };
  worker.onerror = (e) => {
    for (const selesai of menunggu.values()) selesai({ gagal: e.message || 'PHP gagal dimuat' });
    menunggu.clear();
    matikanWorker();
  };
  return worker;
}

function matikanWorker() {
  worker?.terminate();
  worker = null;
  sudahDimuat = false;
}

const POLA_FATAL = /(?:^|\n)(?:PHP )?(Fatal error|Parse error): /;

/** Pisahkan keluaran PHP menjadi stdout dan pesan error fatal. Nama file internal diganti main.php. */
export function pisahKeluaranPhp(teks: string, exitCode: number): RunResult {
  const rapi = teks.replaceAll('/internal/eval.php', NAMA_FILE);
  const m = POLA_FATAL.exec(rapi);
  if (exitCode === 0 || !m) {
    return { stdout: rapi, stderr: exitCode === 0 ? '' : 'Program berhenti dengan kode ' + exitCode, exitCode };
  }
  const awal = m.index + (rapi[m.index] === '\n' ? 1 : 0);
  // Ambil baris pesan utamanya saja, tanpa stack trace.
  const pesan = rapi.slice(awal).split('\n')[0].trim();
  return { stdout: rapi.slice(0, m.index), stderr: pesan, exitCode };
}

export async function runPhpCode(kode: string, onStatus?: (s: string) => void): Promise<RunResult> {
  if (onStatus) onStatus(sudahDimuat ? 'Menjalankan PHP' : 'Memuat PHP (sekali saja)');
  const w = ambilWorker();
  const id = ++idBerikut;
  const batasMs = sudahDimuat ? BATAS_JALAN_MS : BATAS_MUAT_MS;
  return new Promise((resolve) => {
    const batas = setTimeout(() => {
      menunggu.delete(id);
      matikanWorker();
      resolve({ stdout: '', stderr: 'Program terlalu lama berjalan.', exitCode: 1, timedOut: true });
    }, batasMs);
    menunggu.set(id, (data) => {
      clearTimeout(batas);
      if (data.gagal) {
        matikanWorker();
        resolve({ stdout: '', stderr: data.gagal, exitCode: 1, mesinGagal: true });
        return;
      }
      sudahDimuat = true;
      resolve(pisahKeluaranPhp(data.teks, data.exitCode));
    });
    w.postMessage({ id, kode });
  });
}

/** Penjelasan singkat untuk pesan error PHP yang paling sering muncul di kelas PHP Dasar. */
export function artiGalatPhp(pesan: string): string {
  if (/Parse error: syntax error, unexpected end of file/.test(pesan)) return 'Ada kurung kurawal } atau tanda kutip yang belum ditutup.';
  if (/Parse error: syntax error/.test(pesan)) return 'Penulisan kodenya salah. Periksa titik koma ; di akhir baris sebelumnya, tanda kutip, dan kurung.';
  if (/Undefined variable/.test(pesan)) return 'Variabel dipakai sebelum diisi. Periksa ejaan nama variabel dan tanda $ di depannya.';
  if (/Call to undefined function/.test(pesan)) return 'Function itu tidak ada. Periksa ejaan nama function-nya.';
  if (/DivisionByZeroError/.test(pesan)) return 'Ada pembagian dengan nol.';
  if (/TypeError/.test(pesan)) return 'Jenis nilai yang diberikan tidak sesuai dengan yang diminta.';
  if (/ArgumentCountError/.test(pesan)) return 'Jumlah argumen saat memanggil function tidak sesuai.';
  if (/Undefined array key/.test(pesan)) return 'Kunci atau indeks array itu tidak ada.';
  return '';
}
