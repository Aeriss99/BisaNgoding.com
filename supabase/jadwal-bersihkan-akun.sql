-- Aturan 7 hari: jadwal harian pembersihan akun tidak aktif.
-- Dijalankan manual oleh Lingga di Supabase SQL Editor (project isinibmyyxslejknghnl).
--
-- Tidak butuh secret baru: memakai secret vault 'cron_secret' yang sama dengan jadwal
-- pengingat-streak-harian (nilainya sama dengan CRON_SECRET di edge function).
-- Alamat function bukan rahasia, jadi ditulis langsung.
--
-- Setiap hari pukul 01.00 WIB (18.00 UTC). Akun yang lebih dari 7 hari tidak aktif
-- (admin dikecualikan) direset progresnya dan diblokir 5 hari.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'bersihkan-akun-tidak-aktif-harian',
  '0 18 * * *',
  $$
  select net.http_post(
    url := 'https://isinibmyyxslejknghnl.supabase.co/functions/v1/bersihkan-akun-tidak-aktif',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- Cek jadwal:
-- select jobname, schedule, active from cron.job;
--
-- Cek hasil setelah jalan (kode 200 = berhasil):
-- select status_code, content, created from net._http_response order by created desc limit 3;
--
-- Mematikan aturan 7 hari:
-- select cron.unschedule('bersihkan-akun-tidak-aktif-harian');
