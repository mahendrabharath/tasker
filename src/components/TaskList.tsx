"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import type { TaskWithExtras } from "@/lib/types";
import { TaskListSkeleton } from "./TaskListSkeleton";

type TaskListProps = {
  tasks: TaskWithExtras[];
  loading: boolean;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string, imagePaths: string[]) => void;
  onDeleteSelected?: (taskIds: string[], imagePathsByTask: Map<string, string[]>) => void;
  completingIds: Set<string>;
  deleteMode?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (taskId: string) => void;
  onCancelDelete?: () => void;
};

export function TaskList({
  tasks,
  loading,
  onComplete,
  onDelete,
  onDeleteSelected,
  completingIds,
  deleteMode = false,
  selectedIds = new Set(),
  onSelect,
  onCancelDelete,
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
    return <TaskListSkeleton />;
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-zinc-100/80 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
        No tasks yet. Create your first task to get started.
      </div>
    );
  }

  const handleDeleteSelected = () => {
    if (!onDeleteSelected || selectedIds.size === 0) return;
    const imagePathsByTask = new Map<string, string[]>();
    tasks.forEach((task) => {
      if (selectedIds.has(task.id) && task.task_images?.length) {
        imagePathsByTask.set(
          task.id,
          task.task_images.map((img) => img.storage_path)
        );
      }
    });
    onDeleteSelected(Array.from(selectedIds), imagePathsByTask);
  };

  return (
    <div className="flex flex-col gap-4" role="list" aria-label="Task list">
      {deleteMode && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-100/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
          <span className="text-sm text-zinc-600 dark:text-zinc-300">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancelDelete}
              aria-label="Cancel delete mode"
              className="min-h-[44px] rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:focus:ring-zinc-500 dark:focus:ring-offset-zinc-950"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0}
              aria-label={`Delete ${selectedIds.size} selected task${selectedIds.size !== 1 ? "s" : ""}`}
              className="min-h-[44px] rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-500/20 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 dark:text-red-400 dark:focus:ring-red-500 dark:focus:ring-offset-zinc-950 disabled:focus:ring-0"
            >
              Delete selected
            </button>
          </div>
        </div>
      )}
      {tasks.map((task) => {
        const completionCount = task.task_completions?.length ?? 0;
        const lastCompletion = task.task_completions?.[0]?.completed_at;
        const isCompleted = !task.is_repeating && completionCount > 0;
        const dueDate = task.due_at ? new Date(task.due_at) : null;
        const isOverdue =
          dueDate && dueDate.getTime() < Date.now() && !isCompleted;
        const isDueSoon =
          dueDate &&
          !isCompleted &&
          !isOverdue &&
          dueDate.getTime() > Date.now() &&
          dueDate.getTime() - Date.now() <= 1000 * 60 * 60 * 6;
        const images = imageMap.get(task.id) ?? [];
        const imagePaths =
          task.task_images?.map((image) => image.storage_path) ?? [];
        const isCompleting = completingIds.has(task.id);
        const isSelected = selectedIds.has(task.id);

        return (
          <article
            key={task.id}
            role="listitem"
            aria-label={`Task: ${task.title}`}
            className={`rounded-3xl border p-6 transition ${
              deleteMode
                ? isSelected
                  ? "border-zinc-400 bg-zinc-200/50 dark:border-zinc-600 dark:bg-zinc-800/50"
                  : "border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/70"
                : "border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/70"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                {deleteMode && (
                  <button
                    type="button"
                    onClick={() => onSelect?.(task.id)}
                    className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                      isSelected
                        ? "border-zinc-600 bg-zinc-600 dark:border-zinc-400 dark:bg-zinc-400"
                        : "border-zinc-400 dark:border-zinc-600"
                    }`}
                    aria-label={isSelected ? "Deselect task" : "Select task"}
                  >
                    {isSelected && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 12 12"
                      >
                        <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                      </svg>
                    )}
                  </button>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {task.due_at && (
                      <span>
                        Due{" "}
                        {format(new Date(task.due_at), "MMM dd, yyyy p")}
                      </span>
                    )}
                    {!task.due_at && <span>No due date</span>}
                    {completionCount > 0 && (
                      <span>
                        {completionCount} completion
                        {completionCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {task.is_repeating && task.repeat_rule && (
                      <span className="rounded-full border border-zinc-300 bg-zinc-200/60 px-3 py-1 text-zinc-700 dark:border-zinc-700/60 dark:bg-zinc-800/40 dark:text-zinc-300">
                        Repeats {task.repeat_rule}
                      </span>
                    )}
                    {!task.is_repeating && (
                      <span className="rounded-full border border-zinc-300 bg-zinc-200/60 px-3 py-1 text-zinc-700 dark:border-zinc-700/60 dark:bg-zinc-800/40 dark:text-zinc-300">
                        One-time
                      </span>
                    )}
                    {isCompleted && (
                      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-200">
                        Completed
                      </span>
                    )}
                    {isOverdue && (
                      <span className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-red-700 dark:text-red-200">
                        Overdue
                      </span>
                    )}
                    {isDueSoon && (
                      <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-200">
                        Due soon
                      </span>
                    )}
                    {!isCompleted && !isOverdue && !isDueSoon && dueDate && (
                      <span className="rounded-full border border-zinc-300 bg-zinc-200/60 px-3 py-1 text-zinc-700 dark:border-zinc-700/60 dark:bg-zinc-800/40 dark:text-zinc-300">
                        Upcoming
                      </span>
                    )}
                  </div>
                  {lastCompletion && (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                      Last completed{" "}
                      {format(new Date(lastCompletion), "MMM dd, yyyy p")}
                    </p>
                  )}
                </div>
              </div>
              {!deleteMode && (
                <div className="flex flex-wrap items-center gap-2">
                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={() => onComplete(task.id)}
                      disabled={isCompleting}
                      aria-label={
                        task.is_repeating
                          ? `Log completion for ${task.title}`
                          : `Mark ${task.title} as complete`
                      }
                      className={`min-h-[44px] rounded-full border border-zinc-400 px-4 py-2 text-xs font-semibold text-zinc-800 transition hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-500 dark:focus:ring-zinc-500 dark:focus:ring-offset-zinc-950 ${isCompleting ? "opacity-60" : ""}`}
                    >
                      {isCompleting
                        ? "Saving..."
                        : task.is_repeating
                        ? "Log completion"
                        : "Mark complete"}
                    </button>
                  )}
                </div>
              )}
            </div>
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {images.map((url, index) => (
                  <div
                    key={`${task.id}-${index}`}
                    className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
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
          </article>
        );
      })}
    </div>
  );
}
