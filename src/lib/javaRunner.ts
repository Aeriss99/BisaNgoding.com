export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut?: boolean;
}

const CHEERPJ_CDN = 'https://cjrtnc.leaningtech.com/3.0/cj3loader.js';
const TIMEOUT_MS = 20_000;

let hiddenIframe: HTMLIFrameElement | null = null;
let iframeReadyPromise: Promise<void> | null = null;
let runCounter = 0;

interface PendingCallback {
  resolve: (r: RunResult) => void;
  reject: (e: Error) => void;
}
const pendingCallbacks = new Map<string, PendingCallback>();

function buildRunnerSource(runId: number): string {
  const outFile = `/files/out${runId}.txt`;
  const errFile = `/files/err${runId}.txt`;
  return [
    'import java.io.*;',
    'public class Runner {',
    '  public static void main(String[] a) throws Exception {',
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
    `      FileOutputStream fo = new FileOutputStream("${outFile}");`,
    '      fo.write(ob.toByteArray()); fo.close();',
    `      FileOutputStream fe = new FileOutputStream("${errFile}");`,
    '      fe.write(eb.toByteArray()); fe.close();',
    '    } catch (Exception ex) {}',
    '    System.exit(code);',
    '  }',
    '}',
  ].join('\n');
}

function buildIframeSrcdoc(baseUrl: string, toolsPath: string): string {
  return `<!doctype html>
<html><head>
<base href="${baseUrl}" />
<script src="${CHEERPJ_CDN}"></script>
<script>
(async function() {
  try {
    await cheerpjInit({ status: 'none' });
    window.parent.postMessage({ type: 'cheerpj-ready' }, '*');
  } catch (e) {
    window.parent.postMessage({ type: 'cheerpj-error', message: String(e) }, '*');
    return;
  }

  window.addEventListener('message', async function(ev) {
    var d = ev.data;
    if (!d || d.type !== 'run') return;
    var id = d.id, runId = d.runId, enc = new TextEncoder();
    cheerpOSAddStringFile('/str/Main.java', enc.encode(d.code));
    cheerpOSAddStringFile('/str/Runner.java', enc.encode(d.runnerSource));
    cheerpOSAddStringFile('/str/stdin.txt', enc.encode(d.stdin || ''));
    try {
      try { await cjFileBlob('${toolsPath}'); } catch(e) {
        window.parent.postMessage({ id: id, stdout: '', stderr: 'File compiler tidak ditemukan di ${toolsPath}', exitCode: 1 }, '*');
        return;
      }

      var cx = await cheerpjRunMain(
        'com.sun.tools.javac.Main', '${toolsPath}',
        '-Xstdout', '/files/javac' + runId + '.txt',
        '/str/Main.java', '/str/Runner.java', '-d', '/files/'
      );
      if (cx !== 0) {
        var compErr = 'Kompilasi gagal.';
        try { compErr = await (await cjFileBlob('/files/javac' + runId + '.txt')).text(); } catch(_) {}
        window.parent.postMessage({ id: id, stdout: '', stderr: compErr, exitCode: 1 }, '*');
        return;
      }
      var rx = await cheerpjRunMain('Runner', '${toolsPath}:/files/');
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
    
    const base = import.meta.env.BASE_URL;
    const rawPath = '/app' + base + 'tools.jar';
    const toolsPath = rawPath.replace(/\/\//g, '/');
    iframe.srcdoc = buildIframeSrcdoc(base, toolsPath);
  });
  return iframeReadyPromise;
}

function sendToIframe(message: Record<string, unknown>): Promise<RunResult> {
  return new Promise<RunResult>((resolve, reject) => {
    const id = message.id as string;
    pendingCallbacks.set(id, { resolve, reject });

    const capturedIframe = hiddenIframe;
    const onMsg = (e: MessageEvent) => {
      if (e.source !== capturedIframe?.contentWindow) return;
      const data = e.data;
      if (!data || data.id !== id) return;
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

export async function runJavaCode(code: string, stdinInput = ''): Promise<RunResult> {
  await getOrCreateIframe();

  runCounter++;
  const runId = runCounter;
  const msgId = `run-${runId}-${Date.now()}`;
  const runnerSource = buildRunnerSource(runId);

  const runPromise = sendToIframe({
    type: 'run',
    id: msgId,
    runId,
    code,
    stdin: stdinInput,
    runnerSource,
  });

  const timeoutPromise = new Promise<RunResult>((resolve) => {
    setTimeout(() => {
      pendingCallbacks.delete(msgId);
      resolve({ stdout: '', stderr: '', exitCode: -1, timedOut: true });
    }, TIMEOUT_MS);
  });

  return Promise.race([runPromise, timeoutPromise]);
}
