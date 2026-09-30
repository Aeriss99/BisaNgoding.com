import { describe, it, expect } from 'vitest';
import { cari, indeksPencarian, normalCari } from '../lib/pencarian';
import { hitungNotifikasi, labelTanggal, perbaruiModulDikenal, perbaruiQuizDikenal } from '../lib/notifikasi';

describe('Pencarian menu atas', () => {
  it('indeks berisi kelas, modul, dan materi yang siap', () => {
    const idx = indeksPencarian();
    expect(idx.some((h) => h.jenis === 'kelas' && h.id === 'java')).toBe(true);
    expect(idx.some((h) => h.jenis === 'modul' && h.id === 'generics')).toBe(true);
    expect(idx.some((h) => h.jenis === 'materi')).toBe(true);
    // Kelas yang belum siap tidak ikut
    expect(idx.some((h) => h.jenis === 'kelas' && h.id === 'spring-boot')).toBe(false);
  });

  it('mencari tanpa peduli huruf besar-kecil, semua kata harus ada', () => {
    const h = cari('JAVA generics');
    expect(h.length).toBeGreaterThan(0);
    for (const x of h) expect(normalCari(x.judul)).toContain('generics');
    expect(cari('a')).toEqual([]);
    expect(cari('zzzz tidak ada')).toEqual([]);
  });

  it('judul yang diawali kueri tampil lebih dulu, lalu kelas sebelum modul dan materi', () => {
    const h = cari('kelas java');
    expect(h[0].jenis).toBe('kelas');
    const git = cari('git');
    expect(git[0]).toMatchObject({ jenis: 'kelas', id: 'git', judul: 'Git & GitHub' });
    expect(cari('java', 50).length).toBeLessThanOrEqual(50);
  });

  it('hasil modul membuka halaman kelas dengan modul itu terbuka', () => {
    const m = cari('generics').find((x) => x.jenis === 'modul');
    expect(m?.url).toBe('/kelas/java?modul=generics');
  });

  it('setiap hasil punya url yang benar', () => {
    for (const x of cari('java', 20)) {
      const awal = { kelas: '/kelas/', modul: '/kelas/', materi: '/lesson/' }[x.jenis];
      expect(x.url.startsWith(awal)).toBe(true);
    }
  });
});

describe('Notifikasi lokal', () => {
  const dasar = { streak: 0, jumlahSelesai: 5, hariIni: '2026-09-30', modulBaru: [] };

  it('pengingat streak hanya kalau belum belajar hari ini', () => {
    expect(hitungNotifikasi({ ...dasar, streak: 5, lastActiveDate: '2026-09-29' }).map((n) => n.id)).toEqual(['streak-2026-09-30']);
    expect(hitungNotifikasi({ ...dasar, streak: 5, lastActiveDate: '2026-09-30' })).toEqual([]);
  });

  it('sambutan untuk pengguna yang belum menyelesaikan materi apa pun', () => {
    expect(hitungNotifikasi({ ...dasar, jumlahSelesai: 0 })[0].id).toBe('selamat-datang');
  });

  it('modul baru diurutkan dari yang terbaru', () => {
    const n = hitungNotifikasi({
      ...dasar,
      modulBaru: [
        { id: 'a', judul: 'A', kelasId: 'java', kelasJudul: 'Kelas Java', sejak: '2026-09-20' },
        { id: 'b', judul: 'B', kelasId: 'java', kelasJudul: 'Kelas Java', sejak: '2026-09-29' },
      ],
    });
    expect(n.map((x) => x.id)).toEqual(['modul-baru-b', 'modul-baru-a']);
    expect(n[0].waktu).toBe('Kemarin');
    expect(n[0].url).toBe('/kelas/java?modul=b');
  });

  it('kunjungan pertama tidak membanjiri notifikasi modul baru', () => {
    const awal = perbaruiModulDikenal(null, ['a', 'b'], '2026-09-30');
    expect(awal).toEqual({ a: '', b: '' });
    const lanjut = perbaruiModulDikenal(awal, ['a', 'b', 'c'], '2026-10-01');
    expect(lanjut).toEqual({ a: '', b: '', c: '2026-10-01' });
  });

  it('modul yang terbit bersamaan di satu kelas digabung jadi satu notifikasi', () => {
    const n = hitungNotifikasi({
      ...dasar,
      modulBaru: [
        { id: 'generics', judul: 'Java Generics', kelasId: 'java', kelasJudul: 'Kelas Java', sejak: '2026-09-30' },
        { id: 'lambda', judul: 'Java Lambda', kelasId: 'java', kelasJudul: 'Kelas Java', sejak: '2026-09-30' },
        { id: 'sql', judul: 'SQL Dasar', kelasId: 'mysql', kelasJudul: 'Kelas MySQL', sejak: '2026-09-30' },
      ],
    });
    expect(n).toHaveLength(2);
    expect(n[0].judul).toBe('Modul baru: Java Generics dan Java Lambda');
    expect(n[0].isi).toBe('Dua modul baru di Kelas Java sudah bisa dipelajari.');
    expect(n[1].judul).toBe('Modul baru: SQL Dasar');
    const banyak = hitungNotifikasi({
      ...dasar,
      modulBaru: ['a', 'b', 'c'].map((id) => ({ id, judul: id.toUpperCase(), kelasId: 'git', kelasJudul: 'Kelas Git', sejak: '2026-09-30' })),
    });
    expect(banyak[0]).toMatchObject({ judul: '3 modul baru di Kelas Git', isi: 'Mulai dari A. Semuanya sudah bisa dipelajari.' });
  });

  it('quiz lulus: tampil sekali, progres yang diunduh sekaligus tidak jadi notifikasi', () => {
    const awal = perbaruiQuizDikenal(null, ['oop'], '2026-09-30');
    expect(awal).toEqual({ oop: '' });
    const satu = perbaruiQuizDikenal(awal, ['oop', 'collection'], '2026-10-01');
    expect(satu.collection).toBe('2026-10-01');
    const unduh = perbaruiQuizDikenal({}, ['a', 'b', 'c'], '2026-10-01');
    expect(Object.values(unduh)).toEqual(['', '', '']);
    const n = hitungNotifikasi({ ...dasar, quizLulus: [{ modulId: 'oop', judul: 'Java OOP', kelasId: 'java', sejak: '2026-09-29', adaBerikutnya: true }] });
    expect(n[0]).toMatchObject({ id: 'quiz-lulus-oop', judul: 'Quiz Java OOP lulus', isi: 'Modul berikutnya sudah terbuka.', waktu: 'Kemarin' });
  });

  it('label tanggal', () => {
    expect(labelTanggal('2026-09-30', '2026-09-30')).toBe('Hari ini');
    expect(labelTanggal('2026-09-27', '2026-09-30')).toBe('3 hari lalu');
  });
});
