import { describe, it, expect } from 'vitest';
import { cekUbin, normalisasi, cekKetik, mulaiLatihan, setelahJawab, progres, sudahSelesai } from './latihan';

describe('cekUbin', () => {
  it('ignores case and whitespace', () => {
    expect(cekUbin(['saya', 'menemukan', 'bug'], [['Saya', 'menemukan', 'bug']])).toBe(true);
    expect(cekUbin(['  saya  ', 'menemukan', 'bug'], [['Saya', 'menemukan', 'bug']])).toBe(true);
  });

  it('fails on wrong order or wrong words', () => {
    expect(cekUbin(['menemukan', 'saya', 'bug'], [['Saya', 'menemukan', 'bug']])).toBe(false);
    expect(cekUbin(['saya', 'menemukan', 'error'], [['Saya', 'menemukan', 'bug']])).toBe(false);
  });
});

describe('normalisasi', () => {
  it('normalizes spaces and punctuation', () => {
    expect(normalisasi('  Thanks!  ')).toBe('thanks');
    expect(normalisasi('Don’t do that.')).toBe("don't do that");
    expect(normalisasi('A   B  C?!.')).toBe('a b c');
  });
});

describe('cekKetik', () => {
  it('identifies exact, close, and wrong answers', () => {
    const answers = ['servernya mati'];
    
    expect(cekKetik('servernya mati', answers)).toEqual({ hasil: 'benar', terdekat: 'servernya mati' });
    expect(cekKetik('servernya ati', answers)).toEqual({ hasil: 'hampir', terdekat: 'servernya mati' }); // 1 missing char (dist 1)
    expect(cekKetik('saya lapar', answers)).toEqual({ hasil: 'salah', terdekat: 'servernya mati' });
  });

  it('close matches', () => {
    expect(cekKetik('hello wrld', ['hello world'])).toEqual({ hasil: 'hampir', terdekat: 'hello world' });
  });
});

describe('Antrean Latihan', () => {
  it('handles basic progression', () => {
    let s = mulaiLatihan(2);
    expect(progres(s, 2)).toBe(0);
    expect(sudahSelesai(s)).toBe(false);

    s = setelahJawab(s, true); // soal 0 benar
    expect(progres(s, 2)).toBe(0.5);
    expect(s.antrean).toEqual([0, 1]);

    s = setelahJawab(s, false); // soal 1 salah
    expect(progres(s, 2)).toBe(0.5);
    expect(s.antrean).toEqual([0, 1, 1]); // soal 1 diulang

    expect(sudahSelesai(s)).toBe(false);

    s = setelahJawab(s, true); // soal 1 benar
    expect(progres(s, 2)).toBe(1);
    expect(sudahSelesai(s)).toBe(true);
  });

  it('does not add multiple copies if already in remaining queue', () => {
    let s = mulaiLatihan(1);
    s = setelahJawab(s, false); // antrean: [0, 0]
    expect(s.antrean).toEqual([0, 0]);
    s = setelahJawab(s, false); // posisi 1 jawab salah, antrean jadi [0, 0, 0]
    expect(s.antrean).toEqual([0, 0, 0]);
  });
});