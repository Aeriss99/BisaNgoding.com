import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Mesin Java (iframe CheerpJ) tiruan: menjawab 'cheerpj-ready' saat dibuat, lalu menjawab setiap perintah 'run'
 * dengan balasan yang disiapkan test. Yang diuji: mesin dibuang dan dibuat ulang saat rusak, macet, atau sudah lama dipakai.
 */
type Balasan = { stdout?: string; stderr?: string; exitCode?: number; mesinGagal?: boolean } | 'diam';

let antrean: Balasan[] = [];
let dibuat = 0;

function pasangMesinTiruan() {
  const asli = document.body.appendChild.bind(document.body);
  vi.spyOn(document.body, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    const hasil = asli(node) as T;
    if (node instanceof HTMLIFrameElement) {
      dibuat++;
      // Isi iframe (pemuat CheerpJ) tidak dimuat di test; jendelanya dipakai apa adanya.
      Object.defineProperty(node, 'srcdoc', { set() {}, get: () => '', configurable: true });
      const jendela = node.contentWindow!;
      const kirim = (data: unknown) => window.dispatchEvent(new MessageEvent('message', { data, source: jendela }));
      vi.spyOn(jendela, 'postMessage').mockImplementation(((pesan: { id: string }) => {
        const b = antrean.shift() ?? { stdout: 'ok', exitCode: 0 };
        if (b !== 'diam') setTimeout(() => kirim({ id: pesan.id, stdout: '', stderr: '', exitCode: 0, ...b }), 0);
      }) as never);
      setTimeout(() => kirim({ type: 'cheerpj-ready' }), 0);
    }
    return hasil;
  });
}

async function muat() {
  vi.resetModules();
  return import('../lib/javaRunner');
}

describe('mesin Java pulih sendiri', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
    antrean = [];
    dibuat = 0;
    pasangMesinTiruan();
  });

  it('mengenali error mesin WebAssembly, bukan error program Java', async () => {
    const { apakahMesinRusak } = await muat();
    expect(apakahMesinRusak('RuntimeError: memory access out of bounds')).toBe(true);
    expect(apakahMesinRusak('RangeError: Maximum call stack size exceeded')).toBe(true);
    expect(apakahMesinRusak('Exception in thread "main" java.lang.ArrayIndexOutOfBoundsException: 5')).toBe(false);
    expect(apakahMesinRusak('Main.java:3: error: \';\' expected')).toBe(false);
  });

  it('mesin rusak dibuang, lalu program dijalankan ulang di mesin baru', async () => {
    const { runJavaCode } = await muat();
    antrean = [{ stderr: 'RuntimeError: memory access out of bounds', exitCode: -1, mesinGagal: true }, { stdout: 'Halo', exitCode: 0 }];
    const status: string[] = [];
    const r = await runJavaCode('class Main {}', '', (s) => status.push(s));
    expect(r.stdout).toBe('Halo');
    expect(r.exitCode).toBe(0);
    expect(dibuat).toBe(2);
    expect(document.querySelectorAll('iframe').length).toBe(1);
    expect(status).toContain('Memuat ulang Java');
  });

  it('rusak dua kali berturut-turut: pesan yang bisa dipahami, dan mesin berikutnya tetap baru', async () => {
    const { runJavaCode, PESAN_MESIN_RUSAK } = await muat();
    const rusak: Balasan = { stderr: 'RuntimeError: memory access out of bounds', exitCode: -1, mesinGagal: true };
    antrean = [rusak, rusak, { stdout: 'Pulih', exitCode: 0 }];
    const r = await runJavaCode('class Main {}');
    expect(r.stderr).toBe(PESAN_MESIN_RUSAK);
    expect(r.stderr).not.toMatch(/RuntimeError/);
    expect(document.querySelectorAll('iframe').length).toBe(0);
    expect((await runJavaCode('class Main {}')).stdout).toBe('Pulih');
    expect(dibuat).toBe(3);
  });

  it('error program Java biasa tidak membuang mesin', async () => {
    const { runJavaCode } = await muat();
    antrean = [{ stderr: 'Exception in thread "main" java.lang.ArithmeticException: / by zero', exitCode: 1 }, { stdout: 'ok', exitCode: 0 }];
    expect((await runJavaCode('class Main {}')).exitCode).toBe(1);
    await runJavaCode('class Main {}');
    expect(dibuat).toBe(1);
  });

  it('program yang melewati batas waktu: mesinnya dibuang supaya tidak terus berjalan', async () => {
    const { runJavaCode } = await muat();
    vi.useFakeTimers();
    antrean = ['diam', { stdout: 'ok', exitCode: 0 }];
    const p = runJavaCode('class Main {}');
    await vi.advanceTimersByTimeAsync(21_000);
    expect((await p).timedOut).toBe(true);
    expect(document.querySelectorAll('iframe').length).toBe(0);
    const q = runJavaCode('class Main {}');
    await vi.advanceTimersByTimeAsync(100);
    expect((await q).stdout).toBe('ok');
    expect(dibuat).toBe(2);
  });

  it('mesin diganti setelah batas jumlah jalan', async () => {
    const { runJavaCode, BATAS_JALAN_PER_MESIN } = await muat();
    for (let i = 0; i < BATAS_JALAN_PER_MESIN; i++) await runJavaCode('class Main {}');
    expect(dibuat).toBe(1);
    await runJavaCode('class Main {}');
    expect(dibuat).toBe(2);
    expect(document.querySelectorAll('iframe').length).toBe(1);
  });
});
