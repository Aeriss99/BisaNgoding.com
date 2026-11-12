import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { PraktikJavaCard } from '../../types/schema';

// Editor CodeMirror diganti textarea biasa, dan Java dijalankan tiruan (CheerpJ tidak ada di tes).
vi.mock('./CodeEditor', () => ({
  CodeEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="kode" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));
const { runJavaCode } = vi.hoisted(() => ({ runJavaCode: vi.fn() }));
vi.mock('../../lib/javaRunner', () => ({ runJavaCode }));

import { PraktikJavaCardComponent } from './PraktikJavaCard';

const kelas = (isi: string) => `public class Main {\n    public static void main(String[] args) {\n${isi}\n    }\n}\n`;
const KODE1 = kelas('        System.out.println("Warung Kita");');
const KODE2 = kelas('        System.out.println("Warung Kita");\n        System.out.println("Buka setiap hari");');
const KODE3 = kelas('        int total = 25000;\n        System.out.println("Sisa: " + (total % 3));');

const kartu: PraktikJavaCard = {
  type: 'praktik_java',
  judul: 'Kasir Warung 1: tes',
  pembuka: 'Kita bikin kasir warung.',
  langkah: [
    { arahan: 'Lihat aku dulu ya.', jawaban: KODE1, keluaran: 'Warung Kita', otomatis: true, benar: 'Sekarang giliranmu.', petunjuk: '' },
    { arahan: 'Tambahkan `Buka setiap hari`.', jawaban: KODE2, keluaran: 'Warung Kita\nBuka setiap hari', petunjuk: 'Tulis println lagi.', benar: 'Mantap.' },
    {
      arahan: 'Cetak sisa bagi.',
      kodeAwal: kelas('        int total = 25000;'),
      jawaban: KODE3,
      keluaran: 'Sisa: 1',
      petunjuk: 'Pakai %.',
      tantangan: true,
      wajib: [{ pola: '%\\s*3', pesan: 'pakai operator `%` ya.' }],
    },
  ],
  penutup: 'Kasir pertama selesai.',
};

function tanpaAnimasi() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }),
  });
}

async function jalankan(kode: string, hasil: { stdout?: string; stderr?: string; exitCode?: number }) {
  runJavaCode.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0, ...hasil });
  fireEvent.change(screen.getByLabelText('kode'), { target: { value: kode } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Jalankan/ }));
  });
}

describe('Kartu praktik Java bersama Lingga', () => {
  beforeEach(() => {
    runJavaCode.mockReset();
    tanpaAnimasi();
  });

  it('contoh Lingga langsung tampil dengan kode dan hasilnya, lalu editor berisi kode contoh', () => {
    render(<PraktikJavaCardComponent card={kartu} onSuccess={() => {}} />);
    expect(screen.getByText('Contoh dari Lingga')).toBeInTheDocument();
    expect(screen.getAllByText('Main.java').length).toBe(1);
    expect(screen.getByText('Tugas 1 dari 2')).toBeInTheDocument();
    expect((screen.getByLabelText('kode') as HTMLTextAreaElement).value).toBe(KODE1);
  });

  it('menjalankan kode pengguna, menerima keluaran yang sama, lalu lanjut ke tantangan dengan kode awalnya', async () => {
    const onSuccess = vi.fn();
    render(<PraktikJavaCardComponent card={kartu} onSuccess={onSuccess} />);
    await jalankan(KODE2, { stdout: 'Warung Kita\nBuka setiap hari\n' });
    expect(runJavaCode).toHaveBeenCalledWith(KODE2, '', expect.any(Function));
    expect(screen.getByText('Mantap.')).toBeInTheDocument();
    expect(screen.getByText('Tantangan · Tugas 2 dari 2')).toBeInTheDocument();
    expect((screen.getByLabelText('kode') as HTMLTextAreaElement).value).toBe(kelas('        int total = 25000;'));

    await jalankan(KODE3, { stdout: 'Sisa: 1' });
    expect(screen.getByText('Kasir pertama selesai.')).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledWith(1);
  });

  it('keluaran yang belum sama menampilkan hasil pengguna dan yang diharapkan', async () => {
    render(<PraktikJavaCardComponent card={kartu} onSuccess={() => {}} />);
    await jalankan(KODE1, { stdout: 'Warung Kita\n' });
    expect(screen.getByText(/hasilnya belum sama/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Lihat jawabannya' })).toBeNull();
    await jalankan(KODE1, { stdout: 'Warung Kita\n' });
    fireEvent.click(screen.getByRole('button', { name: 'Lihat jawabannya' }));
    expect((screen.getByLabelText('kode') as HTMLTextAreaElement).value).toBe(KODE2);
  });

  it('error compile ditampilkan rapi dengan saran', async () => {
    render(<PraktikJavaCardComponent card={kartu} onSuccess={() => {}} />);
    await jalankan(KODE1, { stderr: "/str/Main.java:3: error: ';' expected", exitCode: 1 });
    expect(screen.getByText(/Main\.java:3: error/)).toBeInTheDocument();
    expect(screen.getByText(/belum diakhiri titik koma/)).toBeInTheDocument();
  });

  it('hasil benar tapi pola wajib tidak dipakai tetap ditolak', async () => {
    const onSuccess = vi.fn();
    render(<PraktikJavaCardComponent card={kartu} onSuccess={onSuccess} />);
    await jalankan(KODE2, { stdout: 'Warung Kita\nBuka setiap hari' });
    await jalankan(kelas('        System.out.println("Sisa: 1");'), { stdout: 'Sisa: 1' });
    expect(screen.getByText(/pakai operator/)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('dengan animasi, Lingga mengetik dulu dan tombol Lewati langsung menampilkan hasil', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }),
    });
    render(<PraktikJavaCardComponent card={kartu} onSuccess={() => {}} />);
    expect(screen.getByText(/Lingga sedang mengetik/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Lewati'));
    expect(screen.getByText('Sekarang giliranmu.')).toBeInTheDocument();
    expect(screen.queryByText(/Lingga sedang mengetik/)).toBeNull();
  });
});
