import type { RunResult } from './javaRunner';
import { rapikanKetikan } from './ketikan';

/**
 * Menjalankan Python asli di browser lewat Pyodide (CPython di WebAssembly, open source).
 * Satu Web Worker dipakai bersama: program editor memakai namespace baru setiap kali dijalankan,
 * konsol >>> (praktik_python) memakai satu namespace yang bertahan antarbaris.
 */
export const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.28.1/full/';
const BATAS_PROGRAM_MS = 5000;
const BATAS_MUAT_MS = 120000;

/**
 * Kode Python yang dipasang sekali di dalam Pyodide. Dipakai juga oleh tes konten (dijalankan dengan python3)
 * supaya kunci jawaban dicek dengan logika yang sama persis.
 * Setiap fungsi _bn_* menerima (kode, masukan) dan mengembalikan (keluaran, galat, jenis_galat).
 */
export const PY_SETUP = `
import sys, io, traceback, copy, linecache

_bn_ns = {'__name__': '__main__'}
_bn_simpanan = None
_BARU = chr(10)

def _bn_jalankan(src, ns, mode, stdin):
    keluar = io.StringIO()
    lama = (sys.stdout, sys.stderr, sys.stdin)
    sys.stdout = keluar
    sys.stderr = keluar
    sys.stdin = io.StringIO(stdin)
    galat = ''
    jenis = ''
    try:
        nama = 'main.py' if mode == 'exec' else '<stdin>'
        linecache.cache[nama] = (len(src), None, (src + _BARU).splitlines(True), nama)
        exec(compile(src + _BARU, nama, mode), ns)
    except SystemExit:
        pass
    except BaseException as e:
        jenis = type(e).__name__
        if isinstance(e, SyntaxError):
            galat = ''.join(traceback.format_exception_only(type(e), e))
        else:
            tb = e.__traceback__
            while tb is not None and tb.tb_frame.f_code.co_filename not in ('main.py', '<stdin>'):
                tb = tb.tb_next
            galat = ''.join(traceback.format_exception(type(e), e, tb))
    finally:
        sys.stdout, sys.stderr, sys.stdin = lama
    return keluar.getvalue(), galat, jenis

def _bn_program(src, stdin):
    return _bn_jalankan(src, {'__name__': '__main__'}, 'exec', stdin)

def _bn_repl(src, stdin):
    return _bn_jalankan(src, _bn_ns, 'single', stdin)

def _bn_persiapan(src, stdin):
    return _bn_jalankan(src, _bn_ns, 'exec', stdin)

def _bn_reset(src, stdin):
    _bn_ns.clear()
    _bn_ns['__name__'] = '__main__'
    return '', '', ''

def _bn_simpan(src, stdin):
    global _bn_simpanan
    isi = {k: v for k, v in _bn_ns.items() if k != '__builtins__'}
    try:
        _bn_simpanan = copy.deepcopy(isi)
    except Exception:
        _bn_simpanan = dict(isi)
    return '', '', ''

def _bn_pulihkan(src, stdin):
    if _bn_simpanan is not None:
        b = _bn_ns.get('__builtins__')
        _bn_ns.clear()
        _bn_ns.update(_bn_simpanan)
        if b is not None:
            _bn_ns['__builtins__'] = b
    return '', '', ''

def _bn_cek(src, stdin):
    try:
        return ('True' if eval(src, _bn_ns) else 'False'), '', ''
    except BaseException as e:
        return 'False', str(e), type(e).__name__
`;

const kodeWorker = `
importScripts('${PYODIDE_URL}pyodide.js');
const siap = loadPyodide({ indexURL: '${PYODIDE_URL}' }).then((py) => {
  py.runPython(${JSON.stringify(PY_SETUP)});
  return py;
});
self.onmessage = async (e) => {
  const { id, jenis, kode, masukan } = e.data;
  try {
    const py = await siap;
    if (jenis === 'siap') {
      self.postMessage({ id, ok: true, keluaran: '', galat: '', jenisGalat: '' });
      return;
    }
    const f = py.globals.get('_bn_' + jenis);
    const hasil = f(kode || '', masukan || '');
    const js = hasil.toJs();
    if (hasil.destroy) hasil.destroy();
    if (f.destroy) f.destroy();
    self.postMessage({ id, ok: true, keluaran: js[0], galat: js[1], jenisGalat: js[2] });
  } catch (err) {
    self.postMessage({ id, ok: false, keluaran: '', galat: String((err && err.message) || err), jenisGalat: 'GagalMuat' });
  }
};
`;

export interface HasilPython {
  keluaran: string;
  galat: string;
  jenisGalat: string;
  waktuHabis?: boolean;
}

type Jenis = 'siap' | 'program' | 'repl' | 'persiapan' | 'reset' | 'simpan' | 'pulihkan' | 'cek';

let worker: Worker | null = null;
let workerUrl = '';
let sudahSiap = false;
let nomor = 0;
let antrean: Promise<unknown> = Promise.resolve();
const menunggu = new Map<number, (h: HasilPython) => void>();

