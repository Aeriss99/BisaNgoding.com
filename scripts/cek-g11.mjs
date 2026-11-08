// Alat uji kelas Excel: buka setiap materi, kerjakan setiap kartu dengan kunci dari JSON, cek error dan lebar layar.
import { chromium } from 'playwright';
import fs from 'fs';

const lessonSemua = [], modul = [], excel = [];
for (const k of fs.readdirSync('content', { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const mf = `content/${k.name}/modules.json`;
  if (fs.existsSync(mf)) for (const m of JSON.parse(fs.readFileSync(mf, 'utf-8'))) modul.push(m.id);
  for (const d of fs.readdirSync(`content/${k.name}`, { withFileTypes: true }).filter((d) => d.isDirectory()))
    for (const n of fs.readdirSync(`content/${k.name}/${d.name}`).filter((x) => /^lesson-\d+\.json$/.test(x)).sort()) {
      const l = JSON.parse(fs.readFileSync(`content/${k.name}/${d.name}/${n}`, 'utf-8'));
      lessonSemua.push(l.id);
      if (k.name === 'excel') excel.push(l);
    }
}
const progres = { completedLessons: lessonSemua, passedChecks: [], moduleStatus: {}, quizScores: Object.fromEntries(modul.map((m) => [m, { score: 100, passed: true }])), xp: 0, streak: 0, lastActiveDate: '2026-11-08', version: 1 };
const hasil = [];
const cek = (nama, ok) => { hasil.push(`${ok ? 'LULUS' : 'GAGAL'}  ${nama}`); };
const browser = await chromium.launch();
for (const [lebar, tinggi] of [[1280, 900], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: lebar, height: tinggi }, reducedMotion: 'reduce' });
  await ctx.addInitScript((v) => { try { if (!localStorage.getItem('bisangoding_progress_lokal')) localStorage.setItem('bisangoding_progress_lokal', v); } catch {} }, JSON.stringify(progres));
  const page = await ctx.newPage();
  const err = [];
  page.on('pageerror', (e) => err.push(String(e)));
  const teks = () => page.locator('main').innerText();
  await page.goto('http://localhost:5173/#/lesson/excel-dasar-01'); await page.waitForTimeout(800);
  const k1 = await teks();
  await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  cek(`${lebar} Enter biasa di teori tidak pindah kartu`, (await teks()) === k1);
  await page.keyboard.press('Control+Enter'); await page.waitForTimeout(300);
  const k2 = await teks();
  cek(`${lebar} Ctrl+Enter di teori pindah ke kartu 2`, k2 !== k1);
  await page.keyboard.press('Meta+Enter'); await page.waitForTimeout(300);
  cek(`${lebar} Cmd+Enter juga pindah ke kartu 3`, (await teks()) !== k2);
  const kbd = page.locator('footer kbd', { hasText: 'Ctrl+Enter' });
  cek(`${lebar} petunjuk Ctrl+Enter ${lebar > 1000 ? 'tampil' : 'tersembunyi'}`, (await kbd.first().isVisible()) === lebar > 1000);
  await page.keyboard.press('Control+Enter'); await page.waitForTimeout(300);
  // kartu 4 = praktik Excel: Lanjut belum aktif, Ctrl+Enter tidak boleh pindah
  const k4 = await teks();
  cek(`${lebar} kartu 4 adalah praktik Excel`, k4.includes('PRAKTIK DI EXCEL') || (await page.locator('#isi-rumus').count()) > 0);
  await page.keyboard.press('Control+Enter'); await page.waitForTimeout(300);
  cek(`${lebar} Ctrl+Enter di praktik yang belum selesai tidak pindah`, (await page.locator('#isi-rumus').count()) > 0);
  const sel = page.getByLabel(/Ketik langsung di sel/);
  await sel.click(); await page.keyboard.type('12'); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  cek(`${lebar} Enter di sel praktik memeriksa jawaban (tetap di praktik)`, (await page.locator('#isi-rumus').count()) > 0 && (await teks()).includes('C2'));
  // quiz
  await page.goto('http://localhost:5173/#/quiz/excel-dasar'); await page.waitForTimeout(1000);
  const q1 = await page.locator('body').innerText();
  await page.keyboard.press('Control+Enter'); await page.waitForTimeout(300);
  cek(`${lebar} quiz: Ctrl+Enter sebelum menjawab tidak pindah`, (await page.locator('body').innerText()) === q1);
  const opsi = page.locator('main button').first();
  await opsi.click(); await page.waitForTimeout(200);
  const q1b = await page.locator('body').innerText();
  await page.keyboard.press('Control+Enter'); await page.waitForTimeout(400);
  cek(`${lebar} quiz: Ctrl+Enter setelah menjawab pindah ke soal 2`, (await page.locator('body').innerText()) !== q1b);
  cek(`${lebar} tanpa error halaman`, err.length === 0);
  if (err.length) hasil.push('   ' + err.join(' | ').slice(0, 300));
  await ctx.close();
}
await browser.close();
for (const h of hasil) console.log('HASIL ' + h);
