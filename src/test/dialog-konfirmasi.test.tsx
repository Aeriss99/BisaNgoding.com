import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
  KonfirmasiProvider,
  useKonfirmasi,
} from '../components/ui/DialogKonfirmasi';

function KomponenUji({
  opsi,
  onHasil,
}: {
  opsi: any;
  onHasil: (hasil: boolean) => void;
}) {
  const konfirmasi = useKonfirmasi();

  const handleKlik = async () => {
    const res = await konfirmasi(opsi);
    onHasil(res);
  };

  return (
    <div>
      <button data-testid="tombol-buka" onClick={handleKlik}>
        Buka Dialog
      </button>
    </div>
  );
}

describe('DialogKonfirmasi', () => {
  const defaultOpsi = {
    judul: 'Konfirmasi Aksi',
    pesan: 'Apakah Anda yakin ingin melanjutkan?',
    teksYa: 'YA, LANJUTKAN',
    teksBatal: 'BATALKAN',
  };

  it('fokus awal di tombol Batal saat dialog dibuka', async () => {
    let hasil: boolean | null = null;
    render(
      <KonfirmasiProvider>
        <KomponenUji opsi={defaultOpsi} onHasil={(h) => (hasil = h)} />
      </KonfirmasiProvider>
    );

    fireEvent.click(screen.getByTestId('tombol-buka'));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Konfirmasi Aksi')).toBeInTheDocument();
    expect(screen.getByText('Apakah Anda yakin ingin melanjutkan?')).toBeInTheDocument();

    const tombolBatal = screen.getByRole('button', { name: 'BATALKAN' });
    await waitFor(() => {
      expect(document.activeElement).toBe(tombolBatal);
    });
    expect(hasil).toBeNull();
  });

  it('klik Ya mengembalikan true dan menutup dialog', async () => {
    let hasil: boolean | null = null;
    render(
      <KonfirmasiProvider>
        <KomponenUji opsi={defaultOpsi} onHasil={(h) => (hasil = h)} />
      </KonfirmasiProvider>
    );

    fireEvent.click(screen.getByTestId('tombol-buka'));

    const tombolYa = screen.getByRole('button', { name: 'YA, LANJUTKAN' });
    fireEvent.click(tombolYa);

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(hasil).toBe(true);
    });
  });

  it('klik Batal mengembalikan false dan menutup dialog', async () => {
    let hasil: boolean | null = null;
    render(
      <KonfirmasiProvider>
        <KomponenUji opsi={defaultOpsi} onHasil={(h) => (hasil = h)} />
      </KonfirmasiProvider>
    );

    fireEvent.click(screen.getByTestId('tombol-buka'));

    const tombolBatal = screen.getByRole('button', { name: 'BATALKAN' });
    fireEvent.click(tombolBatal);

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(hasil).toBe(false);
    });
  });

  it('menekan tombol Escape mengembalikan false dan menutup dialog', async () => {
    let hasil: boolean | null = null;
    render(
      <KonfirmasiProvider>
        <KomponenUji opsi={defaultOpsi} onHasil={(h) => (hasil = h)} />
      </KonfirmasiProvider>
    );

    fireEvent.click(screen.getByTestId('tombol-buka'));

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(hasil).toBe(false);
    });
  });

  it('klik latar belakang (backdrop) mengembalikan false dan menutup dialog', async () => {
    let hasil: boolean | null = null;
    render(
      <KonfirmasiProvider>
        <KomponenUji opsi={defaultOpsi} onHasil={(h) => (hasil = h)} />
      </KonfirmasiProvider>
    );

    fireEvent.click(screen.getByTestId('tombol-buka'));

    const backdrop = screen.getByTestId('dialog-konfirmasi-backdrop');
    fireEvent.click(backdrop);

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(hasil).toBe(false);
    });
  });

  it('warna tombol Ya magenta jika bahaya bernilai true', () => {
    render(
      <KonfirmasiProvider>
        <KomponenUji
          opsi={{ ...defaultOpsi, bahaya: true }}
          onHasil={() => {}}
        />
      </KonfirmasiProvider>
    );

    fireEvent.click(screen.getByTestId('tombol-buka'));

    const tombolYa = screen.getByRole('button', { name: 'YA, LANJUTKAN' });
    expect(tombolYa).toHaveClass('bg-[#ff3dcb]');
  });
});
