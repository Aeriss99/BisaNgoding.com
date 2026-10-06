import fs from 'fs';
import path from 'path';

async function jalankan() {
  if (!process.env.SUPABASE_FUNCTIONS_URL || !process.env.CRON_SECRET) {
    console.log("Variabel environment untuk pengumuman modul tidak ada. Dilewati.");
    process.exit(0);
  }

  const urlSitus = process.env.URL_SITUS || "https://bisangoding.com";
  
  const contentDir = new URL('../content', import.meta.url).pathname;
  const coursesPath = path.join(contentDir, 'courses.json');
  
  if (!fs.existsSync(coursesPath)) {
    console.log("courses.json tidak ditemukan. Dilewati.");
    process.exit(0);
  }
  
  const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
  const readyCourses = new Map();
  
  for (const c of courses) {
    if (c.status === "ready") readyCourses.set(c.id, c.title);
  }

  const modulBaru = [];
  
  const dirs = fs.readdirSync(contentDir);
  for (const d of dirs) {
    const modPath = path.join(contentDir, d, 'modules.json');
    if (fs.existsSync(modPath)) {
      const modules = JSON.parse(fs.readFileSync(modPath, 'utf8'));
      for (const m of modules) {
        if (m.status === "ready" && readyCourses.has(m.courseId)) {
          modulBaru.push({
            id: m.id,
            judul: m.title,
            kelas: readyCourses.get(m.courseId),
            url: `${urlSitus}/#/kelas/${m.courseId}?modul=${m.id}`
          });
        }
      }
    }
  }

  if (modulBaru.length === 0) {
    console.log("Tidak ada modul ready.");
    process.exit(0);
  }

  const payload = { modul: modulBaru };
  
  try {
    const res = await fetch(`${process.env.SUPABASE_FUNCTIONS_URL}/kirim-modul-baru`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      console.warn(`Gagal memanggil kirim-modul-baru: ${res.status}`);
      process.exit(0);
    }
    
    const hasil = await res.json();
    console.log("Hasil pengumuman modul:", hasil);
  } catch (e) {
    console.warn("Gagal menghubungi server:", e.message);
    process.exit(0);
  }
}

jalankan().catch(e => {
  console.warn("Terjadi error tak terduga:", e.message);
  process.exit(0);
});
