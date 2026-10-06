-- Aktifkan ekstensi yang diperlukan
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- GANTI INI DI SQL EDITOR (jangan di commit)
-- select vault.create_secret('<<CRON_SECRET_ANDA>>', 'cron_secret', 'Secret untuk cron pengingat');

/*
-- Jadwal pengingat streak harian pukul 19.00 WIB (12.00 UTC)
select cron.schedule(
  'pengingat-streak-harian',
  '0 12 * * *',
  $$
  select net.http_post(
    url := '<<SUPABASE_FUNCTIONS_URL>>/kirim-pengingat-streak',
    headers := jsonb_build_object(
      'x-cron-secret', current_setting('cron.secret', true)
    )
  )
  $$
);

-- Cara melihat jadwal:
-- select * from cron.job;

-- Cara menghapus jadwal:
-- select cron.unschedule('pengingat-streak-harian');
*/
