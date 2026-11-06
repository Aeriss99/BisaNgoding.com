// Audit situs di Chromium sungguhan: semua halaman utama, kelas, modul, quiz, dan materi (kartu teori dilewati
// dengan tombol Lanjut). Mencatat error konsol/halaman, layar error, 404, dan konten melebar di lebar HP 390px.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const DASAR = process.env.URL_DASAR || 'http://localhost:5173/';
const C = 'content';
const courses = JSON.parse(fs.readFileSync(`${C}/courses.json`, 'utf-8')).filter((c) => c.status !== 'soon');
const rute = ['/', '/kelas', '/jalur', '/profile', '/progres', '/latihan-ulang', '/sertifikat', '/notifikasi', '/cek-sertifikat'];
for (const c of courses) {
  rute.push(`/kelas/${c.id}`);
  const mf = `${C}/${c.id}/modules.json`;
  if (!fs.existsSync(mf)) continue;
  for (const m of JSON.parse(fs.readFileSync(mf, 'utf-8'))) {
    if (m.status === 'soon') continue;
    rute.push(`/module/${m.id}`);
    const dirs = fs.readdirSync(`${C}/${c.id}`).map((d) => path.join(C, c.id, d)).filter((d) => {
      const f = path.join(d, 'lesson-01.json');
      return fs.existsSync(f) && JSON.parse(fs.readFileSync(f, 'utf-8')).moduleId === m.id;
    });
    let adaQuiz = false;
    for (const dir of dirs) {
      if (fs.existsSync(path.join(dir, 'quiz.json'))) adaQuiz = true;
      for (const n of fs.readdirSync(dir).filter((x) => /^lesson-\d+\.json$/.test(x)).sort()) {
        rute.push(`/lesson/${JSON.parse(fs.readFileSync(path.join(dir, n), 'utf-8')).id}`);
      }
    }
    if (adaQuiz) rute.push(`/quiz/${m.id}`);
  }
}
console.log('jumlah rute:', rute.length);
// Progres palsu: semua materi selesai dan semua quiz lulus, supaya semua modul terbuka.
const semuaLesson = rute.filter((r) => r.startsWith('/lesson/')).map((r) => r.slice(8));
const semuaModul = rute.filter((r) => r.startsWith('/module/')).map((r) => r.slice(8));
const progresPalsu = {
  completedLessons: semuaLesson, passedChecks: [], moduleStatus: {},
  quizScores: Object.fromEntries(semuaModul.map((m) => [m, { score: 100, passed: true }])),
  xp: 0, streak: 0, lastActiveDate: new Date().toISOString().slice(0, 10), version: 1,
};

