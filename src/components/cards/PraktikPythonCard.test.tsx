import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { PraktikPythonCard } from '../../types/schema';

// Python asli (Pyodide) tidak dimuat di test: konsol tiruan menjawab beberapa perintah.
const jalankan = vi.fn(async (baris: string) => {
  const peta: Record<string, { keluaran: string; galat: string; jenisGalat: string }> = {
    'nilai >= 75': { keluaran: 'True\n', galat: '', jenisGalat: '' },
    'nilai == 100': { keluaran: 'False\n', galat: '', jenisGalat: '' },
    'nilai = 100': { keluaran: '', galat: '', jenisGalat: '' },
    'nilia == 100': { keluaran: '', galat: "Traceback (most recent call last):\nNameError: name 'nilia' is not defined\n", jenisGalat: 'NameError' },
  };
  return peta[baris] ?? { keluaran: '', galat: '', jenisGalat: '' };
});
const siapkan = vi.fn(async () => true);
const pulihkan = vi.fn(async () => ({ keluaran: '', galat: '', jenisGalat: '' }));

vi.mock('../../lib/pythonRunner', async (asli) => ({
  ...(await asli<typeof import('../../lib/pythonRunner')>()),
  siapkanPython: () => siapkan(),
  konsol: {
    jalankan: (b: string) => jalankan(b),
    persiapan: vi.fn(async () => ({ keluaran: '', galat: '', jenisGalat: '' })),
    reset: vi.fn(async () => ({ keluaran: '', galat: '', jenisGalat: '' })),
    simpan: vi.fn(async () => ({ keluaran: '', galat: '', jenisGalat: '' })),
    pulihkan: () => pulihkan(),
    cek: vi.fn(async () => true),
  },
}));

const { PraktikPythonCardComponent } = await import('./PraktikPythonCard');

const kartu: PraktikPythonCard = {
  type: 'praktik_python',
  judul: 'Konsol Python: tes',
  pembuka: 'Halo, aku Lingga.',
  penutup: 'Hebat, selesai.',
  persiapan: 'nilai = 80',
  langkah: [
    { arahan: 'Lihat aku dulu.', perintah: 'nilai >= 75', keluaran: 'True', otomatis: true, petunjuk: '', benar: 'Sekarang giliranmu.' },
    {
      arahan: 'Cek apakah nilai sama dengan 100.',
      perintah: 'nilai == 100',
      keluaran: 'False',
      petunjuk: 'Pakai dua tanda sama dengan.',
      salah: [{ pola: '^nilai=100$', reaksi: 'Satu tanda = artinya menyimpan.' }],
    },
  ],
};

function ketik(teks: string) {
  const input = screen.getByLabelText('Ketik perintah Python');
  fireEvent.change(input, { target: { value: teks } });
  fireEvent.submit(input.closest('form')!);
}

describe('PraktikPythonCard', () => {
  beforeEach(() => {
    // Kurangi gerak: contoh Lingga langsung dijalankan tanpa animasi mengetik.
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (q: string) => ({ matches: q.includes('reduce'), media: q, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false }),
    });
    jalankan.mockClear();
    pulihkan.mockClear();
    siapkan.mockClear();
    siapkan.mockImplementation(async () => true);
  });

  it('contoh Lingga jalan sendiri, salah dijelaskan, benar menyelesaikan kartu', async () => {
    const onSuccess = vi.fn();
    render(<PraktikPythonCardComponent card={kartu} onSuccess={onSuccess} />);
    expect(await screen.findByText('Sekarang giliranmu.')).toBeTruthy();
    expect(screen.getByLabelText('Riwayat konsol Python').textContent).toContain('>>> nilai >= 75');

    ketik('nilai = 100');
    expect(await screen.findByText('Satu tanda = artinya menyimpan.')).toBeTruthy();
    expect(pulihkan).toHaveBeenCalledTimes(1);

    ketik('nilia == 100');
    expect(await screen.findByText(/NameError: name 'nilia' is not defined/)).toBeTruthy();
    expect(screen.getByText('Lihat jawabannya')).toBeTruthy();

    fireEvent.click(screen.getByText('Lihat jawabannya'));
    expect((screen.getByLabelText('Ketik perintah Python') as HTMLInputElement).value).toBe('nilai == 100');
    fireEvent.submit(screen.getByLabelText('Ketik perintah Python').closest('form')!);
    expect(await screen.findByText('Hebat, selesai.')).toBeTruthy();
    expect(onSuccess).toHaveBeenCalledWith(3);
  });

  it('kalau Python gagal dimuat, ada tombol coba lagi', async () => {
    siapkan.mockImplementation(async () => false);
    render(<PraktikPythonCardComponent card={kartu} onSuccess={vi.fn()} />);
    expect(await screen.findByText(/Python gagal dimuat/)).toBeTruthy();
    siapkan.mockImplementation(async () => true);
    fireEvent.click(screen.getByText('coba lagi'));
    await waitFor(() => expect(screen.getByLabelText('Riwayat konsol Python').textContent).toContain('>>> nilai >= 75'));
  });
});
