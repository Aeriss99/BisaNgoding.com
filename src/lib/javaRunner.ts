import { rapikanKetikan } from './ketikan';
import { classpathPustaka } from './javaPustaka';

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut?: boolean;
  /** Diisi runner: error datang dari mesin Java (CheerpJ), bukan dari program. */
  mesinGagal?: boolean;
}

const CHEERPJ_CDN = 'https://cjrtnc.leaningtech.com/3.0/cj3loader.js';
// Mode percobaan Java 21: CheerpJ 5 membawa JDK lengkap (termasuk javac), jadi tidak memakai tools.jar.
const CHEERPJ5_CDN = 'https://cjrtnc.leaningtech.com/5.0/loader.js';
const TIMEOUT_MS = 20_000;
// Kode yang memakai library (JUnit, Mockito, Jackson, dan lainnya) atau Java 21: pemuatan pertama bisa makan waktu.
const TIMEOUT_PUSTAKA_MS = 90_000;
const KUNCI_MODE = 'bn_java_versi';
// Mesin Java (CheerpJ) dibuang dan dibuat ulang setelah sekian kali jalan, supaya memorinya tidak menumpuk.
// Diukur di Chromium (12 Nov 2026): tanpa ini, tab crash tepat di jalan ke-35 dalam satu tab.
export const BATAS_JALAN_PER_MESIN = 12;
export const PESAN_MESIN_RUSAK =
  'Mesin Java di browser kehabisan memori dan sudah dimuat ulang. Tekan Jalankan sekali lagi. Kalau masih muncul, tutup tab lain lalu muat ulang halaman ini.';

/** true kalau pesan error berasal dari mesin WebAssembly yang rusak atau kehabisan memori, bukan dari program Java. */
export function apakahMesinRusak(pesan: string): boolean {
  return /RuntimeError|memory access out of bounds|out of memory|unreachable|table index is out of bounds|call stack size exceeded|null function or function signature mismatch/i.test(pesan);
}

export type VersiJava = 8 | 21;

/** Versi Java yang dipakai. Bawaan 8. Mode percobaan 21 dinyalakan dengan ?java=21 (dimatikan ?java=8). */
export function versiJava(): VersiJava {
  if (typeof window === 'undefined') return 8;
  const cari = window.location.search + '&' + (window.location.hash.split('?')[1] ?? '');
  const pilih = new URLSearchParams(cari).get('java');
  try {
    if (pilih === '21') localStorage.setItem(KUNCI_MODE, '21');
    else if (pilih === '8') localStorage.removeItem(KUNCI_MODE);
    return localStorage.getItem(KUNCI_MODE) === '21' ? 21 : 8;
  } catch {
    return pilih === '21' ? 21 : 8;
  }
}

/** Versi yang dipakai untuk satu materi: materi bertanda javaVersion 21 selalu memakai Java 21, sisanya mengikuti mode situs. */
export function versiUntukMateri(javaVersion?: number): VersiJava {
  return javaVersion === 21 ? 21 : versiJava();
}

// Satu iframe CheerpJ per versi Java (Java 8 dan Java 21 bisa dipakai bergantian di satu sesi).
const iframes = new Map<VersiJava, { iframe: HTMLIFrameElement; siap: Promise<void>; jalan: number }>();
let runCounter = 0;

interface PendingCallback {
  resolve: (r: RunResult) => void;
  reject: (e: Error) => void;
  onStatus?: (s: string) => void;
}
const pendingCallbacks = new Map<string, PendingCallback>();

function buildRunnerSource(): string {
  return [
    'import java.io.*;',
    'public class Runner {',
    '  public static void main(String[] a) throws Exception {',
    '    String runId = a.length > 0 ? a[0] : "0";',
    '    String outFile = "/files/out" + runId + ".txt";',
    '    String errFile = "/files/err" + runId + ".txt";',
    '    ByteArrayOutputStream ob = new ByteArrayOutputStream();',
    '    ByteArrayOutputStream eb = new ByteArrayOutputStream();',
    '    System.setOut(new PrintStream(ob, true, "UTF-8"));',
    '    System.setErr(new PrintStream(eb, true, "UTF-8"));',
    '    System.setIn(new FileInputStream(new File("/str/stdin.txt")));',
    // Keluaran materi direkam dengan locale en_US; samakan supaya pesan library (mis. Hibernate Validator) dan format angka sama di semua browser.
    '    java.util.Locale.setDefault(java.util.Locale.US);',
    '    int code = 0;',
    '    try {',
    '      Main.main(new String[0]);',
    '    } catch (Throwable t) {',
    '      t.printStackTrace(System.err);',
    '      code = 1;',
    '    }',
    '    try {',
    '      FileOutputStream fo = new FileOutputStream(outFile);',
    '      fo.write(ob.toByteArray()); fo.close();',
    '      FileOutputStream fe = new FileOutputStream(errFile);',
    '      fe.write(eb.toByteArray()); fe.close();',
    '    } catch (Exception ex) {}',
    '    System.exit(code);',
    '  }',
    '}'
  ].join('\n');
}

