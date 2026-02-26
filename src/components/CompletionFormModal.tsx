"use client";

import { useState } from "react";
import type { CompletionFieldDef, TaskWithExtras } from "@/lib/types";

type CompletionFormModalProps = {
  task: TaskWithExtras;
  onClose: () => void;
  onSubmit: (values: Record<string, number | string>) => Promise<void>;
};

export function CompletionFormModal({
  task,
  onClose,
  onSubmit,
}: CompletionFormModalProps) {
  const fields = (task.completion_fields ?? []).filter(
    (f) => f.label?.trim() && f.tag?.trim()
  );
  const [values, setValues] = useState<Record<string, number | string>>(() => {
    const init: Record<string, number | string> = {};
    fields.forEach((f) => {
      init[f.tag] = f.type === "number" ? 0 : "";
    });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (tag: string, type: "number" | "text", val: string) => {
    setValues((prev) => ({
      ...prev,
      [tag]: type === "number" ? (parseFloat(val) || 0) : val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  if (fields.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-form-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h2
          id="completion-form-title"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Log completion: {task.title}
        </h2>
        <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
          {fields.map((field: CompletionFieldDef) => (
            <label
              key={field.tag}
              className="text-sm text-zinc-600 dark:text-zinc-300"
            >
              {field.label}
              {field.type === "number" ? (
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={values[field.tag] ?? 0}
                  onChange={(e) =>
                    handleChange(field.tag, "number", e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              ) : (
                <input
                  type="text"
                  value={String(values[field.tag] ?? "")}
                  onChange={(e) =>
                    handleChange(field.tag, "text", e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              )}
            </label>
          ))}
          {error && (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full border border-zinc-300 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-70 dark:border-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Saving..." : "Log completion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
