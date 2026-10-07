import { describe, it, expect } from 'vitest';
import { nomorModul, getModule, modulesData } from '../lib/content';

describe('nomorModul', () => {
  it('harus memberikan nomor modul 1..N tanpa loncat untuk kelas git', () => {
    expect(nomorModul('git-dasar')).toEqual({ nomor: 1, total: 10 });
    expect(nomorModul('gh-ekosistem')).toEqual({ nomor: 10, total: 10 });
  });

  it('harus memberikan nomor untuk kelas english', () => {
    expect(nomorModul('en-d1')?.nomor).toBe(1);
  });

  it('harus mengembalikan null untuk modul yang tidak ada', () => {
    expect(nomorModul('tidak-ada')).toBeNull();
  });
});