export function buildIframeSrcdoc(versi: VersiJava = 8): string {
  const loader = versi === 21 ? CHEERPJ5_CDN : CHEERPJ_CDN;
  // CheerpJ 3 (Java 8) belum punya native untuk anotasi tipe, sehingga Hibernate Validator macet.
  // Native pengganti mengembalikan null, artinya "tidak ada anotasi tipe".
  const init =
    versi === 21
      ? "{ status: 'none', version: 21 }"
      : "{ status: 'none', natives: { Java_java_lang_reflect_Field_getTypeAnnotationBytes0: tanpaAnotasiTipe, Java_java_lang_reflect_Executable_getTypeAnnotationBytes0: tanpaAnotasiTipe } }";
  // Java 21: javac bawaan JDK (classpath kosong). Java 8: javac dari tools.jar milik situs.
  const cekTools = versi === 21 ? 'false' : 'true';
  return `<!doctype html>
<html><head>
<script src="${loader}"></script>
<script>
window.lastCompiledHash = null;
async function tanpaAnotasiTipe() { return null; }
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    return hash.toString(36);
  }
(async function() {
  try {
    await cheerpjInit(${init});
    window.parent.postMessage({ type: 'cheerpj-ready' }, '*');
  } catch (e) {
    window.parent.postMessage({ type: 'cheerpj-error', message: String(e) }, '*');
    return;
  }

  window.addEventListener('message', async function(ev) {
    var d = ev.data;
    if (!d || d.type !== 'run') return;
    var id = d.id, runId = d.runId, toolsPath = d.toolsPath, cp = d.cp || '', enc = new TextEncoder();
    var pakaiTools = ${cekTools};
    cheerpOSAddStringFile('/str/Main.java', enc.encode(d.code));
    cheerpOSAddStringFile('/str/Runner.java', enc.encode(d.runnerSource));
    cheerpOSAddStringFile('/str/stdin.txt', enc.encode(d.stdin || ''));

    // Verify tools.jar is accessible (hanya Java 8)
    if (pakaiTools) try {
      var blob = await cjFileBlob(toolsPath);
      if (!blob || blob.size < 1000) {
        throw new Error('Blob too small');
      }
    } catch(e) {
      window.parent.postMessage({ id: id, stdout: '', stderr: 'File compiler tidak ditemukan di ' + toolsPath, exitCode: 1 }, '*');
      return;
    }

    try {
      var currentHash = hashString(d.code);
      if (window.lastCompiledHash !== currentHash) {
        window.parent.postMessage({ type: 'status', id: id, status: 'Mengompilasi' }, '*');
        var cx = await cheerpjRunMain(
        'com.sun.tools.javac.Main', [pakaiTools ? toolsPath : '', cp].filter(Boolean).join(':'),
        '-Xstdout', '/files/javac' + runId + '.txt',
        '/str/Main.java', '/str/Runner.java', '-d', '/files/'
      );
      if (cx !== 0) {
          window.lastCompiledHash = null;
        var compErr = 'Gagal compile (tidak ada pesan dari javac).';
        try { 
          var errBlob = await cjFileBlob('/files/javac' + runId + '.txt');
          var errText = await errBlob.text();
          if (errText && errText.trim().length > 0) compErr = errText;
        } catch(_) {}
        window.parent.postMessage({ id: id, stdout: '', stderr: compErr, exitCode: 1 }, '*');
          return;
        }
        window.lastCompiledHash = currentHash;
      }
      window.parent.postMessage({ type: 'status', id: id, status: 'Menjalankan' }, '*');
      var rx = await cheerpjRunMain('Runner', (pakaiTools ? toolsPath + ':/files/' : '/files/') + (cp ? ':' + cp : ''), String(runId));
      var stdout = '', stderr = '';
      try { stdout = await (await cjFileBlob('/files/out' + runId + '.txt')).text(); } catch(_) {}
      try { stderr = await (await cjFileBlob('/files/err' + runId + '.txt')).text(); } catch(_) {}
      window.parent.postMessage({ id: id, stdout: stdout, stderr: stderr, exitCode: rx }, '*');
    } catch (err) {
      window.parent.postMessage({ id: id, stdout: '', stderr: String(err), exitCode: -1, mesinGagal: true }, '*');
    }
  });
})();
</script>
</head><body></body></html>`;
}

function getToolsPath(): string {
  const base = import.meta.env.BASE_URL || '/';
  return ('/app/' + base + 'tools.jar').replace(/\/{2,}/g, '/');
}

function getOrCreateIframe(versi: VersiJava): Promise<HTMLIFrameElement> {
  const ada = iframes.get(versi);
  if (ada && ada.iframe.parentNode) {
    return ada.siap.then(() => ada.iframe);
  }
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  const siap = new Promise<void>((resolve, reject) => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow) return;
      if (e.data?.type === 'cheerpj-ready') {
        window.removeEventListener('message', onMsg);
        resolve();
      } else if (e.data?.type === 'cheerpj-error') {
        window.removeEventListener('message', onMsg);
        iframes.delete(versi);
        reject(new Error(e.data.message || 'CheerpJ gagal diinisialisasi'));
      }
    };
    window.addEventListener('message', onMsg);

    if (versi === 21) console.info('[BisaNgoding] Java 21 (CheerpJ 5).');
    iframe.srcdoc = buildIframeSrcdoc(versi);
  });
  iframes.set(versi, { iframe, siap, jalan: 0 });
  return siap.then(() => iframe);
}

