"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { NotificationPanel } from "@/components/NotificationPanel";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useTasks } from "@/hooks/useTasks";

export default function SettingsPage() {
  const { user, loading } = useRequireAuth();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { tasks, loading: loadingTasks, error, setError, reload } = useTasks();

  const handleComplete = async (taskId: string) => {
    setError(null);
    const { error: insertError } = await supabase
      .from("task_completions")
      .insert({ task_id: taskId, completed_at: new Date().toISOString() });
    if (insertError) setError(insertError.message);
    else await reload();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
        Loading your workspace...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Settings</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage your profile, notifications, and sign out of Tasker.
          </p>
        </header>
        {error && (
          <p className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        <section className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-zinc-100/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/70">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              Appearance
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Choose light or dark mode for the interface.
            </p>
            <div className="mt-4 flex items-center gap-3">
              {!mounted ? (
                <div className="h-9 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
              ) : (
                <>
              <button
                onClick={() => setTheme("light")}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  theme === "light"
                    ? "border-zinc-400 bg-zinc-200 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
                <Sun className="h-4 w-4" aria-hidden="true" />
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  theme === "dark"
                    ? "border-zinc-600 bg-zinc-700 text-zinc-100 dark:border-zinc-500 dark:bg-zinc-600"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
                <Moon className="h-4 w-4" aria-hidden="true" />
                Dark
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  theme === "system"
                    ? "border-zinc-400 bg-zinc-200 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
                System
              </button>
                </>
              )}
            </div>
          </div>
        </section>
        <section className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-zinc-100/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/70">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              Account
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100">
              <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
              {user.email}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-800 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-500"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </section>
        <section className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-zinc-100/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/70">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              Notifications
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Control reminder permissions and review upcoming tasks.
            </p>
          </div>
          {loadingTasks ? (
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading notifications...</div>
          ) : (
            <NotificationPanel tasks={tasks} onComplete={handleComplete} />
          )}
        </section>
      </div>
    </AppShell>
  );
}
