import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PraktikTerminalCardComponent } from './PraktikTerminalCard';
import type { PraktikTerminalCard } from '../../types/schema';

const kartu: PraktikTerminalCard = {
  type: 'praktik_terminal',
  judul: 'Proyek Todolist: tes',
  folder: '~/todolist',
  pembuka: 'Halo, aku Lingga.',
  bawaan: { pesan1: 'Buat daftar todo' },
  langkah: [
    {
      arahan: 'Aku buatkan file-nya dulu.',
      terima: ['echo "const todos = [];" > todo.js'],
      keluaran: '',
      otomatis: true,
      petunjuk: '',
    },
    {
      arahan: 'Sekarang cek dengan `git status`.',
      terima: ['git status'],
      keluaran: 'On branch main',
      benar: 'Mantap.',
      petunjuk: 'Ketik git status.',
      salah: [{ terima: ['git commit -m {{x}}'], keluaran: 'nothing added to commit', reaksi: 'Belum di-add.' }],
    },
    {
      arahan: 'Simpan dengan pesanmu sendiri.',
      terima: ['git commit -m {{pesan1}}'],
      keluaran: '[main (root-commit) 1a2b3c4] {{pesan1}}',
      petunjuk: 'Pakai git commit -m "pesan".',
    },
  ],
  penutup: 'Selesai, commit "{{pesan1}}" tersimpan.',
};

function ketik(teks: string) {
  fireEvent.change(screen.getByLabelText(/Ketik perintah/), { target: { value: teks } });
  fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));
}

describe('PraktikTerminalCardComponent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('langkah otomatis sudah terisi, langkah berikutnya harus diketik sendiri', () => {
    const onSuccess = vi.fn();
    render(<PraktikTerminalCardComponent card={kartu} onSuccess={onSuccess} />);
    expect(screen.getByText('Halo, aku Lingga.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Ketik perintah/)).toHaveValue('echo "const todos = [];" > todo.js');
    fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));
    expect(screen.getByLabelText(/Ketik perintah/)).toHaveValue('');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('salah ketik dijawab Lingga, kesalahan umum menampilkan keluaran aslinya', () => {
    render(<PraktikTerminalCardComponent card={kartu} onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));
    ketik('git stat');
    expect(screen.getByText(/Ketik git status\./)).toBeInTheDocument();
    ketik('git commit -m "coba"');
    expect(screen.getByText(/nothing added to commit/)).toBeInTheDocument();
    expect(screen.getByText(/Belum di-add\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lihat jawabannya' })).toBeInTheDocument();
  });

  it('pesan commit pengguna dipakai di keluaran dan penutup, lalu kartu selesai', () => {
    const onSuccess = vi.fn();
    render(<PraktikTerminalCardComponent card={kartu} onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));
    ketik('git status');
    ketik('git commit -m "Daftar belanja"');
    expect(screen.getByText(/\[main \(root-commit\) 1a2b3c4\] Daftar belanja/)).toBeInTheDocument();
    expect(screen.getByText(/commit "Daftar belanja" tersimpan/)).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledWith(1);
    expect(screen.queryByLabelText(/Ketik perintah/)).not.toBeInTheDocument();
  });

  it('ada kesalahan: kartu tetap selesai tanpa bonus XP pertama kali', () => {
    const onSuccess = vi.fn();
    render(<PraktikTerminalCardComponent card={kartu} onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));
    ketik('git stat');
    ketik('git status');
    ketik('git commit -m "x"');
    expect(onSuccess).toHaveBeenCalledWith(2);
  });
});