function sendToIframe(iframe: HTMLIFrameElement, message: Record<string, unknown>, onStatus?: (s: string) => void): Promise<RunResult> {
  return new Promise<RunResult>((resolve, reject) => {
    const id = message.id as string;
    pendingCallbacks.set(id, { resolve, reject, onStatus });

    const capturedIframe = iframe;
    const onMsg = (e: MessageEvent) => {
      if (e.source !== capturedIframe?.contentWindow) return;
      const data = e.data;
      if (!data || data.id !== id) return;
      if (data.type === 'status') {
        const cb = pendingCallbacks.get(id);
        if (cb?.onStatus) cb.onStatus(data.status);
        return;
      }
      window.removeEventListener('message', onMsg);
      pendingCallbacks.delete(id);
      resolve({ stdout: data.stdout ?? '', stderr: data.stderr ?? '', exitCode: data.exitCode ?? -1, ...(data.mesinGagal ? { mesinGagal: true } : {}) });
    };
    window.addEventListener('message', onMsg);

    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage(message, '*');
    } else {
      pendingCallbacks.delete(id);
      reject(new Error('Iframe tidak tersedia'));
    }
  });
}

export async function initCheerpJ(_onProgress?: (msg: string) => void, javaVersion?: number): Promise<void> {
  await getOrCreateIframe(versiUntukMateri(javaVersion));
}

export function resetJavaRunner(): void {
  // no-op: we no longer kill iframe on stop
}

/** Buang mesin Java versi ini (iframe CheerpJ). Jalan berikutnya membuat mesin baru dengan memori bersih. */
function buangMesin(versi: VersiJava): void {
  const ada = iframes.get(versi);
  iframes.delete(versi);
  try { ada?.iframe.remove(); } catch { /* sudah hilang */ }
}

async function jalankanSekali(versi: VersiJava, code: string, stdinInput: string, onStatus: ((s: string) => void) | undefined, cp: string): Promise<RunResult> {
  const iframe = await getOrCreateIframe(versi);
  const mesin = iframes.get(versi);
  if (mesin) mesin.jalan++;

  runCounter++;
  const runId = runCounter;
  const msgId = `run-${runId}-${Date.now()}`;

  const runPromise = sendToIframe(iframe, {
    type: 'run',
    id: msgId,
    runId,
    code,
    stdin: stdinInput,
    runnerSource: buildRunnerSource(),
    toolsPath: getToolsPath(),
    cp,
  }, onStatus);

  let pewaktu: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<RunResult>((resolve) => {
    pewaktu = setTimeout(() => {
      pendingCallbacks.delete(msgId);
      resolve({ stdout: '', stderr: '', exitCode: -1, timedOut: true });
    }, cp || versi === 21 ? TIMEOUT_PUSTAKA_MS : TIMEOUT_MS);
  });

  const hasil = await Promise.race([runPromise, timeoutPromise]);
  clearTimeout(pewaktu);
  return hasil;
}

/**
 * Jalankan kode Java. javaVersion diisi dari materi (lesson.javaVersion): 21 berarti Java 21 (CheerpJ 5),
 * selain itu Java 8 (CheerpJ 3) kecuali mode percobaan ?java=21 sedang menyala.
 *
 * Menjaga mesin tetap sehat:
 * - program yang melewati batas waktu masih berjalan di dalam mesin, jadi mesinnya dibuang;
 * - mesin yang rusak (error WebAssembly seperti "memory access out of bounds") dibuang dan program dicoba sekali lagi di mesin baru;
 * - mesin diganti setelah BATAS_JALAN_PER_MESIN kali jalan.
 */
export async function runJavaCode(code: string, stdinInput = '', onStatus?: (s: string) => void, javaVersion?: number): Promise<RunResult> {
  code = rapikanKetikan(code);
  const versi = versiUntukMateri(javaVersion);
  const cp = classpathPustaka(code, import.meta.env.BASE_URL || '/');

  if ((iframes.get(versi)?.jalan ?? 0) >= BATAS_JALAN_PER_MESIN) buangMesin(versi);

  let hasil = await jalankanSekali(versi, code, stdinInput, onStatus, cp);
  if (hasil.timedOut) {
    buangMesin(versi);
    return hasil;
  }
  if (hasil.mesinGagal && apakahMesinRusak(hasil.stderr)) {
    buangMesin(versi);
    onStatus?.('Memuat ulang Java');
    hasil = await jalankanSekali(versi, code, stdinInput, onStatus, cp);
    if (hasil.timedOut) buangMesin(versi);
    else if (hasil.mesinGagal && apakahMesinRusak(hasil.stderr)) {
      buangMesin(versi);
      return { stdout: '', stderr: PESAN_MESIN_RUSAK, exitCode: -1 };
    }
  }
  return hasil;
}
