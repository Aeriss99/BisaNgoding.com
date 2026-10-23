import { describe, it, expect } from 'vitest';
import {
  cocokkanPola,
  cocokkanSalahSatu,
  isiTemplate,
  contohPerintah,
  cekTantangan,
  pecahTeks,
  rapikanPerintah,
} from '../lib/praktikTerminal';

describe('praktik terminal: pencocokan perintah', () => {
  it('perintah persis cocok, spasi berlebih diabaikan', () => {
    expect(cocokkanPola('git status', 'git status').cocok).toBe(true);
    expect(cocokkanPola('git status', '  git   status ').cocok).toBe(true);
    expect(cocokkanPola('git status', 'git statsu').cocok).toBe(false);
    expect(cocokkanPola('git status', 'git status -s').cocok).toBe(false);
  });

  it('isian menangkap teks berkutip, kutip tunggal, atau satu kata', () => {
    expect(cocokkanPola('git commit -m {{pesan1}}', 'git commit -m "Buat daftar todo"')).toEqual({
      cocok: true,
      isian: { pesan1: 'Buat daftar todo' },
    });
    expect(cocokkanPola('git commit -m {{pesan1}}', "git commit -m 'Tambah fitur'").isian.pesan1).toBe('Tambah fitur');
    expect(cocokkanPola('git config --global user.email {{email}}', 'git config --global user.email kamu@contoh.com').isian.email).toBe('kamu@contoh.com');
  });

  it('kutip pintar dari keyboard HP tetap diterima', () => {
    expect(cocokkanPola('git commit -m {{p}}', 'git commit -m “Halo dunia”').isian.p).toBe('Halo dunia');
  });

  it('isian kosong atau tanpa isian ditolak', () => {
    expect(cocokkanPola('git commit -m {{p}}', 'git commit -m ""').cocok).toBe(false);
    expect(cocokkanPola('git commit -m {{p}}', 'git commit -m').cocok).toBe(false);
  });

  it('karakter khusus di pola tidak dianggap regex', () => {
    expect(cocokkanPola('git add .', 'git add .').cocok).toBe(true);
    expect(cocokkanPola('git add .', 'git add x').cocok).toBe(false);
    expect(cocokkanPola('git log --oneline --graph', 'git log --oneline --graph').cocok).toBe(true);
    expect(cocokkanPola('git tag -l "v0.2*"', "git tag -l 'v0.2*'").cocok).toBe(true);
  });

  it('salah satu dari beberapa pola', () => {
    const h = cocokkanSalahSatu(['git add todo.js', 'git add .'], 'git add .');
    expect(h.cocok).toBe(true);
    expect(cocokkanSalahSatu(['git add todo.js'], 'git add -A').cocok).toBe(false);
  });

  it('template memakai nilai pengguna, lalu nilai bawaan', () => {
    expect(isiTemplate('[main 1a2b3c4] {{p}}', { p: 'Punyaku' }, { p: 'Bawaan' })).toBe('[main 1a2b3c4] Punyaku');
    expect(isiTemplate('[main 1a2b3c4] {{p}}', {}, { p: 'Bawaan' })).toBe('[main 1a2b3c4] Bawaan');
    expect(isiTemplate('{{tidakada}}', {}, {})).toBe('{{tidakada}}');
  });

  it('contoh jawaban mengisi isian dengan teks berkutip', () => {
    expect(contohPerintah('git commit -m {{p}}', {}, { p: 'Buat daftar todo' })).toBe('git commit -m "Buat daftar todo"');
    expect(rapikanPerintah(contohPerintah('git commit -m {{p}}', {}, { p: 'A B' }))).toBe('git commit -m "A B"');
  });

  it('tantangan: semua pola harus ada di teks tempelan', () => {
    const tempel = 'Initialized empty Git repository in /home/budi/todolist/.git/';
    expect(cekTantangan(tempel, ['Initialized empty Git repository'])).toBe(true);
    expect(cekTantangan(tempel, ['Initialized', 'tidak ada'])).toBe(false);
    expect(cekTantangan('   ', ['.*'])).toBe(false);
  });

  it('teks Lingga dipecah menjadi teks, kode, dan tebal', () => {
    expect(pecahTeks('Ketik `git status` lalu **Enter**.')).toEqual([
      { jenis: 'teks', isi: 'Ketik ' },
      { jenis: 'kode', isi: 'git status' },
      { jenis: 'teks', isi: ' lalu ' },
      { jenis: 'tebal', isi: 'Enter' },
      { jenis: 'teks', isi: '.' },
    ]);
  });
});
