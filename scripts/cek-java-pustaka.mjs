// Menjalankan kode Java modul 12-18 (memakai library di public/java-lib) di browser dengan CheerpJ,
// lalu membandingkan keluarannya dengan kunci di materi.
import { chromium } from 'playwright';
import fs from 'fs';

const rapi = (t) => (t || '').replace(/\r\n?/g, '\n').split('\n').map((b) => b.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '').replace(/^\n+/, '');
const folder = (process.env.FOLDER || '').split(',').filter(Boolean);
const tugas = [];
for (const f of folder) {
  for (const n of fs.readdirSync(`content/java/${f}`).filter((x) => x.startsWith('lesson-')).sort()) {
    const l = JSON.parse(fs.readFileSync(`content/java/${f}/${n}`, 'utf-8'));
    const awal = tugas.length;
    for (const c of l.cards) {
      if (c.type === 'praktik_java') c.langkah.forEach((s, i) => tugas.push({ asal: `${l.id} praktik ${i + 1}`, kode: s.jawaban, input: s.input || '', harap: s.keluaran }));
      if (c.type === 'runnable') tugas.push({ asal: `${l.id} runnable`, kode: c.code, input: '', baris: c.predict.options[c.predict.answer] });
      if (c.type === 'code_challenge') c.tests.forEach((t, i) => tugas.push({ asal: `${l.id} tantangan ${i + 1}`, kode: c.solution, input: t.input, harap: t.expectedOutput }));
      if (c.type === 'understanding_check') c.questions.forEach((q, i) => { if (q.code) tugas.push({ asal: `${l.id} cek ${i + 1}`, kode: q.code, input: '', ...( /output|keluaran|dicetak|tercetak/i.test(q.question) ? { harap: q.options[q.answer] } : { baris: q.options[q.answer] }) }); });
    }
    for (let k = awal; k < tugas.length; k++) tugas[k].versi = l.javaVersion;
  }
  const qf = `content/java/${f}/quiz.json`;
  if (fs.existsSync(qf)) for (const q of JSON.parse(fs.readFileSync(qf, 'utf-8'))) if (q.code) tugas.push({ asal: q.id, kode: q.code, input: '', ...( /output|keluaran|dicetak|tercetak/i.test(q.question) ? { harap: q.options[q.answer] } : { baris: q.options[q.answer] }) });
}
const saring = process.env.SAJA ? new RegExp(process.env.SAJA) : null;
const daftar = saring ? tugas.filter((t) => saring.test(t.asal)) : tugas;
console.log(`TUGAS: ${daftar.length}`);
const browser = await chromium.launch({ args: ['--js-flags=--max-old-space-size=4096'] });
let page = null;
async function halamanBaru() {
  for (let coba = 0; coba < 3; coba++) {
    try {
      if (page) await page.context().close().catch(() => {});
      page = await (await browser.newContext()).newPage();
      await page.goto('http://localhost:4173/', { waitUntil: 'load' });
      await page.waitForFunction(() => typeof window.runJavaCode === 'function', null, { timeout: 120000 });
      return;
    } catch (e) { console.log(`  halaman baru gagal (${coba + 1}): ${String(e).slice(0, 80)}`); }
  }
  throw new Error('halaman Java tidak bisa dibuka');
}
const temuan = [];
const waktu = [];
let i = 0;
for (const t of daftar) {
  if (i % 12 === 0) await halamanBaru();
  i++;
  let r;
  const mulai = Date.now();
  for (let coba = 0; coba < 2; coba++) {
    try {
      r = await Promise.race([page.evaluate(async ({ kode, input, versi }) => { try { return await window.runJavaCode(kode, input, undefined, versi); } catch (e) { return { stdout: '', stderr: String(e), exitCode: -9 }; } }, t), new Promise((ok) => setTimeout(() => ok({ stdout: '', stderr: 'halaman beku 150 detik', exitCode: -8, timedOut: true }), 150000))]);
      break;
    } catch (e) {
      console.log(`  crash di ${t.asal}, ulang: ${String(e).slice(0, 80)}`);
      await halamanBaru();
      r = { stdout: '', stderr: 'halaman crash: ' + String(e).slice(0, 100), exitCode: -8 };
    }
  }
  waktu.push([Date.now() - mulai, t.asal]);
  const sebelum = temuan.length;
  if (r.timedOut) temuan.push(`${t.asal}: TIMEOUT`);
  else if (r.exitCode !== 0) temuan.push(`${t.asal}: exit ${r.exitCode} ${(r.stderr || '').slice(0, 400)}`);
  else if (t.harap !== undefined && rapi(r.stdout) !== rapi(t.harap)) temuan.push(`${t.asal}: BEDA\n   harap=${JSON.stringify(rapi(t.harap)).slice(0, 600)}\n   dapat=${JSON.stringify(rapi(r.stdout)).slice(0, 600)}`);
  else if (t.baris !== undefined && !rapi(r.stdout).split('\n').map((b) => b.trim()).includes(t.baris.trim())) temuan.push(`${t.asal}: BARIS TIDAK ADA ${JSON.stringify(t.baris)}\n   dapat=${JSON.stringify(rapi(r.stdout)).slice(0, 600)}`);
  console.log(`  ${i}/${daftar.length} ${t.asal} ${Date.now() - mulai}ms${temuan.length > sebelum ? ' TEMUAN ' + temuan[temuan.length - 1].slice(0, 300) : ''}`);
  if (r.timedOut || r.exitCode === -9 || r.exitCode === -8) await halamanBaru();
}
waktu.sort((a, b) => b[0] - a[0]);
console.log('PALING LAMA: ' + waktu.slice(0, 8).map(([m, a]) => `${a} ${m}ms`).join(' | '));
console.log(`\nTEMUAN: ${temuan.length}`);
for (const x of temuan) console.log(' - ' + x);
await browser.close();
process.exit(0);
