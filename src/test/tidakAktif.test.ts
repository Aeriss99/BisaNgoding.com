import { describe, it, expect } from 'vitest';
import {
  apakahPerluDiblokir,
  saringAkunTidakAktif,
  type AkunEvaluasi,
} from '../../supabase/functions/_shared/tidakAktif';
import { petakanErrorAuth } from '../lib/authError';

describe('tidakAktif logic (_shared/tidakAktif.ts)', () => {
  const now = new Date('2026-10-22T12:00:00Z');
  const daftarAdmin = ['admin@bisangoding.com'];

  const daysAgo = (n: number) =>
    new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
  const daysInFuture = (n: number) =>
    new Date(now.getTime() + n * 24 * 60 * 60 * 1000).toISOString();

  it('akun 8 hari tidak aktif -> dipilih', () => {
    const akun: AkunEvaluasi = {
      id: 'u1',
      email: 'user1@test.com',
      diperbarui: daysAgo(8),
      last_sign_in_at: daysAgo(8),
    };
    expect(apakahPerluDiblokir(akun, daftarAdmin, now)).toBe(true);
  });

  it('akun 6 hari tidak aktif -> tidak dipilih', () => {
    const akun: AkunEvaluasi = {
      id: 'u2',
      email: 'user2@test.com',
      diperbarui: daysAgo(6),
      last_sign_in_at: daysAgo(6),
    };
    expect(apakahPerluDiblokir(akun, daftarAdmin, now)).toBe(false);
  });

  it('admin 30 hari tidak aktif -> tidak dipilih', () => {
    const akun: AkunEvaluasi = {
      id: 'admin-1',
      email: 'admin@bisangoding.com',
      diperbarui: daysAgo(30),
      last_sign_in_at: daysAgo(30),
    };
    expect(apakahPerluDiblokir(akun, daftarAdmin, now)).toBe(false);
  });

  it('akun yang masih diblokir -> tidak dipilih', () => {
    const akun: AkunEvaluasi = {
      id: 'u3',
      email: 'user3@test.com',
      diperbarui: daysAgo(10),
      last_sign_in_at: daysAgo(10),
      banned_until: daysInFuture(2), // masih diblokir 2 hari ke depan
    };
    expect(apakahPerluDiblokir(akun, daftarAdmin, now)).toBe(false);
  });

  it('akun yang blokirnya selesai 3 hari lalu dan belum login -> tidak dipilih', () => {
    const akun: AkunEvaluasi = {
      id: 'u4',
      email: 'user4@test.com',
      diperbarui: daysAgo(15),
      last_sign_in_at: daysAgo(15),
      terakhir_blokir_sampai: daysAgo(3), // blokir berakhir 3 hari lalu
    };
    expect(apakahPerluDiblokir(akun, daftarAdmin, now)).toBe(false);
  });

  it('akun yang blokirnya selesai 8 hari lalu dan belum login -> dipilih', () => {
    const akun: AkunEvaluasi = {
      id: 'u5',
      email: 'user5@test.com',
      diperbarui: daysAgo(20),
      last_sign_in_at: daysAgo(20),
      terakhir_blokir_sampai: daysAgo(8), // blokir berakhir 8 hari lalu
    };
    expect(apakahPerluDiblokir(akun, daftarAdmin, now)).toBe(true);
  });

  it('saringAkunTidakAktif menyaring daftar dengan benar', () => {
    const daftar: AkunEvaluasi[] = [
      { id: '1', email: 'u1@test.com', diperbarui: daysAgo(8) },
      { id: '2', email: 'u2@test.com', diperbarui: daysAgo(5) },
      { id: '3', email: 'admin@bisangoding.com', diperbarui: daysAgo(10) },
    ];
    const hasil = saringAkunTidakAktif(daftar, daftarAdmin, now);
    expect(hasil.map((a) => a.id)).toEqual(['1']);
  });

  it('petakanErrorAuth({ code: "user_banned" }) menghasilkan pesan akun dibekukan 5 hari', () => {
    const pesan = petakanErrorAuth({ code: 'user_banned' });
    expect(pesan).toBe(
      'Akunmu dibekukan 5 hari karena tidak membuka BisaNgoding selama 7 hari, dan progresnya sudah dihapus. Silakan masuk lagi setelah masa blokir selesai.'
    );
  });
});
