-- Migration: trigger diperbarui pada progres dan tabel blokir_akun
-- Jangan dijalankan ke produksi secara otomatis; dijalankan manual oleh pemilik repository.

-- 1. Kolom diperbarui dan trigger pada public.progres
alter table public.progres add column if not exists diperbarui timestamptz not null default now();

create or replace function public.set_progres_diperbarui()
returns trigger
language plpgsql
as $$
begin
  new.diperbarui = now();
  return new;
end;
$$;

drop trigger if exists trigger_progres_diperbarui on public.progres;
create trigger trigger_progres_diperbarui
  before insert or update on public.progres
  for each row
  execute function public.set_progres_diperbarui();

-- 2. Tabel blokir_akun
create table if not exists public.blokir_akun (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mulai timestamptz not null default now(),
  sampai timestamptz not null,
  alasan text not null default 'tidak aktif 7 hari'
);

alter table public.blokir_akun enable row level security;

create policy "baca milik sendiri" on public.blokir_akun
  for select using (auth.uid() = user_id);
