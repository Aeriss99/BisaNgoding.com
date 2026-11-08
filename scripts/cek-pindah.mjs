// Cek G9: pindah antar materi TANPA muat ulang (seperti tombol back/forward), setelah maju beberapa kartu.
import { chromium } from 'playwright';
import fs from 'fs';
const lesson = [], modul = [];
for (const k of fs.readdirSync('content', { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'english')) {
  const mf = `content/${k.name}/modules.json`;
  if (fs.existsSync(mf)) for (const m of JSON.parse(fs.readFileSync(mf, 'utf-8'))) modul.push(m.id);
  for (const d of fs.readdirSync(`content/${k.name}`, { withFileTypes: true }).filter((d) => d.isDirectory()))
    for (const n of fs.readdirSync(`content/${k.name}/${d.name}`).filter((x) => /^lesson-\d+\.json$/.test(x)))
      lesson.push(JSON.parse(fs.readFileSync(`content/${k.name}/${d.name}/${n}`, 'utf-8')).id);
}
const p = { completedLessons: lesson, passedChecks: [], moduleStatus: {}, quizScores: Object.fromEntries(modul.map((m) => [m, { score: 100, passed: true }])), xp: 0, streak: 0, lastActiveDate: '2026-11-08', version: 1 };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript((v) => { try { if (!localStorage.getItem('bisangoding_progress_lokal')) localStorage.setItem('bisangoding_progress_lokal', v); } catch {} }, JSON.stringify(p));
const page = await ctx.newPage();
let error = 0, diperiksa = 0;
const urut = lesson.filter((id) => /^(git-|gh-|linux-)/.test(id)).slice(0, 150);
for (const id of urut) {
  await page.goto(`http://localhost:5173/#/lesson/${id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  if (await page.locator('text=Ups, ada yang salah!').count()) { error++; console.log('LAYAR ERROR di', id); }
  for (let i = 0; i < 12; i++) {
    const t = page.getByRole('button', { name: /^Lanjut/ }).last();
    if (!(await t.count()) || !(await t.isEnabled())) break;
    await t.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(150);
  }
  diperiksa++;
}
console.log(`${diperiksa} materi berurutan tanpa muat ulang, layar error: ${error}`);
await browser.close();
process.exit(error ? 1 : 0);
