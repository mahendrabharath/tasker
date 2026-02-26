"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, Plus, Trash2 } from "lucide-react";
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
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
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
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);

  useEffect(() => {
    const pick =
      inspirations[Math.floor(Math.random() * inspirations.length)] ??
      inspirations[0];
    setInspiration(pick);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    setHeroImageLoaded(false);
    const img = new Image();
    img.onload = () => setHeroImageLoaded(true);
    img.src = inspiration.image;
  }, [inspiration.image]);

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm]);

  const handleComplete = async (
    taskId: string,
    values?: Record<string, number | string>
  ) => {
    setCompletingIds((prev) => new Set(prev).add(taskId));
    const { error: insertError } = await supabase
      .from("task_completions")
      .insert({
        task_id: taskId,
        completed_at: new Date().toISOString(),
        completion_values: values ?? {},
      });

    if (insertError) {
      setError(insertError.message);
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      throw new Error(insertError.message);
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

  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];
    const isCompleted = (t: (typeof filteredTasks)[0]) =>
      !t.is_repeating && (t.task_completions?.length ?? 0) > 0;
    return list.sort((a, b) => {
      const aDone = isCompleted(a);
      const bDone = isCompleted(b);
      if (aDone === bDone) return 0;
      return aDone ? 1 : -1;
    });
  }, [filteredTasks]);

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

  const handleDeleteSelected = async (
    taskIds: string[],
    imagePathsByTask: Map<string, string[]>
  ) => {
    setError(null);
    const allPaths: string[] = [];
    imagePathsByTask.forEach((paths) => allPaths.push(...paths));

    if (allPaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("task-images")
        .remove(allPaths);

      if (storageError) {
        setError(storageError.message);
        return;
      }
    }

    for (const taskId of taskIds) {
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }
    }

    setDeleteMode(false);
    setSelectedIds(new Set());
    reload();
  };

  const handleSelect = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
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
        <section
          className="relative min-h-[280px] overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-200 md:min-h-[360px] dark:border-zinc-800 dark:bg-zinc-900"
          aria-label="Daily focus"
        >
          <div
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${
              heroImageLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${inspiration.image})` }}
          />
          {!heroImageLoaded && (
            <div
              className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-300 via-zinc-200 to-zinc-300 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800"
              aria-hidden
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/95 via-zinc-950/80 to-zinc-900/85" />
          <div className="relative z-10 flex flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-300">
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
            <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-zinc-100/80 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/70">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Task filters
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {completedTasks.length} completed · {activeTasks.length} active
                </p>
              </div>
              <div className="flex min-h-[44px] flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                <button
                  type="button"
                  onClick={() => setShowForm((prev) => !prev)}
                  aria-label={showForm ? "Hide create task form" : "Create new task"}
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full px-4 py-2 font-semibold transition focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:focus:ring-zinc-500 dark:focus:ring-offset-zinc-950 ${
                    showForm
                      ? "border border-zinc-300 text-zinc-800 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-600"
                      : "border border-zinc-300 bg-zinc-900 text-white hover:bg-zinc-800 dark:border-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                  }`}
                >
                  {showForm ? (
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  )}
                  {showForm ? "Hide form" : "Create task"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteMode((prev) => {
                      if (!prev) setSelectedIds(new Set());
                      return !prev;
                    });
                  }}
                  aria-label={deleteMode ? "Cancel delete mode" : "Delete tasks"}
                  aria-pressed={deleteMode}
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full px-4 py-2 font-semibold transition focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:focus:ring-zinc-500 dark:focus:ring-offset-zinc-950 ${
                    deleteMode
                      ? "border border-red-500/50 bg-red-500/20 text-red-600 dark:text-red-400"
                      : "border border-zinc-200 px-4 py-2 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                  }`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </button>
                {(["all", "active", "completed"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    aria-pressed={filter === key}
                    aria-label={`Show ${key} tasks`}
                    className={`min-h-[44px] min-w-[44px] rounded-full border px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:focus:ring-zinc-500 dark:focus:ring-offset-zinc-950 ${
                      filter === key
                        ? "border-zinc-300 bg-zinc-900 text-white dark:border-zinc-800 dark:bg-white dark:text-zinc-900"
                        : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
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
              <p className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            )}
            <TaskList
              tasks={sortedTasks}
              loading={loadingTasks}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onDeleteSelected={handleDeleteSelected}
              completingIds={completingIds}
              deleteMode={deleteMode}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onCancelDelete={() => {
                setDeleteMode(false);
                setSelectedIds(new Set());
              }}
            />
          </div>
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-zinc-200 bg-zinc-100/80 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
              Your analytics and notification feeds now live in their own tabs.
              Explore the insights in Analytics or manage reminders in Notifications.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