function buatWorker(): Worker {
  workerUrl = URL.createObjectURL(new Blob([kodeWorker], { type: 'application/javascript' }));
  const w = new Worker(workerUrl);
  w.onmessage = (e) => {
    const { id, keluaran, galat, jenisGalat } = e.data;
    const selesai = menunggu.get(id);
    if (selesai) {
      menunggu.delete(id);
      selesai({ keluaran, galat, jenisGalat });
    }
  };
  w.onerror = (e) => {
    for (const [id, selesai] of menunggu) {
      menunggu.delete(id);
      selesai({ keluaran: '', galat: e.message || 'Python gagal dimuat.', jenisGalat: 'GagalMuat' });
    }
  };
  return w;
}

function hentikanWorker() {
  worker?.terminate();
  if (workerUrl) URL.revokeObjectURL(workerUrl);
  worker = null;
  workerUrl = '';
  sudahSiap = false;
  for (const [id, selesai] of menunggu) {
    menunggu.delete(id);
    selesai({ keluaran: '', galat: '', jenisGalat: 'Dihentikan' });
  }
}

function kirim(jenis: Jenis, kode = '', masukan = '', batas = BATAS_PROGRAM_MS): Promise<HasilPython> {
  const kerja = antrean.then(
    () =>
      new Promise<HasilPython>((resolve) => {
        if (!worker) worker = buatWorker();
        const w = worker;
        const id = ++nomor;
        const waktu = sudahSiap ? batas : Math.max(batas, BATAS_MUAT_MS);
        const timer = setTimeout(() => {
          if (!menunggu.has(id)) return;
          menunggu.delete(id);
          // Program macet (misalnya while True): hentikan worker; Python dimuat ulang saat dipakai lagi.
          hentikanWorker();
          resolve({ keluaran: '', galat: '', jenisGalat: 'WaktuHabis', waktuHabis: true });
        }, waktu);
        menunggu.set(id, (h) => {
          clearTimeout(timer);
          if (h.jenisGalat !== 'GagalMuat') sudahSiap = true;
          resolve(h);
        });
        w.postMessage({ id, jenis, kode, masukan });
      })
  );
  antrean = kerja.catch(() => undefined);
  return kerja;
}

/** Muat Python lebih awal (unduhan pertama sekitar 10 MB, sesudahnya dari cache browser). */
export async function siapkanPython(onStatus?: (s: string) => void): Promise<boolean> {
  if (!sudahSiap) onStatus?.('Memuat Python (sekali saja)');
  const h = await kirim('siap');
  return h.jenisGalat === '';
}

export function pythonSudahSiap(): boolean {
  return sudahSiap;
}

/** Jalankan program utuh (editor). Bentuk hasil sama dengan runner Java/JavaScript. */
export async function runPythonCode(code: string, stdinInput = '', onStatus?: (s: string) => void): Promise<RunResult> {
  if (!sudahSiap) onStatus?.('Memuat Python (sekali saja)');
  const h = await kirim('program', rapikanKetikan(code), stdinInput);
  if (h.waktuHabis) return { stdout: '', stderr: 'Waktu habis: kemungkinan ada perulangan yang tidak pernah berhenti.', exitCode: -1, timedOut: true };
  if (h.jenisGalat === 'GagalMuat') return { stdout: '', stderr: `Python gagal dimuat. Periksa koneksi internet lalu coba lagi.\n${h.galat}`, exitCode: 1 };
  return { stdout: h.keluaran, stderr: h.galat, exitCode: h.galat ? 1 : 0 };
}

/** Konsol >>>: satu baris dijalankan di namespace yang bertahan. */
export const konsol = {
  jalankan: (baris: string) => kirim('repl', rapikanKetikan(baris)),
  persiapan: (kode: string) => kirim('persiapan', kode),
  reset: () => kirim('reset'),
  simpan: () => kirim('simpan'),
  pulihkan: () => kirim('pulihkan'),
  cek: async (ekspresi: string) => (await kirim('cek', ekspresi)).keluaran === 'True',
};

/** Penjelasan singkat untuk jenis error Python yang paling sering ditemui pemula. */
export function artiGalatPython(jenis: string): string {
  const arti: Record<string, string> = {
    NameError: 'NameError artinya nama itu belum dibuat atau salah ketik. Huruf besar dan kecil dibedakan.',
    SyntaxError: 'SyntaxError artinya penulisannya belum benar. Periksa tanda kutip, kurung, titik dua (:), dan tanda =.',
    IndentationError: 'IndentationError artinya spasi di awal baris (indentasi) belum benar.',
    TypeError: 'TypeError artinya jenis datanya tidak cocok, misalnya teks digabung dengan angka. Ubah dulu dengan str() atau int().',
    ValueError: 'ValueError artinya isinya tidak bisa diubah, misalnya int("abc").',
    ZeroDivisionError: 'ZeroDivisionError artinya ada pembagian dengan nol.',
    IndexError: 'IndexError artinya nomor urut (indeks) melewati panjang list. Indeks mulai dari 0.',
    KeyError: 'KeyError artinya kunci itu tidak ada di dictionary.',
    AttributeError: 'AttributeError artinya method atau atribut itu tidak dimiliki oleh datanya.',
    FileNotFoundError: 'FileNotFoundError artinya file itu tidak ditemukan.',
    WaktuHabis: 'Kodenya terlalu lama berjalan, kemungkinan perulangannya tidak pernah berhenti.',
  };
  return arti[jenis] ?? '';
}
