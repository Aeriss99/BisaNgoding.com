import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PraktikExcelCardComponent } from './PraktikExcelCard';
import type { PraktikExcelCard } from '../../types/schema';

const kartu: PraktikExcelCard = {
  type: 'praktik_excel',
  judul: 'Lembar Toko Budi: tes',
  pembuka: 'Halo, aku Lingga.',
  sel: { A1: 'Barang', B1: 'Harga', C1: 'Terjual', A2: 'Kopi', B2: 25000, C2: 3, A3: 'Teh', B3: 15000, C3: 5 },
  format: { D: 'rupiah' },
  langkah: [
    { arahan: 'Lihat aku dulu.', sel: 'D1', jawaban: 'Total', otomatis: true, petunjuk: '', benar: 'Sekarang giliranmu.' },
    { arahan: 'Tulis `=B2*C2` di D2, disalin sampai D3.', sel: 'D2', sampai: 'D3', jawaban: '=B2*C2', petunjuk: 'Polanya =B2*C2.' },
    { arahan: 'Jumlahkan di D4.', sel: 'D4', jawaban: '=SUM(D2:D3)', tantangan: true, petunjuk: 'Pakai SUM.', wajib: [{ pola: 'SUM\\(', pesan: 'Pakai SUM ya.' }] },
  ],
  penutup: 'Selesai.',
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

function ketik(teks: string) {
  fireEvent.change(screen.getByLabelText(/Ketik rumus atau isi sel/), { target: { value: teks } });
  fireEvent.click(screen.getByRole('button', { name: 'Enter' }));
}

describe('PraktikExcelCardComponent', () => {
  const asli = window.matchMedia;
  beforeEach(() => kurangiGerak(true));
  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: asli });
  });

  it('contoh Lingga langsung terisi, lalu tugas pertama menunggu', () => {
    render(<PraktikExcelCardComponent card={kartu} onSuccess={vi.fn()} />);
    expect(screen.getByText('Halo, aku Lingga.')).toBeInTheDocument();
    expect(screen.getByText('Contoh dari Lingga')).toBeInTheDocument();
    expect(screen.getAllByText('Total').length).toBeGreaterThan(0);
    expect(screen.getByText('Tugas 1 dari 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Sel yang diisi')).toHaveTextContent('D2:D3');
  });

  it('rumus benar mengisi semua sel salinan dengan format Rupiah', () => {
    render(<PraktikExcelCardComponent card={kartu} onSuccess={vi.fn()} />);
    ketik('=B2*C2');
    expect(screen.getAllByText('Rp75.000')).toHaveLength(2);
    expect(screen.getByText('Tantangan · Tugas 2 dari 2')).toBeInTheDocument();
  });

  it('koma sebagai pemisah dan rumus tanpa = dijelaskan Lingga', () => {
    render(<PraktikExcelCardComponent card={kartu} onSuccess={vi.fn()} />);
    ketik('B2*C2');
    expect(screen.getByText(/selalu diawali tanda sama dengan/)).toBeInTheDocument();
    ketik('=ROUND(B2*C2,0)');
    expect(screen.getByText(/titik koma/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lihat jawabannya' })).toBeInTheDocument();
  });

  it('hasil salah menampilkan isi sel yang berbeda lalu petunjuk langkah', () => {
    render(<PraktikExcelCardComponent card={kartu} onSuccess={vi.fn()} />);
    ketik('=B2+C2');
    expect(screen.getByText(/Hasil di D2 jadi 25003, belum sesuai\. Polanya =B2\*C2\./)).toBeInTheDocument();
  });

  it('selesai semua tugas memanggil onSuccess', () => {
    const onSuccess = vi.fn();
    render(<PraktikExcelCardComponent card={kartu} onSuccess={onSuccess} />);
    ketik('=B2*C2');
    ketik('=D2+D3');
    expect(screen.getByText('Pakai SUM ya.')).toBeInTheDocument();
    ketik('=SUM(D2:D3)');
    expect(screen.getByText('Rp150.000')).toBeInTheDocument();
    expect(screen.getByText('Selesai.')).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledWith(2);
  });

  it('klik sel saat menulis rumus menyisipkan alamatnya', () => {
    render(<PraktikExcelCardComponent card={kartu} onSuccess={vi.fn()} />);
    const input = screen.getByLabelText(/Ketik rumus atau isi sel/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '=' } });
    input.setSelectionRange(1, 1);
    fireEvent.click(screen.getByTitle('B2'));
    expect(input.value).toBe('=B2');
  });

  it('klik sel di luar mode rumus menampilkan isinya', () => {
    render(<PraktikExcelCardComponent card={kartu} onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByTitle('B2'));
    expect(screen.getByRole('status')).toHaveTextContent('B2 berisi: 25000');
  });
});
