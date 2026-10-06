create table if not exists public.pengaturan_notifikasi (
  user_id uuid primary key references auth.users on delete cascade,
  email text not null,
  nama text,
  streak boolean not null default true,
  modul_baru boolean not null default true,
  token_berhenti uuid not null default gen_random_uuid() unique,
  dibuat_pada timestamptz default now()
);

alter table public.pengaturan_notifikasi enable row level security;

drop policy if exists "Pengguna bisa membaca pengaturan sendiri" on public.pengaturan_notifikasi;
create policy "Pengguna bisa membaca pengaturan sendiri" 
on public.pengaturan_notifikasi for select to authenticated 
using ((select auth.uid()) = user_id);

drop policy if exists "Pengguna bisa mengubah streak dan modul_baru" on public.pengaturan_notifikasi;
create policy "Pengguna bisa mengubah streak dan modul_baru" 
on public.pengaturan_notifikasi for update to authenticated 
using ((select auth.uid()) = user_id);

grant select, update (streak, modul_baru) on public.pengaturan_notifikasi to authenticated;
revoke insert, delete on public.pengaturan_notifikasi from authenticated;

create or replace function public.tangani_pengguna_baru() 
returns trigger 
language plpgsql 
security definer set search_path = public, pg_temp 
as $$
begin
  insert into public.pengaturan_notifikasi (user_id, email, nama)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.tangani_pengguna_baru() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tangani_pengguna_baru();

insert into public.pengaturan_notifikasi (user_id, email, nama)
select id, email, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1))
from auth.users
on conflict (user_id) do nothing;

create table if not exists public.log_email (
  id bigserial primary key,
  user_id uuid,
  jenis text,
  kunci text,
  dikirim_pada timestamptz default now(),
  unique (user_id, jenis, kunci)
);

alter table public.log_email enable row level security;

create table if not exists public.modul_diumumkan (
  module_id text primary key,
  diumumkan_pada timestamptz default now()
);

alter table public.modul_diumumkan enable row level security;
