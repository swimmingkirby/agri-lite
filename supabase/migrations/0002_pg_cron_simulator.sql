-- ============================================================
-- 0002_pg_cron_simulator.sql
--
-- Drives the Agri-Lite simulator from inside Supabase using pg_cron +
-- pg_net. This is needed because the Vercel Hobby plan only permits
-- daily cron jobs, but the PRD specifies a one-minute cadence (FR1).
-- The Vercel cron in vercel.json still runs daily as the architectural
-- marker; this job is what actually drives the every-minute simulation.
--
-- Before running this, insert your CRON_SECRET into Vault as
-- 'agri_lite_cron_secret':
--
--   select vault.create_secret(
--     '<CRON_SECRET>',
--     'agri_lite_cron_secret',
--     'Bearer token used by the pg_cron job that fires the Agri-Lite simulator.'
--   );
--
-- Then update the URL below to point at your deployed Vercel domain.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Wrapper reads the bearer token from Vault at runtime so the pg_cron job body
-- never holds the secret in plaintext. SECURITY DEFINER so only this function
-- needs Vault read access; cron just calls it.
create or replace function public.agri_lite_fire_simulator()
returns void
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'agri_lite_cron_secret';

  if v_secret is null then
    raise exception 'agri_lite_cron_secret missing from vault';
  end if;

  perform net.http_post(
    url := 'https://<your-vercel-app>.vercel.app/api/cron/simulate',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_secret,
      'Content-Type', 'application/json'
    )
  );
end;
$$;

select cron.schedule(
  'agri-lite-simulate',
  '* * * * *',
  $$select public.agri_lite_fire_simulator();$$
);
