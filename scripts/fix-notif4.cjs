const fs = require('fs');

const aturanFile = 'supabase/functions/_shared/aturan.ts';
let aturan = fs.readFileSync(aturanFile, 'utf8');

// Update templatPengingat
aturan = aturan.replace(
  'const preheader = `Sisihkan 5 menit hari ini supaya streak ${streak} harimu tidak putus.`;\n  const bannerTitle = `Streak ${streak} hari kamu menunggu.`;\n  const bannerDesc = `Sisihkan 5 menit hari ini supaya tidak putus.`;',
  'const preheader = `Pertahankan rutinitas belajar dengan menyelesaikan satu materi hari ini.`;\n  const bannerTitle = `Streak ${streak} hari kamu berlanjut.`;\n  const bannerDesc = `Sisihkan waktu hari ini untuk menjaga streak belajarmu.`;'
);

aturan = aturan.replace(
  'Kami melihat kamu belum belajar hari ini. <b>Jangan sampai kerja kerasmu membangun rutinitas terbuang sia-sia!</b>',
  'Kami melihat kamu belum beraktivitas di platform hari ini. <b>Pertahankan rutinitas belajarmu.</b>'
);

aturan = aturan.replace(
  'return { subjek: `🔥 Streak ${streak} hari kamu berakhir malam ini`, teks, html };',
  'return { subjek: `Pengingat belajar: streak ${streak} hari kamu berakhir hari ini`, teks, html };'
);

aturan = aturan.replace(
  'const teks = `Halo ${namaPanggilan},\\n\\nStreak ${streak} hari kamu menunggu. Sisihkan 5 menit hari ini supaya tidak putus.\\n\\nKami melihat kamu belum belajar hari ini. Jangan sampai kerja kerasmu terbuang sia-sia!\\nLuangkan waktu sedikit saja untuk membuka halaman kelas dan selesaikan satu materi.\\n\\nStreak saat ini: ${streak} hari\\nBatas: hari ini pukul 23.59 WIB\\n\\nLanjutkan belajar: ${urlSitus}\\n\\nBerhenti langganan: ${urlBerhenti}`;',
  'const teks = `Halo ${namaPanggilan},\\n\\nStreak ${streak} hari kamu berlanjut. Sisihkan waktu hari ini untuk menjaga streak belajarmu.\\n\\nKami melihat kamu belum beraktivitas di platform hari ini. Pertahankan rutinitas belajarmu.\\nLuangkan waktu sedikit saja untuk membuka halaman kelas dan selesaikan satu materi.\\n\\nStreak saat ini: ${streak} hari\\nBatas: hari ini pukul 23.59 WIB\\n\\nLanjutkan belajar: ${urlSitus}\\n\\nBerhenti langganan: ${urlBerhenti}`;'
);

// Update templatModulBaru
aturan = aturan.replace(
  'const preheader = `${daftar.length} modul baru siap dipelajari di BisaNgoding.`;\n  const bannerTitle = `Ada materi baru untukmu.`;\n  const bannerDesc = `${daftar.length} modul baru siap dipelajari di BisaNgoding.`;',
  'const preheader = `${daftar.length} modul baru telah tersedia di BisaNgoding.`;\n  const bannerTitle = `Ada materi baru untuk dipelajari.`;\n  const bannerDesc = `${daftar.length} modul baru siap diakses di BisaNgoding.`;'
);

aturan = aturan.replace(
  'Tim kami baru saja merilis pembaruan kurikulum. <b>Sekarang ada materi baru yang bisa kamu pelajari untuk meningkatkan keahlianmu.</b>',
  'Tim kami telah merilis pembaruan kurikulum. <b>Sekarang ada materi baru yang tersedia untuk meningkatkan keahlian pemrograman kamu.</b>'
);

aturan = aturan.replace(
  'const subjekModul = daftar.length > 1 \n    ? `Modul baru tersedia: ${safeDaftar0} dan ${daftar.length - 1} lainnya` \n    : `Modul baru tersedia: ${safeDaftar0}`;',
  'const subjekModul = daftar.length > 1 \n    ? `Modul baru di BisaNgoding: ${safeDaftar0} dan ${daftar.length - 1} lainnya` \n    : `Modul baru di BisaNgoding: ${safeDaftar0}`;'
);

aturan = aturan.replace(
  'const teks = `Halo ${namaPanggilan},\\n\\nAda materi baru untukmu. ${daftar.length} modul baru siap dipelajari di BisaNgoding.\\n\\nSekarang ada materi baru yang bisa kamu pelajari untuk meningkatkan keahlianmu.\\n\\nDaftar modul baru:\\n${textList}\\n\\nLihat modul baru: ${urlSitus}\\n\\nBerhenti langganan: ${urlBerhenti}`;',
  'const teks = `Halo ${namaPanggilan},\\n\\nAda materi baru untuk dipelajari. ${daftar.length} modul baru telah tersedia di BisaNgoding.\\n\\nTim kami telah merilis pembaruan kurikulum. Sekarang ada materi baru yang tersedia untuk meningkatkan keahlian pemrograman kamu.\\n\\nDaftar modul baru:\\n${textList}\\n\\nLihat modul baru: ${urlSitus}\\n\\nBerhenti langganan: ${urlBerhenti}`;'
);

fs.writeFileSync(aturanFile, aturan);

const file1 = 'supabase/functions/kirim-pengingat-streak/index.ts';
let c1 = fs.readFileSync(file1, 'utf8');

c1 = c1.replace(
  '"List-Unsubscribe-Post": "List-Unsubscribe=One-Click"',
  '"List-Unsubscribe-Post": "List-Unsubscribe=One-Click",\n          "Reply-To": gmailUser'
);
c1 = c1.replace('await sleep(200);', 'await sleep(2000);');
fs.writeFileSync(file1, c1);

const file2 = 'supabase/functions/kirim-modul-baru/index.ts';
let c2 = fs.readFileSync(file2, 'utf8');

c2 = c2.replace(
  '"List-Unsubscribe-Post": "List-Unsubscribe=One-Click"',
  '"List-Unsubscribe-Post": "List-Unsubscribe=One-Click",\n          "Reply-To": gmailUser'
);
c2 = c2.replace('await sleep(200);', 'await sleep(2000);');
fs.writeFileSync(file2, c2);

const testFile = 'src/test/notif-email.test.ts';
let t1 = fs.readFileSync(testFile, 'utf8');

t1 = t1.replace(
  "expect(t.subjek).toContain('Streak 5 hari kamu berakhir malam ini');",
  "expect(t.subjek).toContain('Pengingat belajar: streak 5 hari kamu berakhir hari ini');"
);

t1 = t1.replace(
  "expect(t.html).toContain('Streak 5 hari kamu');",
  "expect(t.html).toContain('Streak 5 hari');"
);

t1 = t1.replace(
  "expect(t.subjek).toContain('Modul baru tersedia: Intro');",
  "expect(t.subjek).toContain('Modul baru di BisaNgoding: Intro');"
);

fs.writeFileSync(testFile, t1);

