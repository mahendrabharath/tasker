"use client";

import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useTasks } from "@/hooks/useTasks";

const ChartsPanel = dynamic(
  () => import("@/components/ChartsPanel").then((m) => ({ default: m.ChartsPanel })),
  { ssr: false }
);

const FocusHeatmap = dynamic(
  () => import("@/components/FocusHeatmap").then((m) => ({ default: m.FocusHeatmap })),
  { ssr: false }
);

export default function AnalyticsPage() {
  const { user, loading } = useRequireAuth();
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
          <h2 className="inline-flex items-center gap-2 text-2xl font-semibold text-zinc-100">
            <BarChart3 className="h-5 w-5 text-zinc-400" aria-hidden="true" />
            Analytics
          </h2>
          <p className="text-sm text-zinc-400">
            Track your focus score, completion streaks, and progress trends.
          </p>
        </header>
        {error && (
          <p className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </p>
        )}
        {loadingTasks ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 text-sm text-zinc-400">
            Loading analytics...
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <FocusHeatmap tasks={tasks} />
            <ChartsPanel tasks={tasks} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
