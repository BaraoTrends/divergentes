
SELECT cron.schedule(
  'check-indexing-status',
  '0 6 * * *',
  $$
  SELECT extensions.http_post(
    'https://wmdjjvjmwvsceqbcmksb.supabase.co/functions/v1/check-indexing-cron',
    '{}'::text,
    'application/json'
  );
  $$
);
