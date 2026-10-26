import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PraktikGitHubCardComponent } from './PraktikGitHubCard';
import type { PraktikGitHubCard } from '../../types/schema';

const kartuTes: PraktikGitHubCard = {
  type: 'praktik_github',
  judul: 'Proyek Todolist: GitHub Issues',
  pembuka: 'Halo, ini simulasi GitHub.',
  bawaan: { judul: 'Bug form kontak' },
  layar: {
    repo: {
      templat: 'repo',
      tabAktif: 'code',
      repo: 'kamu/todolist',
    },
    daftar_issue: {
      templat: 'daftar_issue',
      tabAktif: 'issues',
      repo: 'kamu/todolist',
      items: [],
    },
    form_issue: {
      templat: 'form_issue',
      tabAktif: 'issues',
      repo: 'kamu/todolist',
    },
  },
  langkah: [
    {
      arahan: 'Lihat aku membuka tab Issues.',
      layar: 'repo',
      target: 'tab-issues',
      otomatis: true,
      benar: 'Tab Issues sudah dibuka.',
      petunjuk: 'Klik tab Issues.',
    },
    {
      arahan: 'Klik tombol New issue untuk mulai mencatat bug.',
      layar: 'daftar_issue',
      target: 'btn-new-issue',
      benar: 'Formulir siap diisi.',
      petunjuk: 'Klik tombol New issue.',
      salah: [{ target: 'tab-code', reaksi: 'Itu tab Code, bukan New issue.' }],
    },
    {
      arahan: 'Ketik judul bug lalu klik Create.',
      layar: 'form_issue',
      target: 'btn-create',
      isian: 'judul',
      benar: 'Issue "{{judul}}" berhasil dibuat.',
      petunjuk: 'Isi judul dan klik Create.',
      salah: [{ target: 'btn-cancel', reaksi: 'Jangan klik Cancel.' }],
    },
    {
      arahan: 'Kembali ke daftar bug dan tugas.',
      layar: 'form_issue',
      target: 'tab-issues',
      tantangan: true,
      benar: 'Kamu kembali ke daftar issue.',
      petunjuk: 'Klik tab untuk kembali.',
    },
  ],
  penutup: 'Selesai! Issue "{{judul}}" sudah tercatat.',
};

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

describe('PraktikGitHubCardComponent', () => {
  const asli = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    kurangiGerak(true);
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: asli });
  });

  it('contoh Lingga otomatis jalan dan tombol Lewati dapat digunakan', () => {
    const onSuccess = vi.fn();
    render(<PraktikGitHubCardComponent card={kartuTes} onSuccess={onSuccess} />);
    expect(screen.getByText('Halo, ini simulasi GitHub.')).toBeInTheDocument();
    expect(screen.getByText('Contoh dari Lingga')).toBeInTheDocument();
    expect(screen.getByText('Tab Issues sudah dibuka.')).toBeInTheDocument();
    expect(screen.getByText('Tugas 1 dari 3')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('klik tombol benar memajukan ke langkah berikutnya', () => {
    const onSuccess = vi.fn();
    render(<PraktikGitHubCardComponent card={kartuTes} onSuccess={onSuccess} />);
    const btnNewIssue = screen.getByRole('button', { name: 'New issue' });
    fireEvent.click(btnNewIssue);
    expect(screen.getByText('Formulir siap diisi.')).toBeInTheDocument();
    expect(screen.getByText('Tugas 2 dari 3')).toBeInTheDocument();
  });

  it('klik salah menampilkan reaksi spesifik atau petunjuk', () => {
    render(<PraktikGitHubCardComponent card={kartuTes} onSuccess={vi.fn()} />);
    const tabCode = screen.getByRole('button', { name: 'Code' });
    fireEvent.click(tabCode);
    expect(screen.getByText(/Itu tab Code, bukan New issue\./)).toBeInTheDocument();

    const tabSettings = screen.getByRole('button', { name: 'Settings' });
    fireEvent.click(tabSettings);
    expect(screen.getByText(/Klik tombol New issue\./)).toBeInTheDocument();
  });

  it('salah 2 kali memunculkan tombol Lihat jawabannya yang menyorot target', () => {
    render(<PraktikGitHubCardComponent card={kartuTes} onSuccess={vi.fn()} />);
    const tabCode = screen.getByRole('button', { name: 'Code' });
    fireEvent.click(tabCode);
    fireEvent.click(tabCode);

    const btnLihat = screen.getByRole('button', { name: 'Lihat jawabannya' });
    expect(btnLihat).toBeInTheDocument();
    fireEvent.click(btnLihat);

    const btnNewIssue = screen.getByRole('button', { name: 'New issue' });
    expect(btnNewIssue.className).toContain('ring-[#ffd33d]');
  });

  it('isian disimpan dan dipakai lagi di langkah berikutnya dan penutup', () => {
    const onSuccess = vi.fn();
    render(<PraktikGitHubCardComponent card={kartuTes} onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: 'New issue' }));

    const inputTitle = screen.getByLabelText(/Add a title/);
    fireEvent.change(inputTitle, { target: { value: 'Tombol checkout error' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByText('Issue "Tombol checkout error" berhasil dibuat.')).toBeInTheDocument();
    expect(screen.getByText('Tantangan · Tugas 3 dari 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Issues/ }));
    expect(screen.getByText('Selesai! Issue "Tombol checkout error" sudah tercatat.')).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledWith(1);
  });

  it('label tantangan muncul pada langkah tantangan', () => {
    render(<PraktikGitHubCardComponent card={kartuTes} onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'New issue' }));
    fireEvent.change(screen.getByLabelText(/Add a title/), { target: { value: 'Bug kartu' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByText('Tantangan · Tugas 3 dari 3')).toBeInTheDocument();
  });
});
