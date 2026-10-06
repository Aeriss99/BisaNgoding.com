import { describe, it, expect } from 'vitest';
import { tanggalJakarta, perluPengingat, modulBaru, templatPengingat, templatModulBaru } from '../../supabase/functions/_shared/aturan';

describe('Notifikasi Email Shared Logic', () => {
  it('tanggalJakarta converts UTC date to Asia/Jakarta correctly', () => {
    // 2026-10-06T17:30:00Z in UTC is 2026-10-07 00:30:00 in Jakarta (WIB is UTC+7)
    const d = new Date('2026-10-06T17:30:00Z');
    expect(tanggalJakarta(d)).toBe('2026-10-07');
  });

  it('perluPengingat identifies correctly when reminder is needed', () => {
    const hariIni = '2026-10-07';
    
    // Kemarin + streak > 0 -> true
    expect(perluPengingat({ streak: 3, lastActiveDate: '2026-10-06' }, hariIni)).toBe(true);
    
    // Hari ini -> false
    expect(perluPengingat({ streak: 3, lastActiveDate: '2026-10-07' }, hariIni)).toBe(false);
    
    // Streak 0 -> false
    expect(perluPengingat({ streak: 0, lastActiveDate: '2026-10-06' }, hariIni)).toBe(false);
    
    // Dua hari lalu -> false
    expect(perluPengingat({ streak: 3, lastActiveDate: '2026-10-05' }, hariIni)).toBe(false);
    
    // Data null -> false
    expect(perluPengingat(null, hariIni)).toBe(false);
  });

  it('modulBaru filters out already announced modules', () => {
    const semua = [
      { id: 'm1' },
      { id: 'm2' },
      { id: 'm3' }
    ];
    const sudah = ['m1', 'm3'];
    const baru = modulBaru(semua, sudah);
    expect(baru).toHaveLength(1);
    expect(baru[0].id).toBe('m2');
  });

  it('templatPengingat generates correct subject and html', () => {
    const t = templatPengingat('Budi', 5, 'https://bisangoding.com', 'https://bisangoding.com/stop');
    expect(t.subjek).toContain('Pengingat belajar: streak 5 hari kamu berakhir hari ini');
    expect(t.teks).toContain('Budi');
    expect(t.teks).toContain('https://bisangoding.com/stop');
    expect(t.html).toContain('Budi');
    expect(t.html).toContain('Streak 5 hari');
    expect(t.html).toContain('https://bisangoding.com/stop');
    expect(t.html).toContain('<table');
    expect(t.html).toContain('#ffd93d');
  });

  it('templatModulBaru generates correct subject and html', () => {
    const daftar = [{ judul: 'Intro', kelas: 'Java', url: 'https://b.c/1' }];
    const t = templatModulBaru('Budi', daftar, 'https://bisangoding.com', 'https://bisangoding.com/stop');
    expect(t.subjek).toContain('Modul baru di BisaNgoding: Intro');
    expect(t.teks).toContain('Budi');
    expect(t.teks).toContain('Intro');
    expect(t.teks).toContain('https://bisangoding.com/stop');
    expect(t.html).toContain('Budi');
    expect(t.html).toContain('Intro');
    expect(t.html).toContain('https://bisangoding.com/stop');
    expect(t.html).toContain('<table');
    expect(t.html).toContain('#ffd93d');
  });
});
