"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import type { TaskWithExtras } from "@/lib/types";

type TaskListProps = {
  tasks: TaskWithExtras[];
  loading: boolean;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string, imagePaths: string[]) => void;
};

export function TaskList({
  tasks,
  loading,
  onComplete,
  onDelete,
}: TaskListProps) {
  const imageMap = useMemo(() => {
    const map = new Map<string, string[]>();
    tasks.forEach((task) => {
      if (!task.task_images?.length) return;
      const urls = task.task_images.map((image) => {
        const { data } = supabase.storage
          .from("task-images")
          .getPublicUrl(image.storage_path);
        return data.publicUrl;
      });
      map.set(task.id, urls);
    });
    return map;
  }, [tasks]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 text-sm text-zinc-300">
        Loading tasks...
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 text-sm text-zinc-300">
        No tasks yet. Create your first task to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {tasks.map((task) => {
        const completionCount = task.task_completions?.length ?? 0;
        const lastCompletion = task.task_completions?.[0]?.completed_at;
        const isCompleted = !task.is_repeating && completionCount > 0;
        const images = imageMap.get(task.id) ?? [];
        const imagePaths = task.task_images?.map((image) => image.storage_path) ?? [];

        return (
          <div
            key={task.id}
            className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-50">
                  {task.title}
                </h3>
                {task.description && (
                  <p className="mt-2 text-sm text-zinc-400">
                    {task.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
                  {task.due_at && (
                    <span>
                      Due{" "}
                      {format(new Date(task.due_at), "MMM dd, yyyy p")}
                    </span>
                  )}
                  {task.is_repeating && task.repeat_rule && (
                    <span>Repeats {task.repeat_rule}</span>
                  )}
                  {!task.is_repeating && (
                    <span>{isCompleted ? "Completed" : "One-time"}</span>
                  )}
                  {completionCount > 0 && (
                    <span>
                      {completionCount} completion
                      {completionCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {lastCompletion && (
                  <p className="mt-2 text-xs text-zinc-500">
                    Last completed{" "}
                    {format(new Date(lastCompletion), "MMM dd, yyyy p")}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onComplete(task.id)}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-100 transition hover:border-zinc-500"
                >
                  {task.is_repeating ? "Log completion" : "Mark complete"}
                </button>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Delete this task and its completions/images?"
                      )
                    ) {
                      onDelete(task.id, imagePaths);
                    }
                  }}
                  className="rounded-full border border-red-500/40 px-4 py-2 text-xs font-semibold text-red-200 transition hover:border-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {images.map((url, index) => (
                  <div
                    key={`${task.id}-${index}`}
                    className="overflow-hidden rounded-2xl border border-zinc-800"
                  >
                    <img
                      src={url}
                      alt={`${task.title} image ${index + 1}`}
                      className="h-28 w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
