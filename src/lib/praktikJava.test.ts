import { describe, it, expect } from 'vitest';
import { cekWajib, keluaranSama, kodeAwalLangkah, labelLangkahJava, rapikanError, rapikanKeluaran } from './praktikJava';
import type { PraktikJavaCard } from '../types/schema';

describe('praktikJava', () => {
  it('keluaran dianggap sama walau beda akhir baris dan spasi di ujung', () => {
    expect(keluaranSama('Rak 1: 1 2 3 \r\nRak 2\n\n', 'Rak 1: 1 2 3\nRak 2')).toBe(true);
    expect(keluaranSama('Total: 53', 'Total: 8')).toBe(false);
    expect(rapikanKeluaran('a  \nb\n')).toBe('a\nb');
  });

  it('pola wajib tidak terpenuhi oleh komentar', () => {
    const w = [{ pola: '%\\s*3', pesan: 'pakai %' }];
    expect(cekWajib('int s = 25000 % 3;', w)).toBeNull();
    expect(cekWajib('// pakai 25000 % 3\nSystem.out.println(1);', w)).toBe('pakai %');
    expect(cekWajib('/* % 3 */ x', w)).toBe('pakai %');
  });

  it('kode awal melanjutkan jawaban langkah sebelumnya kecuali kodeAwal diisi', () => {
    const card = {
      type: 'praktik_java',
      judul: 'x',
      pembuka: '',
      penutup: '',
      langkah: [
        { arahan: '', jawaban: 'A', keluaran: '1', otomatis: true, petunjuk: '' },
        { arahan: '', jawaban: 'B', keluaran: '2', petunjuk: 'p' },
        { arahan: '', kodeAwal: 'RUSAK', jawaban: 'C', keluaran: '3', petunjuk: 'p', tantangan: true },
      ],
    } as PraktikJavaCard;
    expect(kodeAwalLangkah(card, 1)).toBe('A');
    expect(kodeAwalLangkah(card, 2)).toBe('RUSAK');
    expect(labelLangkahJava(card, 0)).toBe('Contoh dari Lingga');
    expect(labelLangkahJava(card, 1)).toBe('Tugas 1 dari 2');
    expect(labelLangkahJava(card, 2)).toBe('Tantangan · Tugas 2 dari 2');
  });

  it('pesan error dirapikan: path sandbox dan baris Runner dibuang', () => {
    const e = '/str/Main.java:4: error: cannot find symbol\nException\n\tat Runner.main(Runner.java:12)\n\tat java.base/jdk.internal.x';
    expect(rapikanError(e)).toBe('Main.java:4: error: cannot find symbol\nException');
  });
});
