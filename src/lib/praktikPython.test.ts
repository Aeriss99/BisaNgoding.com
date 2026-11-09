import { describe, it, expect } from 'vitest';
import { barisGalat, keluaranSama, nilaiLangkahPython, rapikanKeluaran } from './praktikPython';
import { artiGalatPython } from './pythonRunner';
import type { LangkahPython } from '../types/schema';

const ok = (keluaran: string) => ({ keluaran, galat: '', jenisGalat: '' });
const err = (jenis: string, pesan = `${jenis}: x`) => ({ keluaran: '', galat: `Traceback (most recent call last):\n  File "<stdin>", line 1\n${pesan}\n`, jenisGalat: jenis });

describe('rapikanKeluaran dan keluaranSama', () => {
  it('membuang spasi akhir baris dan baris kosong di ujung', () => {
    expect(rapikanKeluaran('1 2 \r\n3  \n\n')).toBe('1 2\n3');
  });
  it('hasil konsol dengan kutip sama dengan hasil print', () => {
    expect(keluaranSama("'Sari'", 'Sari')).toBe(true);
    expect(keluaranSama('"Sari"', "'Sari'")).toBe(true);
    expect(keluaranSama('Budi', 'Sari')).toBe(false);
  });
  it('barisGalat mengambil baris terakhir', () => {
    expect(barisGalat(err('NameError', "NameError: name 'x' is not defined").galat)).toBe("NameError: name 'x' is not defined");
  });
});

describe('nilaiLangkahPython', () => {
  const dasar: LangkahPython = { arahan: '', perintah: 'nilai == 100', keluaran: 'False', petunjuk: 'Pakai ==.' };

  it('ketikan kosong ditolak dengan pesan khusus', () => {
    expect(nilaiLangkahPython(dasar, '  ', ok(''), null)).toMatchObject({ benar: false, khusus: true });
  });

  it('keluaran cocok diterima, tidak cocok ditolak', () => {
    expect(nilaiLangkahPython(dasar, 'nilai == 100', ok('False\n'), null).benar).toBe(true);
    const n = nilaiLangkahPython(dasar, 'nilai > 100', ok('True\n'), null);
    expect(n.benar).toBe(false);
    expect(n.pesan).toContain('True');
  });

  it('reaksi salah dipakai saat pola cocok', () => {
    const l: LangkahPython = { ...dasar, salah: [{ pola: '^nilai=100$', reaksi: 'Satu = menyimpan.' }] };
    expect(nilaiLangkahPython(l, 'nilai = 100', ok(''), null)).toEqual({ benar: false, pesan: 'Satu = menyimpan.', khusus: true });
  });

  it('error dijelaskan dengan artinya', () => {
    const n = nilaiLangkahPython(dasar, 'nilia == 100', err('NameError', "NameError: name 'nilia' is not defined"), null);
    expect(n.benar).toBe(false);
    expect(n.pesan).toContain("NameError: name 'nilia' is not defined");
    expect(n.pesan).toContain(artiGalatPython('NameError'));
  });

  it('langkah yang sengaja membuat error hanya lulus dengan jenis error itu', () => {
    const l: LangkahPython = { arahan: '', perintah: 'barang[4]', galat: 'IndexError', petunjuk: '' };
    expect(nilaiLangkahPython(l, 'barang[4]', err('IndexError'), null).benar).toBe(true);
    expect(nilaiLangkahPython(l, 'barang[1]', ok("'Teh'"), null).benar).toBe(false);
  });

  it('cek dan wajib harus lolos', () => {
    const l: LangkahPython = { arahan: '', perintah: 'n *= 2', cek: 'n == 128', wajib: [{ pola: 'while', pesan: 'Pakai while ya.' }], petunjuk: '' };
    expect(nilaiLangkahPython(l, 'n = 128', ok(''), true)).toEqual({ benar: false, pesan: 'Pakai while ya.', khusus: true });
    expect(nilaiLangkahPython(l, 'while n < 100: n *= 2', ok(''), false).benar).toBe(false);
    expect(nilaiLangkahPython(l, 'while n < 100: n *= 2', ok(''), true).benar).toBe(true);
  });

  it('waktu habis ditolak dengan penjelasan', () => {
    const n = nilaiLangkahPython(dasar, 'while True: pass', { keluaran: '', galat: '', jenisGalat: '', waktuHabis: true }, null);
    expect(n).toMatchObject({ benar: false, khusus: true });
    expect(n.pesan).toBe(artiGalatPython('WaktuHabis'));
  });
});

describe('artiGalatPython', () => {
  it('menjelaskan error umum dalam bahasa Indonesia', () => {
    for (const j of ['SyntaxError', 'IndentationError', 'NameError', 'TypeError', 'ValueError', 'IndexError', 'KeyError', 'ZeroDivisionError', 'AttributeError', 'FileNotFoundError']) {
      expect(artiGalatPython(j), j).not.toBe('');
    }
  });
});
