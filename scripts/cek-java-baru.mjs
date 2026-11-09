// Menjalankan semua kode Java baru (praktik OOP, Input Output, Todolist OOP) di browser dengan CheerpJ (Java 8),
// membandingkan keluarannya dengan kunci, lalu memotret beberapa materi di layar HP.
import { chromium } from 'playwright';
import fs from 'fs';

const rapi = (t) => (t || '').replace(/\r\n?/g, '\n').split('\n').map((b) => b.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '').replace(/^\n+/, '');
const tugas = [];
const folder = ['module-02-oop', 'module-10-input-output', 'module-11-oop-todolist'];
for (const f of folder) {
  for (const n of fs.readdirSync(`content/java/${f}`).filter((x) => x.startsWith('lesson-')).sort()) {
    const l = JSON.parse(fs.readFileSync(`content/java/${f}/${n}`, 'utf-8'));
    for (const c of l.cards) {
      if (c.type === 'praktik_java') c.langkah.forEach((s, i) => tugas.push({ asal: `${l.id} praktik ${i + 1}`, kode: s.jawaban, input: s.input || '', harap: s.keluaran }));
      if (f === 'module-02-oop') continue;
      if (c.type === 'runnable') tugas.push({ asal: `${l.id} runnable`, kode: c.code, input: '', harap: null });
      if (c.type === 'code_challenge') c.tests.forEach((t, i) => tugas.push({ asal: `${l.id} tantangan ${i + 1}`, kode: c.solution, input: t.input, harap: t.expectedOutput }));
      if (c.type === 'understanding_check') c.questions.forEach((q, i) => { if (q.code && /output/i.test(q.question)) tugas.push({ asal: `${l.id} cek ${i + 1}`, kode: q.code, input: '', harap: q.options[q.answer] }); });
    }
  }
}
for (const h of JSON.parse(fs.readFileSync('scripts/harap-java-baru.json', 'utf-8'))) tugas.push({ asal: h.asal, kode: h.kode, input: '', harap: h.harap });
console.log(`TUGAS: ${tugas.length}`);
const browser = await chromium.launch({ args: ['--js-flags=--max-old-space-size=4096'] });
let page = null;
async function halamanBaru() {
  if (page) await page.context().close().catch(() => {});
  page = await (await browser.newContext()).newPage();
  await page.goto('http://localhost:4173/', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.runJavaCode === 'function', null, { timeout: 120000 });
}
const temuan = [];
let i = 0;
for (const t of tugas) {
  if (i % 15 === 0) await halamanBaru();
  i++;
  let r;
  for (let coba = 0; coba < 2; coba++) {
    try {
      r = await page.evaluate(async ({ kode, input }) => { try { return await window.runJavaCode(kode, input); } catch (e) { return { stdout: '', stderr: String(e), exitCode: -9 }; } }, t);
      break;
    } catch (e) {
      console.log(`  crash di ${t.asal}, ulang: ${String(e).slice(0, 80)}`);
      await halamanBaru();
      r = { stdout: '', stderr: 'halaman crash: ' + String(e).slice(0, 100), exitCode: -8 };
    }
  }
  if (r.exitCode !== 0) temuan.push(`${t.asal}: exit ${r.exitCode} ${(r.stderr || '').slice(0, 300)}`);
  else if (t.harap !== null && rapi(r.stdout) !== rapi(t.harap)) temuan.push(`${t.asal}: BEDA\n   harap=${JSON.stringify(rapi(t.harap)).slice(0, 300)}\n   dapat=${JSON.stringify(rapi(r.stdout)).slice(0, 300)}`);
  if (i % 25 === 0) console.log(`  ${i}/${tugas.length}, temuan ${temuan.length}`);
}
// Tampilan HP
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const hp = await ctx.newPage();
await hp.addInitScript(() => { try { localStorage.setItem('bisangoding_progress_lokal', JSON.stringify({ completedLessons: [], passedChecks: [], moduleStatus: {}, quizScores: {}, xp: 0, streak: 0, lastActiveDate: '2026-11-10', version: 1 })); } catch {} });
hp.on('pageerror', (e) => temuan.push(`pageerror ${String(e).slice(0, 200)}`));
for (const [id, kartu] of [['java-input-output-02', 6], ['java-input-output-03', 7], ['java-oop-todolist-06', 7], ['java-apache-maven-04', 6], ['java-oop-11', 5]]) {
  await hp.goto(`http://localhost:4173/#/lesson/${id}`, { waitUntil: 'domcontentloaded' });
  await hp.waitForTimeout(1500);
  for (let k = 1; k < kartu; k++) {
    const b = hp.getByRole('button', { name: /^(Lanjut|Selesai)/ }).last();
    if (await b.count() && await b.isEnabled()) { await b.click(); await hp.waitForTimeout(250); } else {
      // kartu yang butuh jawaban: lewati dengan tombol Lewati kalau ada
      const lw = hp.getByRole('button', { name: /Lewati/ }).first();
      if (await lw.count()) { await lw.click(); await hp.waitForTimeout(250); }
    }
  }
  await hp.waitForTimeout(2500);
  const w = await hp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (w > 1) temuan.push(`${id}: halaman melebar ${w}px`);
  const buf = await hp.screenshot({ type: 'jpeg', quality: 55, fullPage: true });
  console.log(`===FOTO ${id}===`); console.log(buf.toString('base64')); console.log(`===AKHIR ${id}===`);
}
for (const url of ['/kelas/java']) {
  await hp.goto(`http://localhost:4173/#${url}`, { waitUntil: 'domcontentloaded' });
  await hp.waitForTimeout(1500);
  const buf = await hp.screenshot({ type: 'jpeg', quality: 55, fullPage: true });
  console.log(`===FOTO kelas-java===`); console.log(buf.toString('base64')); console.log(`===AKHIR kelas-java===`);
}
await browser.close();
console.log(`TEMUAN: ${temuan.length}`);
for (const t of temuan) console.log('  ' + t);
