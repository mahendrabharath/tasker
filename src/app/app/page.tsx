"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { TaskWithExtras } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import { ChartsPanel } from "@/components/ChartsPanel";
import { NotificationPanel } from "@/components/NotificationPanel";

export default function AppPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [tasks, setTasks] = useState<TaskWithExtras[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
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

  const loadTasks = async () => {
    if (!user) return;
    setLoadingTasks(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("tasks")
      .select("*, task_images(*), task_completions(*)")
      .order("created_at", { ascending: false })
      .order("completed_at", { foreignTable: "task_completions", ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoadingTasks(false);
      return;
    }

    setTasks(data ?? []);
    setLoadingTasks(false);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

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
    const { error: insertError } = await supabase
      .from("task_completions")
      .insert({ task_id: taskId, completed_at: new Date().toISOString() });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    loadTasks();
  };

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

    loadTasks();
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
        <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${inspiration.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/95 via-zinc-950/80 to-zinc-900/85" />
          <div className="relative z-10 flex flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
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
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="rounded-full bg-white px-6 py-3 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-200"
                >
                  Create task
                </button>
                <button
                  onClick={() => setShowForm((prev) => !prev)}
                  className="rounded-full border border-zinc-700 px-6 py-3 text-xs font-semibold text-zinc-100 transition hover:border-zinc-500"
                >
                  {showForm ? "Hide form" : "Toggle form"}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-zinc-300">
              <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-2">
                One-time tasks
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-2">
                Repeating routines
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-2">
                Reminders + charts
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            {showForm && (
              <div ref={formRef}>
                <TaskForm
                  onCreated={() => {
                    loadTasks();
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
              tasks={tasks}
              loading={loadingTasks}
              onComplete={handleComplete}
              onDelete={handleDelete}
            />
          </div>
          <div className="flex flex-col gap-6">
            <ChartsPanel tasks={tasks} />
            <NotificationPanel tasks={tasks} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
