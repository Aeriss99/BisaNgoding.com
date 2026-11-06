// Mencoba Java 8 (bawaan) dan Java 21 (?java=21) di Chromium sungguhan lewat window.runJavaCode.
import { chromium } from 'playwright';

const URL_DASAR = process.env.URL_DASAR || 'http://localhost:4173/';
const PROGRAM = {
  hello: { code: 'public class Main { public static void main(String[] a) { System.out.println("Halo Budi"); } }', stdin: '', harap: 'Halo Budi' },
  scanner: {
    code: 'import java.util.Scanner;\npublic class Main { public static void main(String[] a) { Scanner s = new Scanner(System.in); int x = s.nextInt(); int y = s.nextInt(); System.out.println("Total: " + (x * y)); } }',
    stdin: '15000 3\n', harap: 'Total: 45000',
  },
  java21: {
    code: 'record Produk(String nama, int harga) {}\npublic class Main { public static void main(String[] args) { Object o = new Produk("Kopi", 15000); String s = switch (o) { case Produk p when p.harga() > 10000 -> "Mahal: " + p.nama(); default -> "Lainnya"; }; System.out.println(s); var t = """\n  Teks\n  blok"""; System.out.println(t.lines().count()); } }',
    stdin: '', harap: 'Mahal: Kopi\n2',
  },
  error: { code: 'public class Main { public static void main(String[] a) { int x = "teks"; } }', stdin: '', harap: null },
};

let gagal = 0;
const browser = await chromium.launch();
for (const mode of ['8', '21']) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log(`  [konsol ${mode}] ${m.text().slice(0, 200)}`); });
  await page.goto(`${URL_DASAR}?java=${mode}`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.runJavaCode === 'function');
  console.log(`\n=== MODE JAVA ${mode} ===`);
  for (const [nama, p] of Object.entries(PROGRAM)) {
    for (const putaran of [1, 2]) {
      const mulai = Date.now();
      const r = await page.evaluate(async ({ code, stdin }) => {
        try { return await window.runJavaCode(code, stdin); } catch (e) { return { stdout: '', stderr: String(e), exitCode: -9 }; }
      }, p);
      const detik = ((Date.now() - mulai) / 1000).toFixed(1);
      const out = (r.stdout || '').trim();
      let status;
      if (nama === 'error') status = r.exitCode !== 0 && /incompatible types/.test(r.stderr) ? 'OK' : 'BEDA';
      else if (nama === 'java21' && mode === '8') status = r.exitCode !== 0 ? 'OK (Java 8 memang menolak)' : 'BEDA';
      else status = out === p.harap ? 'OK' : 'BEDA';
      if (status === 'BEDA') gagal++;
      console.log(`${nama} #${putaran} [${detik}s] ${status} exit=${r.exitCode}${r.timedOut ? ' TIMEOUT' : ''} out=${JSON.stringify(out.slice(0, 80))} err=${JSON.stringify((r.stderr || '').slice(0, 160))}`);
    }
  }
  await ctx.close();
}
await browser.close();
console.log(gagal ? `\nADA ${gagal} HASIL BEDA` : '\nSEMUA OK');
process.exit(gagal ? 1 : 0);
