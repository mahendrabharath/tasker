"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";

type TaskFormProps = {
  onCreated: () => void;
  onCancel?: () => void;
};

const repeatOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const INTERVAL_MINUTES = 15;

/** Format a Date for datetime-local input (yyyy-MM-ddTHH:mm). */
function toDatetimeLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

/** Parse datetime-local value to Date, or null if empty/invalid. */
function parseDatetimeLocal(value: string): Date | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Round time up to the next interval (e.g. 15 min). */
function nextInterval(date: Date, intervalMinutes: number): Date {
  const ms = intervalMinutes * 60 * 1000;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

export function TaskForm({ onCreated, onCancel }: TaskFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatRule, setRepeatRule] = useState("daily");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDatetime = toDatetimeLocal(nextInterval(new Date(), INTERVAL_MINUTES));

  const handleDueAtChange = (value: string) => {
    setDateError(null);
    const parsed = parseDatetimeLocal(value);
    setDueAt(parsed);
    if (parsed && parsed.getTime() < Date.now()) {
      setDateError("Please choose a future date and time.");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueAt(null);
    setIsRepeating(false);
    setRepeatRule("daily");
    setImages([]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    if (dueAt && dueAt.getTime() < Date.now()) {
      setError("Due time must be in the future.");
      setLoading(false);
      return;
    }

    const { data: task, error: insertError } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        due_at: dueAt ? dueAt.toISOString() : null,
        is_repeating: isRepeating,
        repeat_rule: isRepeating ? repeatRule : null,
      })
      .select()
      .single();

    if (insertError || !task) {
      setError(insertError?.message ?? "Unable to create task.");
      setLoading(false);
      return;
    }

    if (images.length > 0) {
      const uploadedPaths: string[] = [];

      for (const file of images) {
        const extension = file.name.split(".").pop() ?? "jpg";
        const filePath = `${user.id}/${task.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("task-images")
          .upload(filePath, file, { upsert: false });

        if (uploadError) {
          setError(uploadError.message);
          setLoading(false);
          return;
        }

        uploadedPaths.push(filePath);
      }

      const { error: imageError } = await supabase.from("task_images").insert(
        uploadedPaths.map((path) => ({
          task_id: task.id,
          storage_path: path,
        }))
      );

      if (imageError) {
        setError(imageError.message);
        setLoading(false);
        return;
      }
    }

    resetForm();
    onCreated();
    setLoading(false);
  };

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
      <h2 className="text-lg font-semibold text-zinc-50">Create a task</h2>
      <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="text-sm text-zinc-300">
          Title
          <input
            type="text"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
          />
        </label>
        <label className="text-sm text-zinc-300">
          Description
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-300">
            Due date & time
            <input
              type="datetime-local"
              min={minDatetime}
              step={INTERVAL_MINUTES * 60}
              value={dueAt ? toDatetimeLocal(dueAt) : ""}
              onChange={(e) => handleDueAtChange(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
              aria-invalid={dateError != null}
              aria-describedby={dateError ? "due-date-error" : undefined}
            />
          </label>
          {dateError && (
            <p id="due-date-error" className="text-xs text-amber-300" role="alert">
              {dateError}
            </p>
          )}
          <label className="text-sm text-zinc-300">
            Repeat task
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100">
              <input
                type="checkbox"
                checked={isRepeating}
                onChange={(event) => setIsRepeating(event.target.checked)}
              />
              <span className="text-xs text-zinc-400">
                Enable repetition tracking
              </span>
            </div>
          </label>
        </div>
        {isRepeating && (
          <label className="text-sm text-zinc-300">
            Repeat cadence
            <select
              value={repeatRule}
              onChange={(event) => setRepeatRule(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
            >
              {repeatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm text-zinc-300">
          Task images
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(event) =>
              setImages(Array.from(event.target.files ?? []))
            }
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-xs file:text-zinc-100"
          />
          {images.length > 0 && (
            <p className="mt-2 text-xs text-zinc-500">
              {images.length} image(s) selected
            </p>
          )}
        </label>
        {error && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Saving..." : "Create task"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