const temuan = [];
const statistik = { halaman: 0, lanjut: 0 };
async function periksa(page, r, lebar, langkah) {
  const hasil = await page.evaluate((lebar) => {
    const o = {};
    if (document.querySelector('h2.text-red-600')) o.layarError = document.querySelector('pre')?.textContent?.slice(0, 200) || 'ErrorBoundary';
    if (/^\s*404\s*$/m.test(document.body.innerText) && document.querySelector('h1.text-6xl')) o.notFound = true;
    o._hash = location.hash;
    o._teks = document.body.innerText.length;
    // Elemen yang keluar dari layar dan tidak berada di dalam kotak yang bisa digeser (overflow auto/scroll)
    for (const el of document.querySelectorAll('main *, body > div *')) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.right <= window.innerWidth + 2 || getComputedStyle(el).position === 'fixed') continue;
      let p = el.parentElement, geser = false;
      while (p && p !== document.body) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll') { geser = true; break; }
        p = p.parentElement;
      }
      if (!geser) { o.keluarLayar = `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} "${(el.textContent || '').trim().slice(0, 50)}" right=${Math.round(b.right)}`; break; }
    }
    if (document.documentElement.scrollWidth > window.innerWidth + 2) {
      let lebarMaks = null;
      for (const el of document.querySelectorAll('body *')) {
        const b = el.getBoundingClientRect();
        if (b.right > window.innerWidth + 2 && b.width > 0 && getComputedStyle(el).position !== 'fixed') {
          lebarMaks = `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} "${(el.textContent || '').trim().slice(0, 60)}" right=${Math.round(b.right)}`;
          break;
        }
      }
      o.melebar = `${document.documentElement.scrollWidth}px > ${window.innerWidth}px: ${lebarMaks}`;
    }
    return o;
  }, lebar);
  const { _hash, _teks, ...sisa } = hasil;
  statistik.halaman++;
  if (_hash !== `#${r}` && langkah === 0) temuan.push({ rute: r, lebar, langkah, jenis: 'dialihkan', isi: `ke ${_hash}` });
  if (_teks < 150) temuan.push({ rute: r, lebar, langkah, jenis: 'isi-sedikit', isi: `${_teks} huruf` });
  for (const [jenis, isi] of Object.entries(sisa)) temuan.push({ rute: r, lebar, langkah, jenis, isi });
}
async function kerja(antrean, lebar) {
  let browser = await chromium.launch();
  let ctx, page;
  let ruteSekarang = '';
  const siapkan = async () => {
  ctx = await browser.newContext({ viewport: { width: lebar, height: 844 } });
  await ctx.addInitScript((p) => {
    try { if (!localStorage.getItem('bisangoding_progress_lokal')) localStorage.setItem('bisangoding_progress_lokal', p); } catch {}
  }, JSON.stringify(progresPalsu));
  page = await ctx.newPage();
  page.on('pageerror', (e) => temuan.push({ rute: ruteSekarang, lebar, jenis: 'pageerror', isi: String(e).slice(0, 200) }));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/supabase|Failed to load resource|ERR_|net::/i.test(m.text())) temuan.push({ rute: ruteSekarang, lebar, jenis: 'konsol', isi: m.text().slice(0, 200) });
  });
  };
  await siapkan();
  while (antrean.length) {
    const r = antrean.shift();
    ruteSekarang = r;
    try {
      await page.goto('about:blank');
      await page.goto(`${DASAR}#${r}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(700);
      await periksa(page, r, lebar, 0);
      if (r.startsWith('/lesson/')) {
        for (let i = 1; i <= 12; i++) {
          const tombol = page.getByRole('button', { name: /^Lanjut/ }).last();
          if (!(await tombol.count()) || !(await tombol.isEnabled())) break;
          await tombol.click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(250);
          statistik.lanjut++;
          await periksa(page, r, lebar, i);
        }
      }
    } catch (e) {
      temuan.push({ rute: r, lebar, jenis: 'gagal-buka', isi: String(e).slice(0, 150) });
      if (!browser.isConnected() || page.isClosed()) {
        try { await browser.close(); } catch {}
        browser = await chromium.launch();
        await siapkan();
      }
    }
  }
  await browser.close();
}
for (const lebar of [390, 1280]) {
  const antrean = lebar === 390 ? [...rute] : rute.filter((r) => !r.startsWith('/lesson/') && !r.startsWith('/module/'));
  await Promise.all(Array.from({ length: 3 }, () => kerja(antrean, lebar)));
}
fs.writeFileSync('audit-temuan.json', JSON.stringify(temuan, null, 1));
const per = {};
for (const t of temuan) (per[t.jenis] ??= []).push(t);
for (let [j, xs] of Object.entries(per)) {
  console.log(`\n== ${j}: ${xs.length}`);
  if (j === 'dialihkan') { const lain = xs.filter((x) => !x.rute.startsWith('/module/')); console.log(`  (module -> kelas?modul= itu disengaja; selain itu: ${lain.length})`); xs = lain; }
  const unik = new Map();
  for (const x of xs) { const k = x.isi.replace(/\d+px/g, 'Npx').slice(0, 120); if (!unik.has(k)) unik.set(k, []); unik.get(k).push(`${x.rute}@${x.lebar}${x.langkah ? '#' + x.langkah : ''}`); }
  for (const [k, rs] of [...unik.entries()].slice(0, 40)) console.log(`  [${rs.length}x] ${k} | contoh: ${rs.slice(0, j === 'layarError' || j === 'pageerror' ? 40 : 4).join(', ')}`);
}
console.log(`\nDIPERIKSA: ${statistik.halaman} tampilan, tombol Lanjut diklik ${statistik.lanjut} kali`);
console.log(`TOTAL TEMUAN: ${temuan.length}`);
