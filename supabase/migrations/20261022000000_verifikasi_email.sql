-- Migration: verifikasi_email dan fungsi tandai_email_terverifikasi
-- Jangan dijalankan ke produksi secara otomatis; dijalankan manual oleh pemilik repository.

create table if not exists public.verifikasi_email (
  user_id uuid primary key references auth.users(id) on delete cascade,
  diverifikasi_pada timestamptz not null default now()
);

alter table public.verifikasi_email enable row level security;

create policy "baca milik sendiri" on public.verifikasi_email
  for select using (auth.uid() = user_id);

create or replace function public.tandai_email_terverifikasi()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  claims jsonb;
  amr_list jsonb;
  has_otp boolean := false;
  elem jsonb;
begin
  if auth.uid() is null then
    raise exception 'Tidak terautentikasi';
  end if;

  claims := auth.jwt();
  amr_list := claims -> 'amr';

  if amr_list is not null and jsonb_typeof(amr_list) = 'array' then
    for elem in select * from jsonb_array_elements(amr_list) loop
      if elem #>> '{}' = 'otp' or elem ->> 'method' = 'otp' then
        has_otp := true;
      end if;
    end loop;
  end if;

  if not has_otp then
    raise exception 'Verifikasi hanya berlaku untuk sesi hasil OTP email';
  end if;

  insert into public.verifikasi_email (user_id, diverifikasi_pada)
  values (auth.uid(), now())
  on conflict (user_id) do nothing;
end;
$$;

grant execute on function public.tandai_email_terverifikasi() to authenticated;
