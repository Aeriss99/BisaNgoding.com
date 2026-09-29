// Cek cepat: ada modul "ready" yang file pelajarannya belum ada?
// Membaca SEMUA kelas di content/ yang punya modules.json (java, javascript, english, dst).
// Jalankan dari root project:  node scripts/cek-modul.mjs
import fs from 'fs';

const ALIAS = { 'java-dasar': 'dasar' }; // moduleId di file -> id di modules.json
const canon = (id) => ALIAS[id] ?? id;
let masalah = 0;

const kelas = fs.readdirSync('content').filter((d) => fs.existsSync(`content/${d}/modules.json`));

for (const course of kelas) {
  const dir = `content/${course}`;
  const jumlah = {};
  for (const folder of fs.readdirSync(dir)) {
    const p = `${dir}/${folder}`;
    if (!fs.statSync(p).isDirectory()) continue;
    const files = fs.readdirSync(p).filter((f) => f.startsWith('lesson-'));
    if (files.length === 0) continue;
    const moduleId = JSON.parse(fs.readFileSync(`${p}/${files[0]}`, 'utf8')).moduleId;
    jumlah[canon(moduleId)] = (jumlah[canon(moduleId)] ?? 0) + files.length;
  }

  console.log(`\n== ${course} ==`);
  for (const m of JSON.parse(fs.readFileSync(`${dir}/modules.json`, 'utf8'))) {
    if (m.status !== 'ready') continue;
    const nyata = jumlah[m.id] ?? 0;
    const ok = nyata === m.lessonCount && nyata > 0;
    if (!ok) masalah++;
    console.log(
      `  ${m.id.padEnd(22)} ditulis=${String(m.lessonCount).padStart(3)}  nyata=${String(nyata).padStart(3)}  ${ok ? 'OK' : '<<< MASALAH'}`
    );
  }
}

console.log(masalah === 0 ? '\nSemua modul ready sudah ada isinya.' : `\n${masalah} modul bermasalah.`);
process.exit(masalah === 0 ? 0 : 1);
