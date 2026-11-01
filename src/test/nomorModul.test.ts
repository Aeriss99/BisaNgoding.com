import { describe, it, expect } from 'vitest';
import { nomorModul, getModule, modulesData } from '../lib/content';

describe('nomorModul', () => {
  it('harus memberikan nomor modul 1..N tanpa loncat untuk kelas git', () => {
    expect(nomorModul('git-dasar')).toEqual({ nomor: 1, total: 15 });
    expect(nomorModul('gh-ekosistem')).toEqual({ nomor: 10, total: 15 });
    expect(nomorModul('git-tim')).toEqual({ nomor: 13, total: 15 });
    expect(nomorModul('git-akhir')).toEqual({ nomor: 14, total: 15 });
    expect(nomorModul('git-proyek-akhir')).toEqual({ nomor: 15, total: 15 });
  });

  it('harus memberikan nomor untuk kelas english', () => {
    expect(nomorModul('en-d1')?.nomor).toBe(1);
  });

  it('harus mengembalikan null untuk modul yang tidak ada', () => {
    expect(nomorModul('tidak-ada')).toBeNull();
  });
});
