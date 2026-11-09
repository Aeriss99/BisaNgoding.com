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
for (const f of folder.slice(1)) {
  const quiz = JSON.parse(fs.readFileSync(`content/java/${f}/quiz.json`, 'utf-8'));
  for (const q of quiz) if (q.code && /output/i.test(q.question)) tugas.push({ asal: q.id, kode: q.code, input: '', harap: q.options[q.answer] });
}
for (const h of JSON.parse(fs.readFileSync('scripts/harap-java-baru.json', 'utf-8'))) tugas.push({ asal: h.asal, kode: h.kode, input: '', harap: h.harap });
console.log(`TUGAS: ${tugas.length}`);
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
// Tampilan HP: server dev dengan VITE_DEV_BYPASS (port 5173), semua materi baru kartu demi kartu
const semuaId = [];
for (const f of fs.readdirSync('content/java').filter((x) => x.startsWith('module-'))) {
  for (const n of fs.readdirSync(`content/java/${f}`).filter((x) => x.startsWith('lesson-'))) semuaId.push(JSON.parse(fs.readFileSync(`content/java/${f}/${n}`, 'utf-8')).id);
}
const modulJava = JSON.parse(fs.readFileSync('content/java/modules.json', 'utf-8')).map((m) => m.id);
const progres = { completedLessons: semuaId, passedChecks: [], moduleStatus: {}, quizScores: Object.fromEntries(modulJava.map((m) => [m, { score: 100, passed: true }])), xp: 0, streak: 0, lastActiveDate: '2026-11-10', version: 1 };
const FOTO = new Set(['java-input-output-02#6', 'java-input-output-03#7', 'java-input-output-08#4', 'java-oop-todolist-06#7', 'java-oop-todolist-03#4', 'java-apache-maven-04#5', 'java-apache-maven-04#6', 'java-oop-11#5', 'java-input-output-05#9']);
if (page) await page.context().close().catch(() => {});
let hp = null;
let sekarang = '';
async function hpBaru() {
  if (hp) await hp.context().close().catch(() => {});
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await ctx.addInitScript((v) => { try { localStorage.setItem('bisangoding_progress_lokal', v); } catch {} }, JSON.stringify(progres));
  hp = await ctx.newPage();
  pasangPendengar(hp);
}
function pasangPendengar(hp) {
hp.on('pageerror', (e) => temuan.push(`${sekarang}: pageerror ${String(e).slice(0, 200)}`));
hp.on('console', (m) => { if (m.type() === 'error' && !/supabase|Failed to load resource|net::/i.test(m.text())) temuan.push(`${sekarang}: console ${m.text().slice(0, 160)}`); });
}
const daftar = [];
for (const f of ['module-02-oop', 'module-10-input-output', 'module-11-oop-todolist', 'module-12-apache-maven']) {
  for (const n of fs.readdirSync(`content/java/${f}`).filter((x) => x.startsWith('lesson-')).sort()) daftar.push(JSON.parse(fs.readFileSync(`content/java/${f}/${n}`, 'utf-8')));
}
let kartuDilihat = 0, langkahPraktik = 0;
const rapiT = (x) => x.replace(/\s+/g, ' ').trim();
async function tombolLanjut() {
  const t = hp.getByRole('button', { name: /^(Lanjut|Selesai)/ }).last();
  return (await t.count()) && (await t.isEnabled()) ? t : null;
}
async function tungguJava() {
  await hp.waitForTimeout(400);
  await hp.waitForFunction(() => ![...document.querySelectorAll('button')].some((b) => /Menjalankan|Memuat|Mengompilasi/.test(b.textContent || '') && b.disabled), null, { timeout: 180000 });
  await hp.waitForTimeout(200);
}
async function kerjakan(l, c, k) {
  const id = `${l.id} kartu ${k} (${c.type})`;
  if (c.type === 'praktik_java' || c.type === 'praktik_terminal') {
    const java = c.type === 'praktik_java';
    for (let n = 0; n < 40; n++) {
      if (await hp.getByText(rapiT(c.penutup).slice(0, 40), { exact: false }).count()) return;
      const lw = hp.getByRole('button', { name: 'Lewati', exact: true });
      if (await lw.count()) { await lw.first().click().catch(() => {}); await hp.waitForTimeout(400); if (java) await tungguJava(); continue; }
      const sebelum = rapiT(await hp.locator('[role=log]').first().innerText());
      // dua kali salah, lalu Lihat jawabannya, lalu jalankan jawaban
      for (let s = 0; s < 2; s++) {
        if (java) { await hp.getByRole('button', { name: /Jalankan/ }).first().click(); await tungguJava(); }
        else { await hp.locator('#ketik-perintah').fill('perintah-salah-' + s); await hp.locator('#ketik-perintah').press('Enter'); await hp.waitForTimeout(300); }
      }
      const lj = hp.getByRole('button', { name: 'Lihat jawabannya' });
      if (!(await lj.count())) { temuan.push(`${id}: tombol Lihat jawabannya tidak muncul setelah 2 kali salah`); return; }
      await lj.click(); await hp.waitForTimeout(300);
      if (java) { await hp.getByRole('button', { name: /Jalankan/ }).first().click(); await tungguJava(); }
      else { await hp.locator('#ketik-perintah').press('Enter'); await hp.waitForTimeout(600); }
      langkahPraktik++;
      const sesudah = rapiT(await hp.locator('[role=log]').first().innerText());
      if (/Belum tepat|belum sesuai|Keluarannya belum/i.test(sesudah.slice(sebelum.length).slice(-300)) && !(await hp.getByText(rapiT(c.penutup).slice(0, 40), { exact: false }).count())) {
        temuan.push(`${id}: jawaban resmi tidak diterima: ${sesudah.slice(-200)}`); return;
      }
    }
    temuan.push(`${id}: penutup praktik tidak tampil`);
  } else if (c.type === 'code_challenge') {
    const ed = hp.locator('.cm-content').last();
    await ed.click(); await hp.keyboard.press('Control+A'); await hp.keyboard.press('Delete'); await hp.keyboard.insertText(c.solution);
    await hp.getByRole('button', { name: 'Cek Jawaban' }).click();
    await hp.waitForFunction(() => /Semua test case berhasil|Gagal|Error pada Test Case|terlalu lama/.test(document.body.innerText), null, { timeout: 180000 });
    if (!(await hp.getByText('Semua test case berhasil', { exact: false }).count())) {
      const t = (await hp.locator('body').innerText()).match(/(Test Case[\s\S]{0,200}|Error pada[\s\S]{0,200})/)?.[0] ?? '';
      temuan.push(`${id}: solusi tantangan tidak lulus di browser: ${t.replace(/\s+/g, ' ')}`);
    }
  } else if (c.type === 'understanding_check') {
    for (let n = 0; n < 10; n++) {
      if (await tombolLanjut()) return;
      const teks = rapiT(await hp.locator('body').innerText());
      const q = c.questions.find((q) => teks.includes(rapiT(q.question).slice(0, 60)));
      if (q) { const b = hp.getByRole('button', { name: q.options[q.answer], exact: true }).first(); if (await b.count()) await b.click().catch(() => {}); }
      await hp.waitForTimeout(150);
      for (const nama of ['Soal Berikutnya', 'Coba Soal Lain']) { const t = hp.getByRole('button', { name: nama }); if (await t.count()) { await t.first().click().catch(() => {}); break; } }
      await hp.waitForTimeout(150);
    }
  } else if (c.type === 'multiple_choice') {
    if (await tombolLanjut()) return;
    const b = hp.getByRole('button', { name: c.options[c.answer], exact: true }).first();
    if (await b.count()) await b.click().catch(() => {});
  } else if (c.type === 'fill_blank') {
    if (await tombolLanjut()) return;
    for (let j = 0; j < c.answers.length; j++) await hp.getByLabel(`Isian ${j + 1}`).fill(String(c.answers[j]).split('|')[0]).catch(() => {});
    await hp.getByRole('button', { name: 'Cek Jawaban' }).click().catch(() => {});
  }
}
let nomor = 0;
for (const l of daftar) {
  sekarang = l.id;
  if (nomor++ % 5 === 0) await hpBaru();
  try {
    await hp.goto(`http://localhost:5173/#/lesson/${l.id}`, { waitUntil: 'domcontentloaded' });
    await hp.waitForTimeout(800);
    if (!hp.url().includes('/lesson/')) { temuan.push(`${l.id}: dialihkan ke ${hp.url()}`); continue; }
    for (let k = 1; k <= l.cards.length; k++) {
      const c = l.cards[k - 1];
      await hp.waitForTimeout(250);
      if (await hp.locator('text=Ups, ada yang salah!').count()) { temuan.push(`${l.id} kartu ${k}: layar error`); break; }
      await kerjakan(l, c, k).catch((e) => temuan.push(`${l.id} kartu ${k} (${c.type}): ${String(e).split('\n')[0].slice(0, 160)}`));
      const w = await hp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (w > 1) temuan.push(`${l.id} kartu ${k} (${c.type}): halaman melebar ${w}px`);
      kartuDilihat++;
      if (FOTO.has(`${l.id}#${k}`)) {
        await hp.waitForTimeout(800);
        const buf = await hp.screenshot({ type: 'jpeg', quality: 55, fullPage: true });
        console.log(`===FOTO ${l.id}-k${k}===`); console.log(buf.toString('base64')); console.log(`===AKHIR ${l.id}-k${k}===`);
      }
      if (k === l.cards.length) break;
      const t = await tombolLanjut();
      if (!t) { temuan.push(`${l.id} kartu ${k} (${c.type}): tombol Lanjut tidak aktif setelah dikerjakan`); break; }
      await t.click({ timeout: 3000 }).catch(() => {});
    }
  } catch (e) { temuan.push(`${l.id}: ${String(e).split('\n')[0].slice(0, 160)}`); if (/crash|closed/i.test(String(e))) await hpBaru(); }
  if (nomor % 10 === 0) console.log(`  materi ${nomor}/${daftar.length}, temuan ${temuan.length}`);
}
console.log(`LANGKAH PRAKTIK: ${langkahPraktik}`);
console.log(`KARTU DILIHAT: ${kartuDilihat}`);
await browser.close();
console.log(`TEMUAN: ${temuan.length}`);
for (const t of temuan) console.log('  ' + t);
