"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useTasks } from "@/hooks/useTasks";
import { AppShell } from "@/components/AppShell";
import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";

export default function DashboardPage() {
  const { user, loading } = useRequireAuth();
  const { tasks, loading: loadingTasks, error, setError, reload } = useTasks();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [completingIds, setCompletingIds] = useState<Set<string>>(
    () => new Set()
  );
  const formRef = useRef<HTMLDivElement | null>(null);

  const inspirations = useMemo(
    () => [
      {
        quote: "The secret of getting ahead is getting started.",
        author: "Mark Twain",
        image:
          "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80",
      },
      {
        quote: "It always seems impossible until it is done.",
        author: "Nelson Mandela",
        image:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
      },
      {
        quote: "Success is the sum of small efforts, repeated.",
        author: "Robert Collier",
        image:
          "https://images.unsplash.com/photo-1471879832106-c7ab9e0cee23?auto=format&fit=crop&w=1600&q=80",
      },
      {
        quote: "Focus on being productive instead of busy.",
        author: "Tim Ferriss",
        image:
          "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80",
      },
    ],
    []
  );
  const [inspiration, setInspiration] = useState(inspirations[0]);
  useEffect(() => {
    const pick =
      inspirations[Math.floor(Math.random() * inspirations.length)] ??
      inspirations[0];
    setInspiration(pick);
  }, [inspirations]);

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm]);

  const handleComplete = async (taskId: string) => {
    setCompletingIds((prev) => new Set(prev).add(taskId));
    const { error: insertError } = await supabase
      .from("task_completions")
      .insert({ task_id: taskId, completed_at: new Date().toISOString() });

    if (insertError) {
      setError(insertError.message);
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      return;
    }

    reload();
    setCompletingIds((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  };

  const completedTasks = tasks.filter(
    (task) => !task.is_repeating && (task.task_completions?.length ?? 0) > 0
  );
  const activeTasks = tasks.filter(
    (task) =>
      task.is_repeating ||
      (task.task_completions?.length ?? 0) === 0
  );
  const filteredTasks =
    filter === "completed"
      ? completedTasks
      : filter === "active"
      ? activeTasks
      : tasks;

  const handleDelete = async (taskId: string, imagePaths: string[]) => {
    setError(null);

    if (imagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("task-images")
        .remove(imagePaths);

      if (storageError) {
        setError(storageError.message);
        return;
      }
    }

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    reload();
  };

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
        <section className="relative min-h-[280px] overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 md:min-h-[360px]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${inspiration.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/95 via-zinc-950/80 to-zinc-900/85" />
          <div className="relative z-10 flex flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
                Daily focus
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-zinc-50 md:text-3xl">
                {inspiration.quote}
              </h2>
              <p className="mt-2 text-xs text-zinc-300">
                <sub>— {inspiration.author}</sub>
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/70 px-6 py-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Task filters
                </h3>
                <p className="text-xs text-zinc-400">
                  {completedTasks.length} completed · {activeTasks.length} active
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                <button
                  onClick={() => setShowForm((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition ${
                    showForm
                      ? "border border-zinc-800 text-zinc-100 hover:border-zinc-600"
                      : "bg-white text-zinc-900 hover:bg-zinc-200"
                  }`}
                >
                  {showForm ? (
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  )}
                  {showForm ? "Hide form" : "Create task"}
                </button>
                {(["all", "active", "completed"] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`rounded-full border border-zinc-800 px-4 py-2 transition ${
                      filter === key
                        ? "bg-white text-zinc-900"
                        : "hover:border-zinc-600"
                    }`}
                  >
                    {key === "all"
                      ? "All"
                      : key === "active"
                      ? "Active"
                      : "Completed"}
                  </button>
                ))}
              </div>
            </div>
            {showForm && (
              <div ref={formRef}>
                <TaskForm
                  onCreated={() => {
                    reload();
                    setShowForm(false);
                  }}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            )}
            {error && (
              <p className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </p>
            )}
            <TaskList
              tasks={filteredTasks}
              loading={loadingTasks}
              onComplete={handleComplete}
              onDelete={handleDelete}
              completingIds={completingIds}
            />
          </div>
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 text-sm text-zinc-300">
              Your analytics and notification feeds now live in their own tabs.
              Explore the insights in Analytics or manage reminders in Notifications.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
