// Alat uji kelas Python: buka setiap materi dengan Python asli (Pyodide), kerjakan setiap kartu dengan kunci dari JSON,
// jalankan blok kode teori, cek error dan lebar layar.
import { chromium } from 'playwright';
import fs from 'fs';

const lessonSemua = [], modul = [], python = [];
for (const k of fs.readdirSync('content', { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const mf = `content/${k.name}/modules.json`;
  if (fs.existsSync(mf)) for (const m of JSON.parse(fs.readFileSync(mf, 'utf-8'))) modul.push(m.id);
  for (const d of fs.readdirSync(`content/${k.name}`, { withFileTypes: true }).filter((d) => d.isDirectory()))
    for (const n of fs.readdirSync(`content/${k.name}/${d.name}`).filter((x) => /^lesson-\d+\.json$/.test(x)).sort()) {
      const l = JSON.parse(fs.readFileSync(`content/${k.name}/${d.name}/${n}`, 'utf-8'));
      lessonSemua.push(l.id);
      if (k.name === 'python') python.push(l);
    }
}
const progres = { completedLessons: lessonSemua, passedChecks: [], moduleStatus: {}, quizScores: Object.fromEntries(modul.map((m) => [m, { score: 100, passed: true }])), xp: 0, streak: 0, lastActiveDate: '2026-11-09', version: 1 };
const FOTO = new Set((process.env.FOTO ?? '').split(',').filter(Boolean));
const SAJA = process.env.SAJA ? new Set(process.env.SAJA.split(',')) : null;
const temuan = [];
let kartuDiperiksa = 0, blokDijalankan = 0;

async function foto(page, nama) {
  const buf = await page.screenshot({ type: 'jpeg', quality: 55, fullPage: true });
  console.log(`===FOTO ${nama}===`);
  console.log(buf.toString('base64'));
  console.log(`===AKHIR ${nama}===`);
}

async function lanjut(page) {
  const t = page.getByRole('button', { name: /^(Lanjut|Selesai)/ }).last();
  if (!(await t.count()) || !(await t.isEnabled())) return false;
  await t.click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(150);
  return true;
}

/** Tunggu sampai kotak input konsol bisa diketik lagi (Python selesai menjalankan baris), atau kartu selesai. */
async function tungguKonsol(page, penutup) {
  for (let n = 0; n < 600; n++) {
    if (await page.getByText(penutup.slice(0, 40), { exact: false }).count()) return 'selesai';
    if (await page.getByText('Python gagal dimuat', { exact: false }).count()) return 'gagal';
    const ro = await page.locator('#ketik-python').getAttribute('readonly').catch(() => 'x');
    if (ro === null) return 'siap';
    await page.waitForTimeout(100);
  }
  return 'macet';
}

async function isiEditor(page, kode) {
  const ed = page.locator('.cm-content').last();
  await ed.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  await page.keyboard.insertText(kode);
}

async function kerjakan(page, c, id, i) {
  if (c.type === 'theory') {
    const tombol = page.getByRole('button', { name: 'Jalankan Kode' });
    const n = await tombol.count();
    for (let j = 0; j < n; j++) {
      await tombol.nth(j).click();
      await page.waitForFunction((k) => {
        const b = [...document.querySelectorAll('button')].filter((x) => /Jalankan Kode|Menjalankan|Memuat/.test(x.textContent || ''))[k];
        return b && /Jalankan Kode/.test(b.textContent || '');
      }, j, { timeout: 120000 });
      blokDijalankan++;
    }
    const teks = await page.locator('body').innerText();
    if (/Traceback|Error:/.test(teks) && n) temuan.push(`${id} kartu ${i + 1}: blok teori menampilkan error`);
  } else if (c.type === 'praktik_python') {
    let s = await tungguKonsol(page, c.penutup);
    if (s !== 'siap' && s !== 'selesai') { temuan.push(`${id} kartu ${i + 1}: konsol ${s}`); return; }
    for (const l of c.langkah.filter((x) => !x.otomatis)) {
      await page.locator('#ketik-python').fill(l.perintah);
      await page.locator('#ketik-python').press('Enter');
      await page.waitForTimeout(100);
      s = await tungguKonsol(page, c.penutup);
      if (s === 'macet' || s === 'gagal') { temuan.push(`${id} kartu ${i + 1}: konsol ${s} setelah "${l.perintah}"`); return; }
    }
    if (!(await page.getByText(c.penutup.slice(0, 40), { exact: false }).count())) temuan.push(`${id} kartu ${i + 1}: penutup praktik tidak tampil`);
  } else if (c.type === 'code_challenge') {
    await isiEditor(page, c.solution);
    await page.getByRole('button', { name: 'Cek Jawaban' }).click();
    await page.waitForFunction(() => /Semua test case berhasil|Gagal|Error pada Test Case|terlalu lama/.test(document.body.innerText), null, { timeout: 120000 });
    if (!(await page.getByText('Semua test case berhasil', { exact: false }).count())) {
      const t = (await page.locator('body').innerText()).match(/(Test Case[\s\S]{0,200}|Error pada[\s\S]{0,200})/)?.[0] ?? '';
      temuan.push(`${id} kartu ${i + 1}: solusi tantangan tidak lulus: ${t.replace(/\s+/g, ' ')}`);
    }
  } else if (c.type === 'predict_output') {
    await page.getByRole('button', { name: c.options[c.answer], exact: true }).first().click();
  } else if (c.type === 'understanding_check') {
    const rapi = (x) => x.replace(/\s+/g, ' ').trim();
    for (let n = 0; n < 8; n++) {
      const teks = rapi(await page.locator('body').innerText());
      const q = c.questions.find((q) => teks.includes(rapi(q.question)) && (!q.code || teks.includes(rapi(q.code))));
      let diklik = false;
      if (q) {
        const b = page.getByRole('button', { name: q.options[q.answer], exact: true }).first();
        if ((await b.count()) && (await b.isEnabled())) { await b.click(); diklik = true; }
      }
      await page.waitForTimeout(80);
      const next = page.getByRole('button', { name: 'Soal Berikutnya' });
      if (await next.count()) { await next.click(); await page.waitForTimeout(80); continue; }
      if (!diklik) break;
      const lagi = page.getByRole('button', { name: 'Coba Soal Lain' });
      if (await lagi.count()) { await lagi.click(); continue; }
      break;
    }
  } else if (c.type === 'fill_blank') {
    for (let j = 0; j < c.answers.length; j++) await page.getByLabel(`Isian ${j + 1}`).fill(c.answers[j].split('|')[0]);
    await page.getByRole('button', { name: 'Cek Jawaban' }).click();
  }
}

const browser = await chromium.launch();
for (const [lebar, tinggi] of [[390, 844], [1280, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: lebar, height: tinggi }, reducedMotion: 'reduce' });
  await ctx.addInitScript((v) => { try { if (!localStorage.getItem('bisangoding_progress_lokal')) localStorage.setItem('bisangoding_progress_lokal', v); } catch {} }, JSON.stringify(progres));
  const page = await ctx.newPage();
  let id = '';
  page.on('pageerror', (e) => temuan.push(`${lebar} ${id}: pageerror ${String(e).slice(0, 160)}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/supabase|Failed to load resource|net::/i.test(m.text())) temuan.push(`${lebar} ${id}: console ${m.text().slice(0, 160)}`); });
  let daftar = lebar === 390 ? python : python.filter((l, i) => i % 5 === 0);
  if (SAJA) daftar = python.filter((l) => SAJA.has(l.id));
  for (const l of daftar) {
    id = l.id;
    await page.goto(`http://localhost:5173/#/lesson/${l.id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    for (let i = 0; i < l.cards.length; i++) {
      if (await page.locator('text=Ups, ada yang salah!').count()) { temuan.push(`${lebar} ${id} kartu ${i + 1}: layar error`); break; }
      const c = l.cards[i];
      await kerjakan(page, c, `${lebar} ${id}`, i).catch((e) => temuan.push(`${lebar} ${id} kartu ${i + 1} (${c.type}): ${String(e).split('\n')[0].slice(0, 140)}`));
      const lebarHalaman = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (lebarHalaman > 1) temuan.push(`${lebar} ${id} kartu ${i + 1} (${c.type}): halaman melebar ${lebarHalaman}px`);
      if (FOTO.has(`${l.id}#${i + 1}@${lebar}`)) await foto(page, `${l.id}-k${i + 1}-${lebar}`);
      kartuDiperiksa++;
      if (!(await lanjut(page))) { temuan.push(`${lebar} ${id} kartu ${i + 1} (${c.type}): tombol Lanjut tidak aktif`); break; }
    }
  }
  for (const url of ['/kelas/python', '/kelas', '/']) {
    id = url;
    await page.goto(`http://localhost:5173/#${url}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    const w = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (w > 1) temuan.push(`${lebar} ${url}: halaman melebar ${w}px`);
    if (FOTO.has(`${url}@${lebar}`)) await foto(page, `${url.replace(/\//g, '_') || 'beranda'}-${lebar}`);
  }
  // Pindah kelas: dari materi Python langsung ke materi Java dan Excel, lalu kembali.
  for (const tujuan of ['python-dasar-01', 'java-dasar-01', 'excel-dasar-01', 'python-koleksi-02']) {
    id = `pindah ${tujuan}`;
    await page.goto(`http://localhost:5173/#/lesson/${tujuan}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    if (await page.locator('text=Ups, ada yang salah!').count()) temuan.push(`${lebar} pindah ke ${tujuan}: layar error`);
  }
  await ctx.close();
}
await browser.close();
console.log(`DIPERIKSA: ${kartuDiperiksa} kartu, ${blokDijalankan} blok kode teori`);
console.log(`TEMUAN: ${temuan.length}`);
for (const t of temuan) console.log('  ' + t);
process.exit(0);
