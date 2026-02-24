"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import type { TaskWithExtras } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

type NotificationPanelProps = {
  tasks: TaskWithExtras[];
  onComplete?: (taskId: string) => Promise<void>;
};

export function NotificationPanel({ tasks, onComplete }: NotificationPanelProps) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" ? Notification.permission : "default"
  );
  const [status, setStatus] = useState<"idle" | "enabled" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const horizon = new Date(now.getTime() + 1000 * 60 * 60 * 6);

    return tasks
      .filter((task) => task.due_at)
      .map((task) => ({ task, due: new Date(task.due_at as string) }))
      .filter(({ due }) => due >= now && due <= horizon)
      .sort((a, b) => a.due.getTime() - b.due.getTime());
  }, [tasks]);

  useEffect(() => {
    const checkExistingSubscription = async () => {
      if (!("serviceWorker" in navigator)) return;
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        setStatus("enabled");
      }
    };

    if (permission === "granted") {
      checkExistingSubscription();
    }
  }, [permission]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  };

  const enablePush = async () => {
    setStatusMessage(null);
    if (!("serviceWorker" in navigator)) {
      setStatus("error");
      setStatusMessage("Service workers are not supported in this browser.");
      return;
    }
    if (!vapidPublicKey) {
      setStatus("error");
      setStatusMessage("Missing VAPID public key in env.");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") {
      setStatus("error");
      setStatusMessage("Notification permission was not granted.");
      return;
    }

    await navigator.serviceWorker.register("/sw.js");
    const registration = await navigator.serviceWorker.ready;
    const existingSubscription =
      await registration.pushManager.getSubscription();
    const subscription =
      existingSubscription ??
      (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      }));

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setStatus("error");
      setStatusMessage("No active session found.");
      return;
    }

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ subscription }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setStatus("error");
      setStatusMessage(payload?.error ?? "Unable to enable notifications.");
      return;
    }

    setStatus("enabled");
    setStatusMessage("Push notifications enabled.");
  };

  const sendTest = async () => {
    setStatusMessage(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setStatus("error");
      setStatusMessage("No active session found.");
      return;
    }

    const response = await fetch("/api/push/test", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setStatus("error");
      setStatusMessage(payload?.error ?? "Unable to send test notification.");
      return;
    }

    setStatusMessage("Test notification sent.");
  };

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">
            Notifications
          </h2>
          <p className="text-xs text-zinc-400">
            Push notifications delivered even when the browser is closed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={enablePush}
            className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-100 transition hover:border-zinc-500"
          >
            {status === "enabled" ? "Notifications enabled" : "Enable push"}
          </button>
          <button
            onClick={sendTest}
            className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-100 transition hover:border-zinc-500"
          >
            Send test
          </button>
        </div>
      </div>
      {statusMessage && (
        <p
          className={`mt-3 rounded-2xl border px-4 py-3 text-xs ${
            status === "error"
              ? "border-red-500/40 bg-red-500/10 text-red-300"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {statusMessage}
        </p>
      )}
      <div className="mt-4">
        {upcomingTasks.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No upcoming tasks in the next 6 hours.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {upcomingTasks.map(({ task, due }) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200"
              >
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-zinc-500">
                    Due in {formatDistanceToNowStrict(due)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">
                    {due.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {onComplete && (
                    <button
                      onClick={async () => {
                        setCompletingId(task.id);
                        await onComplete(task.id);
                        setCompletingId(null);
                      }}
                      disabled={completingId === task.id}
                      className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-60"
                    >
                      {completingId === task.id ? "Saving..." : "Mark complete"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
