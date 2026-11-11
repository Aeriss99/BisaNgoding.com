import { rapikanKetikan } from './ketikan';
import { classpathPustaka } from './javaPustaka';

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut?: boolean;
}

const CHEERPJ_CDN = 'https://cjrtnc.leaningtech.com/3.0/cj3loader.js';
// Mode percobaan Java 21: CheerpJ 5 membawa JDK lengkap (termasuk javac), jadi tidak memakai tools.jar.
const CHEERPJ5_CDN = 'https://cjrtnc.leaningtech.com/5.0/loader.js';
const TIMEOUT_MS = 20_000;
// Kode yang memakai library (JUnit, Mockito, Jackson, dan lainnya): pemuatan pertama library bisa makan waktu.
const TIMEOUT_PUSTAKA_MS = 90_000;
const KUNCI_MODE = 'bn_java_versi';

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

let hiddenIframe: HTMLIFrameElement | null = null;
let iframeReadyPromise: Promise<void> | null = null;
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
      window.parent.postMessage({ id: id, stdout: '', stderr: String(err), exitCode: -1 }, '*');
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

function getOrCreateIframe(): Promise<void> {
  if (hiddenIframe && hiddenIframe.parentNode && iframeReadyPromise) {
    return iframeReadyPromise;
  }
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  hiddenIframe = iframe;

  iframeReadyPromise = new Promise<void>((resolve, reject) => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow) return;
      if (e.data?.type === 'cheerpj-ready') {
        window.removeEventListener('message', onMsg);
        resolve();
      } else if (e.data?.type === 'cheerpj-error') {
        window.removeEventListener('message', onMsg);
        reject(new Error(e.data.message || 'CheerpJ gagal diinisialisasi'));
      }
    };
    window.addEventListener('message', onMsg);
    
    const versi = versiJava();
    if (versi === 21) console.info('[BisaNgoding] Mode percobaan Java 21 (CheerpJ 5). Kembali ke Java 8: tambahkan ?java=8');
    iframe.srcdoc = buildIframeSrcdoc(versi);
  });
  return iframeReadyPromise;
}

function sendToIframe(message: Record<string, unknown>, onStatus?: (s: string) => void): Promise<RunResult> {
  return new Promise<RunResult>((resolve, reject) => {
    const id = message.id as string;
    pendingCallbacks.set(id, { resolve, reject, onStatus });

    const capturedIframe = hiddenIframe;
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
      resolve({ stdout: data.stdout ?? '', stderr: data.stderr ?? '', exitCode: data.exitCode ?? -1 });
    };
    window.addEventListener('message', onMsg);

    if (hiddenIframe?.contentWindow) {
      hiddenIframe.contentWindow.postMessage(message, '*');
    } else {
      pendingCallbacks.delete(id);
      reject(new Error('Iframe tidak tersedia'));
    }
  });
}

export async function initCheerpJ(_onProgress?: (msg: string) => void): Promise<void> {
  await getOrCreateIframe();
}

export function resetJavaRunner(): void {
  // no-op: we no longer kill iframe on stop
}

export async function runJavaCode(code: string, stdinInput = '', onStatus?: (s: string) => void): Promise<RunResult> {
  code = rapikanKetikan(code);
  await getOrCreateIframe();

  runCounter++;
  const runId = runCounter;
  const msgId = `run-${runId}-${Date.now()}`;
  const runnerSource = buildRunnerSource();
  const cp = classpathPustaka(code, import.meta.env.BASE_URL || '/');

  const runPromise = sendToIframe({
    type: 'run',
    id: msgId,
    runId,
    code,
    stdin: stdinInput,
    runnerSource,
    toolsPath: getToolsPath(),
    cp,
  }, onStatus);

  const timeoutPromise = new Promise<RunResult>((resolve) => {
    setTimeout(() => {
      pendingCallbacks.delete(msgId);
      resolve({ stdout: '', stderr: '', exitCode: -1, timedOut: true });
    }, cp ? TIMEOUT_PUSTAKA_MS : TIMEOUT_MS);
  });

  return Promise.race([runPromise, timeoutPromise]);
}
