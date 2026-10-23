import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PraktikTerminalCardComponent } from './PraktikTerminalCard';
import type { PraktikTerminalCard } from '../../types/schema';

const kartu: PraktikTerminalCard = {
  type: 'praktik_terminal',
  judul: 'Proyek Todolist: tes',
  folder: '~/todolist',
  pembuka: 'Halo, aku Lingga.',
  bawaan: { pesan2: 'Tambah fungsi' },
  langkah: [
    {
      arahan: 'Lihat aku dulu ya.',
      terima: ['git status'],
      keluaran: 'Untracked files:',
      otomatis: true,
      benar: 'Sekarang giliranmu.',
      petunjuk: '',
    },
    {
      arahan: 'Ketik `git add todo.js`.',
      terima: ['git add todo.js'],
      keluaran: '',
      benar: 'Mantap.',
      petunjuk: 'Ketik git add todo.js.',
      salah: [{ terima: ['git commit -m {{x}}'], keluaran: 'nothing added to commit', reaksi: 'Belum di-add.' }],
    },
    {
      arahan: 'Ketik `git commit -m "Tambah fungsi"`.',
      terima: ['git commit -m {{pesan2}}'],
      keluaran: '[main 1a2b3c4] {{pesan2}}',
      petunjuk: 'Pakai git commit -m "pesan".',
    },
  ],
  penutup: 'Selesai, commit "{{pesan2}}" tersimpan.',
};

/** Atur hasil `prefers-reduced-motion`: true = tanpa animasi (contoh Lingga langsung tampil). */
function kurangiGerak(kurangi: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (q: string) => ({
      matches: kurangi && q.includes('reduce'),
      media: q,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

function ketik(teks: string) {
  fireEvent.change(screen.getByLabelText(/Ketik perintah/), { target: { value: teks } });
  fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));
}

describe('PraktikTerminalCardComponent', () => {
  const asli = window.matchMedia;
  beforeEach(() => {
    localStorage.clear();
    kurangiGerak(true);
  });
  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: asli });
  });

  it('contoh Lingga langsung tampil, lalu tugas pertama menunggu diketik', () => {
    const onSuccess = vi.fn();
    render(<PraktikTerminalCardComponent card={kartu} onSuccess={onSuccess} />);
    expect(screen.getByText('Halo, aku Lingga.')).toBeInTheDocument();
    expect(screen.getByText('Contoh dari Lingga')).toBeInTheDocument();
    expect(screen.getByText(/Untracked files:/)).toBeInTheDocument();
    expect(screen.getByText('Tugas 1 dari 2')).toBeInTheDocument();
    expect(screen.getByLabelText(/Ketik perintah/)).toHaveValue('');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('salah ketik dijawab Lingga, kesalahan umum menampilkan keluaran aslinya', () => {
    render(<PraktikTerminalCardComponent card={kartu} onSuccess={vi.fn()} />);
    ketik('git ad todo.js');
    expect(screen.getByText(/Ketik git add todo\.js\./)).toBeInTheDocument();
    ketik('git commit -m "coba"');
    expect(screen.getByText(/nothing added to commit/)).toBeInTheDocument();
    expect(screen.getByText(/Belum di-add\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lihat jawabannya' })).toBeInTheDocument();
  });

  it('pesan commit pengguna dipakai di keluaran dan penutup, lalu kartu selesai', () => {
    const onSuccess = vi.fn();
    render(<PraktikTerminalCardComponent card={kartu} onSuccess={onSuccess} />);
    ketik('git add todo.js');
    expect(screen.getByText('Tugas 2 dari 2')).toBeInTheDocument();
    ketik('git commit -m "Daftar belanja"');
    expect(screen.getByText(/\[main 1a2b3c4\] Daftar belanja/)).toBeInTheDocument();
    expect(screen.getByText(/commit "Daftar belanja" tersimpan/)).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledWith(1);
    expect(screen.queryByLabelText(/Ketik perintah/)).not.toBeInTheDocument();
  });

  it('ada kesalahan: kartu tetap selesai tanpa bonus XP pertama kali', () => {
    const onSuccess = vi.fn();
    render(<PraktikTerminalCardComponent card={kartu} onSuccess={onSuccess} />);
    ketik('git ad todo.js');
    ketik('git add todo.js');
    ketik('git commit -m "x"');
    expect(onSuccess).toHaveBeenCalledWith(2);
  });

  describe('dengan animasi', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      kurangiGerak(false);
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('Lingga mengetik huruf demi huruf, baru keluarannya tampil', () => {
      render(<PraktikTerminalCardComponent card={kartu} onSuccess={vi.fn()} />);
      expect(screen.queryByText(/Untracked files:/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Ketik perintah/)).not.toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(600 + 45 * 4); // 5 huruf: "git s"
      });
      expect(screen.getByText(/git s$/)).toBeInTheDocument();
      act(() => {
        vi.runAllTimers();
      });
      expect(screen.getByText(/Untracked files:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ketik perintah/)).toBeInTheDocument();
    });

    it('tombol Lewati langsung menjalankan contoh', () => {
      render(<PraktikTerminalCardComponent card={kartu} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Lewati' }));
      expect(screen.getByText(/Untracked files:/)).toBeInTheDocument();
      expect(screen.getByText('Tugas 1 dari 2')).toBeInTheDocument();
    });
  });
});
