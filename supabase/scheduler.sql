create extension if not exists pg_net;
create extension if not exists pg_cron;

select
  cron.schedule(
    'tasker-push-reminders',
    '*/5 * * * *',
    $$
    select net.http_get(
      url := 'https://YOUR-VERCEL-DOMAIN/api/push/send?secret=YOUR_SECRET'
    );
    $$
  );