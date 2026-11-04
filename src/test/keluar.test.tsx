import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeluar } from '../components/layout/MenuAtas';

const mockKeluar = vi.fn();
const mockFlushKeCloud = vi.fn();
const mockKonfirmasi = vi.fn();
const mockNavigate = vi.fn();
const mockBersihkanProgresLokal = vi.fn();
const mockUser = { id: 'user-123', email: 'test@example.com' };

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    keluar: mockKeluar,
  }),
}));

vi.mock('../context/ProgressContext', () => ({
  useProgress: () => ({
    flushKeCloud: mockFlushKeCloud,
  }),
}));

vi.mock('../components/ui/DialogKonfirmasi', () => ({
  useKonfirmasi: () => mockKonfirmasi,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../lib/cloudProgress', () => ({
  bersihkanProgresLokal: (...args: unknown[]) => mockBersihkanProgresLokal(...args),
}));

describe('useKeluar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('kirim gagal, coba lagi, gagal lagi, lalu keluar saja', async () => {
    mockFlushKeCloud.mockResolvedValue(false);
    mockKonfirmasi.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const { result } = renderHook(() => useKeluar());
    await act(async () => {
      await result.current();
    });

    expect(mockKonfirmasi).toHaveBeenCalledTimes(2);
    expect(mockKonfirmasi).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ judul: 'Progres belum tersimpan' })
    );
    expect(mockKonfirmasi).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ judul: 'Masih belum tersimpan' })
    );
    expect(mockKeluar).toHaveBeenCalledTimes(1);
    expect(mockBersihkanProgresLokal).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('kirim gagal, coba lagi, berhasil', async () => {
    mockFlushKeCloud.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockKonfirmasi.mockResolvedValueOnce(false);

    const { result } = renderHook(() => useKeluar());
    await act(async () => {
      await result.current();
    });

    expect(mockKonfirmasi).toHaveBeenCalledTimes(1);
    expect(mockBersihkanProgresLokal).toHaveBeenCalledWith(mockUser.id);
    expect(mockKeluar).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('kirim langsung berhasil', async () => {
    mockFlushKeCloud.mockResolvedValue(true);

    const { result } = renderHook(() => useKeluar());
    await act(async () => {
      await result.current();
    });

    expect(mockKonfirmasi).not.toHaveBeenCalled();
    expect(mockBersihkanProgresLokal).toHaveBeenCalledWith(mockUser.id);
    expect(mockKeluar).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
