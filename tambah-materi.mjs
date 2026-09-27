// Menambah materi ke Modul 1 (Java Dasar):
//  - satu paragraf analogi di kartu teori pertama
//  - satu kartu baru "Kesalahan yang sering terjadi" sebelum kartu cek pemahaman
// Juga merapikan judul kelas di content/courses.json.
//
// Jalankan dari root project:   node tambah-materi.mjs
// Aman dijalankan berkali-kali: bagian yang sudah ada tidak ditambah lagi.

import fs from 'fs';

const DIR = 'content/java/module-01-dasar';
const SISIPAN = 'sisipan-dasar.json';
const PENANDA = '### Kesalahan yang sering terjadi';

if (!fs.existsSync('package.json') || !fs.existsSync(DIR)) {
  console.error('ERROR: jalankan dari folder root project.');
  process.exit(1);
}
if (!fs.existsSync(SISIPAN)) {
  console.error(`ERROR: ${SISIPAN} tidak ada. Taruh di root project, sejajar package.json.`);
  process.exit(1);
}

const sisipan = JSON.parse(fs.readFileSync(SISIPAN, 'utf8'));
let analogiBaru = 0, kartuBaru = 0, dilewati = 0;

for (const file of fs.readdirSync(DIR).filter((f) => f.startsWith('lesson-'))) {
  const path = `${DIR}/${file}`;
  const pel = JSON.parse(fs.readFileSync(path, 'utf8'));
  const data = sisipan[String(pel.order)];
  if (!data) {
    console.warn(`  lewati ${file}: tidak ada sisipan untuk pelajaran ${pel.order}`);
    continue;
  }

  let berubah = false;

  // 1. analogi di kartu teori pertama
  const teori = pel.cards.find((c) => c.type === 'theory');
  if (teori) {
    const kunci = data.analogi.slice(0, 40);
    if (!teori.content.includes(kunci)) {
      teori.content = teori.content.trimEnd() + '\n\n' + data.analogi;
      analogiBaru++;
      berubah = true;
    } else dilewati++;
  }

  // 2. kartu kesalahan umum, tepat sebelum cek pemahaman
  const sudahAda = pel.cards.some(
    (c) => c.type === 'theory' && c.content.includes(PENANDA)
  );
  if (!sudahAda) {
    let posisi = pel.cards.findIndex((c) => c.type === 'understanding_check');
    if (posisi === -1) posisi = Math.max(0, pel.cards.length - 1);
    pel.cards.splice(posisi, 0, { type: 'theory', content: data.kesalahan });
    kartuBaru++;
    berubah = true;
  }

  if (berubah) fs.writeFileSync(path, JSON.stringify(pel, null, 2) + '\n');
}

// 3. judul kelas: buang "Dari Dasar sampai Mahir"
const JUDUL = {
  java: {
    title: 'Belajar Java dari Nol',
    description:
      'Mulai dari menulis baris pertama sampai membuat aplikasi todolist sendiri. Semua latihan dijalankan langsung di browser.',
  },
  javascript: {
    title: 'Belajar JavaScript dari Nol',
    description:
      'Bahasa yang menggerakkan hampir semua website. Mulai dari dasar sampai memahami cara halaman web merespons pengguna.',
  },
};
const kursus = JSON.parse(fs.readFileSync('content/courses.json', 'utf8'));
let judulBerubah = 0;
for (const k of kursus) {
  const baru = JUDUL[k.id];
  if (baru && (k.title !== baru.title || k.description !== baru.description)) {
    k.title = baru.title;
    k.description = baru.description;
    judulBerubah++;
  }
}
if (judulBerubah > 0) {
  fs.writeFileSync('content/courses.json', JSON.stringify(kursus, null, 2) + '\n');
}

console.log(`analogi ditambahkan : ${analogiBaru}`);
console.log(`kartu kesalahan baru: ${kartuBaru}`);
console.log(`sudah ada, dilewati : ${dilewati}`);
console.log(`judul kelas dirapikan: ${judulBerubah}`);
console.log('\nSelanjutnya: npm run build && npm run test:unit');
