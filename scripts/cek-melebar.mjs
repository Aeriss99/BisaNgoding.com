// Diagnosa: kenapa materi java-lambda-04 kartu ke-4 melebar di layar 390px.
import { chromium } from 'playwright';
import fs from 'fs';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const lesson = [], modul = [];
for (const k of fs.readdirSync('content', { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const mf = `content/${k.name}/modules.json`;
  if (fs.existsSync(mf)) for (const m of JSON.parse(fs.readFileSync(mf, 'utf-8'))) modul.push(m.id);
  for (const d of fs.readdirSync(`content/${k.name}`, { withFileTypes: true }).filter((d) => d.isDirectory()))
    for (const n of fs.readdirSync(`content/${k.name}/${d.name}`).filter((x) => /^lesson-\d+\.json$/.test(x)))
      lesson.push(JSON.parse(fs.readFileSync(`content/${k.name}/${d.name}/${n}`, 'utf-8')).id);
}
const p = { completedLessons: lesson, passedChecks: [], moduleStatus: {}, quizScores: Object.fromEntries(modul.map((m) => [m, { score: 100, passed: true }])), xp: 0, streak: 0, lastActiveDate: '2026-11-07', version: 1 };
await ctx.addInitScript((v) => { try { localStorage.setItem('bisangoding_progress_lokal', v); } catch {} }, JSON.stringify(p));
const page = await ctx.newPage();
await page.goto('http://localhost:5173/#/lesson/java-lambda-04', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
for (let i = 0; i < 3; i++) { await page.getByRole('button', { name: /^Lanjut/ }).last().click(); await page.waitForTimeout(400); }
const info = await page.evaluate(() => {
  const out = { scrollWidth: document.documentElement.scrollWidth, bodyScroll: document.body.scrollWidth, el: [] };
  for (const el of document.querySelectorAll('*')) {
    const b = el.getBoundingClientRect();
    if (b.right > window.innerWidth + 2 && b.width > 0) {
      const cs = getComputedStyle(el);
      out.el.push(`${el.tagName.toLowerCase()} pos=${cs.position} ox=${cs.overflowX} w=${Math.round(b.width)} right=${Math.round(b.right)} cls="${String(el.className).slice(0, 80)}" teks="${(el.textContent || '').trim().slice(0, 40)}"`);
    }
  }
  return out;
});
console.log(JSON.stringify(info, null, 1).slice(0, 5000));
await page.screenshot({ path: 'melebar.png', fullPage: false });
await browser.close();
