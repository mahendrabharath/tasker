import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createCompleteToken } from "@/lib/notificationToken";

export const runtime = "nodejs";

type SubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function GET(request: Request) {
  return handleSend(request);
}

export async function POST(request: Request) {
  return handleSend(request);
}

async function handleSend(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const debug = url.searchParams.get("debug") === "1";
  const expectedSecret = process.env.PUSH_CRON_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:hello@example.com";

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json(
      { error: "Missing VAPID keys." },
      { status: 500 }
    );
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const now = new Date();
  const windowMinutes = 30;
  const horizon = new Date(now.getTime() + 1000 * 60 * windowMinutes);
  const minNotifiedAt = new Date(now.getTime() - 1000 * 60 * 5).toISOString();

  const { data: tasks, error: taskError } = await supabaseAdmin
    .from("tasks")
    .select("id, title, user_id, due_at, last_notified_at")
    .not("due_at", "is", null)
    .gte("due_at", now.toISOString())
    .lte("due_at", horizon.toISOString())
    .or(`last_notified_at.is.null,last_notified_at.lt.${minNotifiedAt}`);

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }

  if (debug) {
    const { count: subCount } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      debug: true,
      serverTime: now.toISOString(),
      serverTimeLocal: now.toString(),
      horizon: horizon.toISOString(),
      window: `Tasks due between now and ${windowMinutes} minutes from now (skipping if notified in last 5 min)`,
      tasksToSend: (tasks ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        due_at: t.due_at,
        last_notified_at: t.last_notified_at,
      })),
      subscriptionCount: subCount ?? 0,
      note: "Add ?debug=1 to the cron URL to see this. Remove it for normal operation.",
    });
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const userIds = Array.from(new Set(tasks.map((task) => task.user_id)));

  const { data: subscriptions, error: subError } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  const subscriptionMap = new Map<string, SubscriptionRow[]>();
  (subscriptions ?? []).forEach((sub) => {
    const list = subscriptionMap.get(sub.user_id) ?? [];
    list.push(sub);
    subscriptionMap.set(sub.user_id, list);
  });

  let sent = 0;
  for (const task of tasks) {
    const subs = subscriptionMap.get(task.user_id) ?? [];
    if (subs.length === 0) continue;

    const completeToken = createCompleteToken(task.id, task.user_id);
    const taskTitle = task.title?.trim() || "Task";
    const payload = JSON.stringify({
      title: taskTitle,
      body: `${taskTitle} due soon`,
      url: "/app/dashboard",
      taskId: task.id,
      completeToken,
    });

    await Promise.all(
      subs.map((sub) =>
        webpush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          )
          .then(() => {
            sent += 1;
          })
          .catch(() => null)
      )
    );

    await supabaseAdmin
      .from("tasks")
      .update({ last_notified_at: new Date().toISOString() })
      .eq("id", task.id);
  }

  return NextResponse.json({ ok: true, sent });
}
