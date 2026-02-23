"use client";

import { LogOut, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { NotificationPanel } from "@/components/NotificationPanel";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useTasks } from "@/hooks/useTasks";

export default function SettingsPage() {
  const { user, loading } = useRequireAuth();
  const { signOut } = useAuth();
  const { tasks, loading: loadingTasks, error } = useTasks();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-400">
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
          <h2 className="text-2xl font-semibold text-zinc-100">Settings</h2>
          <p className="text-sm text-zinc-400">
            Manage your profile, notifications, and sign out of Tasker.
          </p>
        </header>
        {error && (
          <p className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </p>
        )}
        <section className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
              Account
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-100">
              <User className="h-4 w-4 text-zinc-400" aria-hidden="true" />
              {user.email}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-100 transition hover:border-zinc-500"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </section>
        <section className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
              Notifications
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              Control reminder permissions and review upcoming tasks.
            </p>
          </div>
          {loadingTasks ? (
            <div className="text-sm text-zinc-400">Loading notifications...</div>
          ) : (
            <NotificationPanel tasks={tasks} />
          )}
        </section>
      </div>
    </AppShell>
  );
}
