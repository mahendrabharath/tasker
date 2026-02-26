# Tasker

Tasker is a simple task app with one-time and repeating tasks, image uploads,
completion tracking, charts, and browser notifications.

## Tech stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Auth, Postgres, Storage)
- Recharts + date-fns

## Local setup

1. Copy environment variables:

```bash
cp .env.local.example .env.local
```

2. Add Supabase keys to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

## Supabase schema

Run the SQL below in the Supabase SQL editor:

```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  is_repeating boolean default false,
  repeat_rule text,
  last_notified_at timestamptz,
  created_at timestamptz default now()
);

create table task_images (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz default now()
);

create table task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks (id) on delete cascade,
  completed_at timestamptz default now()
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

If you already created tables earlier, run these instead:

```sql
alter table tasks add column if not exists last_notified_at timestamptz;

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

-- Completion fields: custom form when completing tasks, values shown in charts
alter table tasks add column if not exists completion_fields jsonb default '[]';
alter table task_completions add column if not exists completion_values jsonb default '{}';
```
```

## Row Level Security (RLS)

Enable RLS for all tables and add these policies:

```sql
alter table tasks enable row level security;
alter table task_images enable row level security;
alter table task_completions enable row level security;
alter table push_subscriptions enable row level security;

create policy "Users manage own tasks" on tasks
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage task images" on task_images
for all
using (
  auth.uid() = (select user_id from tasks where tasks.id = task_images.task_id)
)
with check (
  auth.uid() = (select user_id from tasks where tasks.id = task_images.task_id)
);

create policy "Users manage task completions" on task_completions
for all
using (
  auth.uid() = (select user_id from tasks where tasks.id = task_completions.task_id)
)
with check (
  auth.uid() = (select user_id from tasks where tasks.id = task_completions.task_id)
);

create policy "Users manage push subscriptions" on push_subscriptions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## Storage bucket

Create a public bucket named `task-images` in Supabase Storage. The app uses
public URLs for image previews. If you prefer private images, replace the public
URL usage with signed URLs and add a Storage policy for authenticated access.

## Push notifications (background)

1. Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

2. Add to `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:you@example.com
PUSH_CRON_SECRET=your-random-secret
```

3. Set a cron to hit `/api/push/send?secret=YOUR_SECRET` every 5 minutes.

In Vercel, add a Cron job (Project Settings → Cron Jobs) and paste the path.

## Supabase scheduler (alternative to Vercel Cron)

You can use Supabase's scheduler to call the push endpoint directly.

1. Open Supabase → **SQL Editor** and run:

```sql
create extension if not exists pg_net;
create extension if not exists pg_cron;

select cron.schedule(
  'tasker-push-reminders',
  '*/5 * * * *',
  $$ select net.http_get(url := 'https://YOUR-VERCEL-DOMAIN/api/push/send?secret=YOUR_SECRET'); $$
);
```

2. Replace `YOUR-VERCEL-DOMAIN` and `YOUR_SECRET`.

The SQL is also saved in `supabase/scheduler.sql`.

## Debugging push notifications

If test notifications work but task reminders don't:

1. **Check the 30‑minute window** – Notifications are sent for tasks due in the next 30 minutes. Create a task due in 10–15 minutes and wait for the next cron run.

2. **Use the debug endpoint** – Run `yarn push:urls` to print the debug URL from your `.env.local`. Or call:
   ```
   https://YOUR-VERCEL-DOMAIN/api/push/send?secret=YOUR_SECRET&debug=1
   ```
   This returns diagnostic info (server time, tasks found, subscription count) without sending. Use it when a task is due soon to confirm the cron would find it.

3. **Verify the cron** – In Supabase → Database → Extensions, ensure `pg_cron` and `pg_net` are enabled. Check cron job history if available.

Add `NEXT_PUBLIC_APP_URL` to `.env.local` with your deployed URL (e.g. `https://tasker.vercel.app`) so `yarn push:urls` uses it.

## Hosting (free options)

- Vercel (free) for Next.js frontend — deploys on push to main
- Supabase (free) for Auth, Postgres, and Storage
- Alternatives: Netlify or Cloudflare Pages for hosting
