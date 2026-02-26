"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import { isSameDay, set as setDateParts, startOfDay } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import type { CompletionFieldDef } from "@/lib/types";

type TaskFormProps = {
  onCreated: () => void;
  onCancel?: () => void;
};

const repeatOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function TaskForm({ onCreated, onCancel }: TaskFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [pickerNow, setPickerNow] = useState<Date>(new Date());
  const selectedDate = dueAt ?? pickerNow;
  const todayStart = startOfDay(pickerNow);
  const isToday = isSameDay(selectedDate, pickerNow);
  const roundToNextInterval = (date: Date, intervalMinutes: number) => {
    const intervalMs = intervalMinutes * 60 * 1000;
    return new Date(Math.ceil(date.getTime() / intervalMs) * intervalMs);
  };
  const minSelectableTime = isToday
    ? roundToNextInterval(pickerNow, 15)
    : startOfDay(selectedDate);
  const minTime = minSelectableTime;
  const maxTime = setDateParts(selectedDate, {
    hours: 23,
    minutes: 45,
    seconds: 0,
    milliseconds: 0,
  });
  const filterTime = (time: Date) => {
    if (!isToday) return true;
    return time.getTime() >= minSelectableTime.getTime();
  };
  const handleDateChange = (date: Date | null) => {
    if (!date) {
      setDateError(null);
      setDueAt(null);
      return;
    }
    const current = new Date();
    if (isSameDay(date, current) && date.getTime() < current.getTime()) {
      setDateError("Please choose a future time.");
      setDueAt(roundToNextInterval(current, 15));
      return;
    }
    setDateError(null);
    setDueAt(date);
  };
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatRule, setRepeatRule] = useState("daily");
  const [images, setImages] = useState<File[]>([]);
  const [completionFields, setCompletionFields] = useState<CompletionFieldDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCompletionField = () => {
    setCompletionFields((prev) => [
      ...prev,
      { type: "number", label: "", tag: "" },
    ]);
  };
  const removeCompletionField = (index: number) => {
    setCompletionFields((prev) => prev.filter((_, i) => i !== index));
  };
  const updateCompletionField = (
    index: number,
    updates: Partial<CompletionFieldDef>
  ) => {
    setCompletionFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueAt(null);
    setIsRepeating(false);
    setRepeatRule("daily");
    setImages([]);
    setCompletionFields([]);
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

    const validFields = completionFields.filter(
      (f) => f.label.trim() && f.tag.trim()
    );
    const { data: task, error: insertError } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        due_at: dueAt ? dueAt.toISOString() : null,
        is_repeating: isRepeating,
        repeat_rule: isRepeating ? repeatRule : null,
        completion_fields: validFields.length > 0 ? validFields : null,
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
    <section className="rounded-3xl border border-zinc-200 bg-zinc-100/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/70">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Create a task</h2>
      <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="text-sm text-zinc-600 dark:text-zinc-300">
          Title
          <input
            type="text"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <label className="text-sm text-zinc-600 dark:text-zinc-300">
          Description
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            Due date & time
            <div className="mt-2">
              <DatePicker
                selected={dueAt}
                onChange={handleDateChange}
                showTimeSelect
                timeIntervals={15}
                minDate={todayStart}
                minTime={minTime}
                maxTime={maxTime}
                filterTime={filterTime}
                shouldCloseOnSelect={false}
                open={isPickerOpen}
                onInputClick={() => {
                  setPickerNow(new Date());
                  setIsPickerOpen(true);
                }}
                onClickOutside={() => setIsPickerOpen(false)}
                dateFormat="MMM d, yyyy h:mm aa"
                placeholderText="Select date and time"
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                calendarClassName="tasker-datepicker"
                popperClassName="tasker-datepicker-popper"
                popperPlacement="bottom-start"
                calendarContainer={({ className, children }) => (
                  <div className={`${className} tasker-datepicker-shell`}>
                    <div className="tasker-datepicker-body">{children}</div>
                    <div className="tasker-datepicker-footer">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setIsPickerOpen(false);
                        }}
                        className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-100 transition hover:border-zinc-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setIsPickerOpen(false);
                        }}
                        className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-200"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              />
            </div>
          </label>
          {dateError && (
            <p className="text-xs text-amber-600 dark:text-amber-300">{dateError}</p>
          )}
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            Repeat task
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
              <input
                type="checkbox"
                checked={isRepeating}
                onChange={(event) => setIsRepeating(event.target.checked)}
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Enable repetition tracking
              </span>
            </div>
          </label>
        </div>
        {isRepeating && (
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            Repeat cadence
            <select
              value={repeatRule}
              onChange={(event) => setRepeatRule(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {repeatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Completion fields
            </h3>
            <button
              type="button"
              onClick={addCompletionField}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add field
            </button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            When completing this task, show a form to capture values (e.g.
            pellets given). Tag is used in charts.
          </p>
          {completionFields.map((field, index) => (
            <div
              key={index}
              className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <label className="min-w-[120px] flex-1 text-xs text-zinc-600 dark:text-zinc-400">
                Label
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) =>
                    updateCompletionField(index, { label: e.target.value })
                  }
                  placeholder="e.g. How many pellets?"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </label>
              <label className="min-w-[100px] flex-1 text-xs text-zinc-600 dark:text-zinc-400">
                Tag (chart)
                <input
                  type="text"
                  value={field.tag}
                  onChange={(e) =>
                    updateCompletionField(index, {
                      tag: e.target.value.toLowerCase().replace(/\s/g, "_"),
                    })
                  }
                  placeholder="e.g. pellets"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </label>
              <label className="text-xs text-zinc-600 dark:text-zinc-400">
                Type
                <select
                  value={field.type}
                  onChange={(e) =>
                    updateCompletionField(index, {
                      type: e.target.value as "number" | "text",
                    })
                  }
                  className="ml-2 mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="number">Number</option>
                  <option value="text">Text</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => removeCompletionField(index)}
                aria-label="Remove field"
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        {/* Task images - commented out until storage RLS is configured
        <label className="text-sm text-zinc-600 dark:text-zinc-300">
          Task images
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(event) =>
              setImages(Array.from(event.target.files ?? []))
            }
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-200 file:px-3 file:py-2 file:text-xs file:text-zinc-800 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:file:bg-zinc-800 dark:file:text-zinc-100"
          />
          {images.length > 0 && (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
              {images.length} image(s) selected
            </p>
          )}
        </label>
        */}
        {error && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full border border-zinc-300 bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Saving..." : "Create task"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
