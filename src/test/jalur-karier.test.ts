import { describe, it, expect } from 'vitest';
import { cariJalur, dataJalur, formatTahap, pemakaianKelas, statusKartu, jumlahModulTersedia } from '../lib/jalur';
import { coursesData, modulesData } from '../lib/content';

const semuaItem = [...dataJalur.jalur.flatMap((j) => j.tahap.flatMap((t) => t.grup.flat())), ...dataJalur.fondasi];

describe('Data jalur karier (content/jalur-karier.json)', () => {
  it('ada 3 jalur: Backend, Frontend, DevOps, dengan id unik', () => {
    expect(dataJalur.jalur.map((j) => j.id)).toEqual(['backend', 'frontend', 'devops']);
  });

  it('setiap jalur punya tahap, setiap tahap punya minimal satu kelas', () => {
    for (const j of dataJalur.jalur) {
      expect(j.tahap.length).toBeGreaterThan(0);
      for (const t of j.tahap) {
        expect(t.judul && t.deskripsi).toBeTruthy();
        expect(t.grup.flat().length).toBeGreaterThan(0);
      }
    }
  });

  it('semua kelas yang disebut ada di courses.json', () => {
    const id = new Set(coursesData.map((c) => c.id));
    for (const it of semuaItem) expect(id.has(it.kelas), it.kelas).toBe(true);
  });

  it('modul tujuan (kalau ada) terdaftar di kelas itu', () => {
    for (const it of semuaItem.filter((x) => x.modul)) {
      const m = modulesData.find((x) => x.id === it.modul);
      expect(m?.courseId ?? 'java', `${it.kelas}/${it.modul}`).toBe(it.kelas);
    }
  });

  it('Fondasi berisi Git, English, dan Linux', () => {
    expect(dataJalur.fondasi.map((f) => f.kelas)).toEqual(['git', 'english-it', 'linux']);
  });

  it('jalur yang tidak dikenal jatuh ke jalur pertama', () => {
    expect(cariJalur('frontend').id).toBe('frontend');
    expect(cariJalur('ngawur').id).toBe('backend');
    expect(cariJalur(null).id).toBe('backend');
  });
});

describe('statusKartu', () => {
  it('kelas tersedia: hijau, jumlah modul, bisa diklik', () => {
    const n = jumlahModulTersedia('java');
    expect(n).toBeGreaterThan(0);
    expect(statusKartu({ kelas: 'java' })).toEqual({ jenis: 'tersedia', teks: `Tersedia · ${n} modul`, url: '/kelas/java', nama: 'Java', kode: 'J' });
  });

  it('meta dan modul tujuan dipakai kalau ada', () => {
    const n = jumlahModulTersedia('english-it');
    expect(statusKartu({ kelas: 'english-it', meta: '{n} modul · 5 menit sehari' })).toMatchObject({ nama: 'English for IT', teks: `Tersedia · ${n} modul · 5 menit sehari` });
    expect(statusKartu({ kelas: 'git', meta: 'Modul Otomatisasi', modul: 'gh-otomatisasi' })).toMatchObject({
      teks: 'Tersedia · Modul Otomatisasi',
      url: '/kelas/git?modul=gh-otomatisasi',
    });
  });

  it('sebagian tersedia', () => {
    const n = jumlahModulTersedia('javascript');
    expect(statusKartu({ kelas: 'javascript', sebagian: 'DOM segera' })).toMatchObject({ jenis: 'sebagian', teks: `${n} modul · DOM segera` });
  });

  it('Linux lengkap: dasar sampai server, Linux Lanjutan membuka modul Bash', () => {
    const n = jumlahModulTersedia('linux');
    expect(n).toBe(12);
    expect(statusKartu({ kelas: 'linux' })).toMatchObject({ jenis: 'tersedia', teks: 'Tersedia · 12 modul', url: '/kelas/linux' });
    const lanjutan = statusKartu({ kelas: 'linux', nama: 'Linux Lanjutan', modul: 'linux-bash', meta: '4 modul server' });
    expect(lanjutan).toMatchObject({ jenis: 'tersedia', teks: 'Tersedia · 4 modul server', nama: 'Linux Lanjutan', url: '/kelas/linux?modul=linux-bash' });
    const semua = JSON.stringify(dataJalur);
    expect(semua).not.toContain('server segera');
  });

  it('kelas baru: ungu dan membuka halaman rencana; kelas segera: tidak bisa diklik', () => {
    expect(statusKartu({ kelas: 'devops', nama: 'DevOps: Docker' })).toMatchObject({ jenis: 'baru', nama: 'DevOps: Docker' });
    const sb = statusKartu({ kelas: 'spring-boot' });
    expect(sb).toMatchObject({ jenis: 'segera', teks: 'Segera hadir', nama: 'Spring Boot' });
    expect(sb.url).toBeUndefined();
  });
});

describe('formatTahap dan pemakaianKelas', () => {
  it('menulis daftar tahap dengan wajar', () => {
    expect(formatTahap([1])).toBe('tahap 1');
    expect(formatTahap([2, 1])).toBe('tahap 1 dan 2');
    expect(formatTahap([3, 4, 5, 6])).toBe('tahap 3 sampai 6');
    expect(formatTahap([3, 5, 6])).toBe('tahap 3, 5 dan 6');
    expect(formatTahap([])).toBe('');
  });

  it('Linux: Fondasi dulu, lalu jalur dari tahap paling awal', () => {
    expect(pemakaianKelas('linux')).toEqual([
      { judul: 'Fondasi', keterangan: 'semua jalur, bagian Dasar' },
      { judul: 'DevOps Engineer', keterangan: 'tahap 1 dan 2' },
      { judul: 'Backend Developer', keterangan: 'tahap 5' },
    ]);
  });

  it('Java hanya di jalur Backend tahap 1; kelas tak dikenal kosong', () => {
    expect(pemakaianKelas('java')).toEqual([{ judul: 'Backend Developer', keterangan: 'tahap 1' }]);
    expect(pemakaianKelas('tidak-ada')).toEqual([]);
  });
});

describe('Kelas baru punya rencana modul', () => {
  it('DevOps 9 modul', () => {
    const jml = (id: string) => (coursesData.find((c) => c.id === id)?.rencana ?? []).reduce((t, b) => t + b.modul.length, 0);
    expect(jml('devops')).toBe(9);
    for (const c of coursesData.filter((x) => x.baru)) expect(c.status).toBe('soon');
  });
});
