import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Ikon } from '../ui/IkonDesain';
import type { StatusKartu } from '../../lib/jalur';

/** Warna lencana kode kelas. */
export const WARNA_KELAS: Record<string, string> = {
  java: 'var(--color-primary)',
  javascript: 'var(--color-primary)',
  'spring-boot': 'var(--color-primary)',
  nodejs: 'var(--color-primary)',
  mysql: 'var(--color-landing-cyan)',
  'html-css': 'var(--color-landing-cyan)',
  tailwind: 'var(--color-landing-cyan)',
  react: 'var(--color-landing-cyan)',
  typescript: 'var(--color-landing-cyan)',
  linux: 'var(--color-landing-purple)',
  devops: 'var(--color-landing-purple)',
  git: 'var(--color-landing-magenta)',
  'english-it': 'var(--color-landing-magenta)',
};

export function warnaKelas(id: string): string {
  return WARNA_KELAS[id] ?? 'var(--color-primary)';
}

/** Lencana kode kelas: kotak berwarna dengan huruf Bungee (abu-abu kalau belum tersedia). */
export function Lencana({ kode, warna, redup = false, ukuran = 44 }: { kode: string; warna: string; redup?: boolean; ukuran?: number }) {
  return (
    <div
      style={{ width: ukuran, height: ukuran, background: redup ? '#dcd7cc' : warna, fontSize: kode.length <= 2 ? 15 : 12 }}
      className="shrink-0 box-border border-2 border-[var(--color-text-main)] rounded-lg flex items-center justify-center font-bungee"
    >
      {kode}
    </div>
  );
}

/** Baris status di bawah kartu: hijau (tersedia), ungu (kelas baru), abu-abu (segera). */
export function BarisStatus({ status, kecil = false }: { status: StatusKartu; kecil?: boolean }) {
  const ukuran = kecil ? 'text-[13px]' : 'text-[14px]';
  const hijau = status.jenis === 'tersedia' || status.jenis === 'sebagian';
  const warna = hijau ? 'var(--color-success)' : status.jenis === 'baru' ? '#5b21b6' : '#5a5a5a';
  return (
    <div className={`flex items-center gap-1.5 font-mono font-bold ${ukuran}`} style={{ color: warna }}>
      <Ikon nama={hijau ? 'check' : 'clock'} ukuran={16} warna={warna} tebal={hijau ? 3 : 2.5} />
      <span>{status.teks}</span>
    </div>
  );
}

/** Pembungkus kartu: jadi tautan kalau kartu bisa dibuka. */
export function BungkusKartu({ url, className, children }: { url?: string; className: string; children: ReactNode }) {
  if (url) {
    return (
      <Link to={url} className={`${className} no-underline text-[var(--color-text-main)] hover:-translate-y-0.5 transition-transform`}>
        {children}
      </Link>
    );
  }
  return <div className={className}>{children}</div>;
}

/** Kartu kelas di tahap jalur karier. */
export function KartuKelasJalur({ status, topik, warna }: { status: StatusKartu; topik: string; warna: string }) {
  const ada = status.jenis === 'tersedia' || status.jenis === 'sebagian';
  const gaya = ada
    ? 'border-[3px] border-solid border-[var(--color-text-main)] bg-white shadow-[4px_4px_0_var(--color-text-main)]'
    : 'border-[3px] border-dashed border-[var(--color-soon-border)] bg-[var(--color-soon)]';
  return (
    <BungkusKartu url={status.url} className={`box-border w-full max-w-[290px] lg:w-[280px] lg:max-w-none p-[18px] rounded-xl flex flex-col gap-2.5 ${gaya}`}>
      <div className="flex items-center gap-3">
        <Lencana kode={status.kode} warna={warna} redup={!ada} />
        <div className="font-space text-[20px] font-bold leading-6">{status.nama}</div>
      </div>
      <div className="text-[14px] leading-5 text-[#3d3d3d]">{topik}</div>
      <BarisStatus status={status} />
    </BungkusKartu>
  );
}
