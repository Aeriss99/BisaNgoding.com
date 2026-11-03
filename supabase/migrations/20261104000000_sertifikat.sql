-- Migration: sertifikat kelulusan kelas
-- JANGAN dijalankan otomatis ke Supabase produksi. Dijalankan manual oleh Claude setelah disetujui pemilik.

create table if not exists public.sertifikat (
  kode text primary key check (kode ~ '^BN-[A-Z2-9]{4}-[A-Z2-9]{4}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  kelas_id text not null,
  nama text not null check (char_length(nama) between 3 and 60),
  terbit timestamptz not null default now(),
  unique (user_id, kelas_id)
);

alter table public.sertifikat enable row level security;

-- pemilik bisa melihat dan menerbitkan miliknya sendiri; tidak ada update/delete
create policy "baca milik sendiri" on public.sertifikat for select using (auth.uid() = user_id);
create policy "terbitkan milik sendiri" on public.sertifikat for insert with check (auth.uid() = user_id);

-- fungsi publik untuk cek keaslian (siapa pun, tanpa login, hanya dengan kode; tidak membocorkan user_id atau daftar sertifikat lain)
create or replace function public.cek_sertifikat(p_kode text)
returns table (nama text, kelas_id text, terbit timestamptz)
language sql stable security definer set search_path = public
as $$ select s.nama, s.kelas_id, s.terbit from public.sertifikat s where s.kode = upper(trim(p_kode)) $$;

revoke all on function public.cek_sertifikat(text) from public;
grant execute on function public.cek_sertifikat(text) to anon, authenticated;
