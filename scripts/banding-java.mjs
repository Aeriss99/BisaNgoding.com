// Menjalankan program Java dari materi di mode 8 dan 21, lalu membandingkan hasilnya.
import { chromium } from 'playwright';
import fs from 'fs';
const progs = JSON.parse(fs.readFileSync('scripts/sampel-java.json', 'utf-8'));
const browser = await chromium.launch();
const hasil = {};
for (const mode of ['8', '21']) {
  const buka = async () => {
    const p = await (await browser.newContext()).newPage();
    await p.goto(`http://localhost:4173/?java=${mode}`, { waitUntil: 'load' });
    await p.waitForFunction(() => typeof window.runJavaCode === 'function');
    return p;
  };
  let page = await buka();
  hasil[mode] = [];
  for (const [i, code] of progs.entries()) {
    let r;
    try {
      r = await page.evaluate(async (c) => { try { return await window.runJavaCode(c, ''); } catch (e) { return { stdout: '', stderr: String(e), exitCode: -9 }; } }, code);
    } catch (e) {
      r = { stdout: '', stderr: 'HALAMAN CRASH: ' + String(e).slice(0, 80), exitCode: -99 };
      console.log(`mode ${mode} program #${i} crash; potongan: ${JSON.stringify(code.slice(0, 160))}`);
      page = await buka();
    }
    hasil[mode].push(r);
  }
}
await browser.close();
let beda = 0;
progs.forEach((c, i) => {
  const a = hasil['8'][i], b = hasil['21'][i];
  if (a.stdout.trim() !== b.stdout.trim() || (a.exitCode === 0) !== (b.exitCode === 0)) {
    beda++;
    console.log(`BEDA #${i}: java8 exit=${a.exitCode} ${JSON.stringify(a.stdout.slice(0, 80))} ${JSON.stringify(a.stderr.slice(0, 120))} | java21 exit=${b.exitCode} ${JSON.stringify(b.stdout.slice(0, 80))} ${JSON.stringify(b.stderr.slice(0, 160))}`);
  }
});
console.log(`${progs.length} program, ${beda} beda; java8 sukses ${hasil['8'].filter(r=>r.exitCode===0).length}, java21 sukses ${hasil['21'].filter(r=>r.exitCode===0).length}`);
