import { chromium } from 'playwright';
import fs from 'fs';
const lib = fs.readdirSync('www/lib').filter((f) => f.endsWith('.jar'));
const cpDari = (awal) => awal ? lib.filter((f) => awal.split(',').some((a) => f.startsWith(a))).map((f) => '/app/lib/' + f).join(':') : '';
const browser = await chromium.launch();
async function jalan(html, berkas) {
  const page = await browser.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log('konsol: ' + m.text().slice(0, 200)); });
  await page.goto('http://localhost:8080/' + html);
  await page.evaluate(() => window.siap);
  for (const b of berkas) {
    const code = fs.readFileSync(b, 'utf8');
    const cp = cpDari(code.split('\n')[0].replace('//cp:', '').trim());
    for (let k = 1; k <= 1; k++) {
      const t = Date.now();
      let r;
      try { r = await Promise.race([page.evaluate(({ code, cp }) => window.jalankan(code, cp), { code, cp }), new Promise((_, j) => setTimeout(() => j(new Error('timeout 30s')), 30000))]); }
      catch (e) { r = { err: String(e) }; }
      console.log(`===== ${html} ${b} jalan ${k} (${Date.now() - t} ms) cp=${cp.split(':').length}\n${JSON.stringify({ exit: r.exit, tahap: r.tahap, msCompile: r.msCompile, msRun: r.msRun })}\nOUT:\n${r.out ?? ''}\nERR:\n${(r.err ?? '').slice(0, 3000)}`);
      if (r.err && String(r.err).startsWith('Error: timeout')) break;
    }
  }
  await page.close();
}
const t = fs.readdirSync('p12').sort().map((f) => 'p12/' + f);
for (let u = 0; u < 2; u++) for (const f of t) { await jalan('index21.html', [f]); }
await browser.close();
