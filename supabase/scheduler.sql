create extension if not exists pg_net;

select
  cron.schedule(
    'tasker-push-reminders',
    '*/5 * * * *',
    $$
    select
      net.http_post(
        url := 'https://YOUR-VERCEL-DOMAIN/api/push/send?secret=YOUR_SECRET',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := '{}'::jsonb
      );
    $$
  );