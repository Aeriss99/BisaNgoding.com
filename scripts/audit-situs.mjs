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
    const dir = fs.readdirSync(`${C}/${c.id}`).map((d) => path.join(C, c.id, d)).find((d) => {
      const f = path.join(d, 'lesson-01.json');
      return fs.existsSync(f) && JSON.parse(fs.readFileSync(f, 'utf-8')).moduleId === m.id;
    });
    if (!dir) continue;
    if (fs.existsSync(path.join(dir, 'quiz.json'))) rute.push(`/quiz/${m.id}`);
    for (const n of fs.readdirSync(dir).filter((x) => /^lesson-\d+\.json$/.test(x)).sort()) {
      rute.push(`/lesson/${JSON.parse(fs.readFileSync(path.join(dir, n), 'utf-8')).id}`);
    }
  }
}
console.log('jumlah rute:', rute.length);

const browser = await chromium.launch();
const temuan = [];
async function periksa(page, r, lebar, langkah) {
  const hasil = await page.evaluate((lebar) => {
    const o = {};
    if (document.querySelector('h2.text-red-600')) o.layarError = document.querySelector('pre')?.textContent?.slice(0, 200) || 'ErrorBoundary';
    if (/^\s*404\s*$/m.test(document.body.innerText) && document.querySelector('h1.text-6xl')) o.notFound = true;
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
  for (const [jenis, isi] of Object.entries(hasil)) temuan.push({ rute: r, lebar, langkah, jenis, isi });
}
async function kerja(antrean, lebar) {
  const ctx = await browser.newContext({ viewport: { width: lebar, height: 844 } });
  const page = await ctx.newPage();
  let ruteSekarang = '';
  page.on('pageerror', (e) => temuan.push({ rute: ruteSekarang, lebar, jenis: 'pageerror', isi: String(e).slice(0, 200) }));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/supabase|Failed to load resource|ERR_|net::/i.test(m.text())) temuan.push({ rute: ruteSekarang, lebar, jenis: 'konsol', isi: m.text().slice(0, 200) });
  });
  while (antrean.length) {
    const r = antrean.shift();
    ruteSekarang = r;
    try {
      await page.goto(`${DASAR}#${r}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(700);
      await periksa(page, r, lebar, 0);
      if (r.startsWith('/lesson/')) {
        for (let i = 1; i <= 12; i++) {
          const tombol = page.getByRole('button', { name: /^Lanjut/ }).last();
          if (!(await tombol.count()) || !(await tombol.isEnabled())) break;
          await tombol.click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(250);
          await periksa(page, r, lebar, i);
        }
      }
    } catch (e) {
      temuan.push({ rute: r, lebar, jenis: 'gagal-buka', isi: String(e).slice(0, 150) });
    }
  }
  await ctx.close();
}
for (const lebar of [390, 1280]) {
  const antrean = lebar === 390 ? [...rute] : rute.filter((r) => !r.startsWith('/lesson/'));
  await Promise.all(Array.from({ length: 4 }, () => kerja(antrean, lebar)));
}
await browser.close();
fs.writeFileSync('audit-temuan.json', JSON.stringify(temuan, null, 1));
const per = {};
for (const t of temuan) (per[t.jenis] ??= []).push(t);
for (const [j, xs] of Object.entries(per)) {
  console.log(`\n== ${j}: ${xs.length}`);
  const unik = new Map();
  for (const x of xs) { const k = x.isi.replace(/\d+px/g, 'Npx').slice(0, 120); if (!unik.has(k)) unik.set(k, []); unik.get(k).push(`${x.rute}@${x.lebar}${x.langkah ? '#' + x.langkah : ''}`); }
  for (const [k, rs] of [...unik.entries()].slice(0, 40)) console.log(`  [${rs.length}x] ${k} | contoh: ${rs.slice(0, 3).join(', ')}`);
}
console.log(`\nTOTAL TEMUAN: ${temuan.length}`);
