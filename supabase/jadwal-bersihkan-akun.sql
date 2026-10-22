-- Aktifkan ekstensi yang diperlukan
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- GANTI INI DI SQL EDITOR (dijalankan manual oleh Lingga, jangan di-commit nilainya):
-- select vault.create_secret('<<CRON_SECRET_ANDA>>', 'cron_secret', 'Secret untuk cron pembersihan akun tidak aktif');

/*
-- Jadwal pembersihan akun tidak aktif harian pukul 01.00 WIB (18.00 UTC)
select cron.schedule(
  'bersihkan-akun-tidak-aktif-harian',
  '0 18 * * *',
  $$
  select net.http_post(
    url := '<<SUPABASE_FUNCTIONS_URL>>/bersihkan-akun-tidak-aktif',
    headers := jsonb_build_object(
      'x-cron-secret', current_setting('cron.secret', true)
    )
  )
  $$
);

-- Cara melihat jadwal:
-- select * from cron.job;

-- Cara menghapus jadwal:
-- select cron.unschedule('bersihkan-akun-tidak-aktif-harian');
*/
