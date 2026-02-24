"use client";

import { useMemo } from "react";
import { eachDayOfInterval, format, startOfDay, subDays } from "date-fns";
import type { TaskWithExtras } from "@/lib/types";

type FocusHeatmapProps = {
  tasks: TaskWithExtras[];
};

type DayCell = {
  date: Date;
  count: number;
  taskNames: string[];
};

const WEEK_COUNT = 12;
const DAYS_PER_WEEK = 7;
const TOTAL_DAYS = WEEK_COUNT * DAYS_PER_WEEK;

export function FocusHeatmap({ tasks }: FocusHeatmapProps) {
  const { weeks, focusScore } = useMemo(() => {
    const today = startOfDay(new Date());
    const start = subDays(today, TOTAL_DAYS - 1);
    const days = eachDayOfInterval({ start, end: today });

    const completionMap = new Map<string, { count: number; tasks: Set<string> }>();
    tasks.forEach((task) => {
      (task.task_completions ?? []).forEach((completion) => {
        const key = format(new Date(completion.completed_at), "yyyy-MM-dd");
        const entry = completionMap.get(key) ?? { count: 0, tasks: new Set<string>() };
        entry.count += 1;
        entry.tasks.add(task.title);
        completionMap.set(key, entry);
      });
    });

    const dayCells: DayCell[] = days.map((date) => {
      const key = format(date, "yyyy-MM-dd");
      const entry = completionMap.get(key);
      return {
        date,
        count: entry?.count ?? 0,
        taskNames: entry ? Array.from(entry.tasks) : [],
      };
    });

    const weeks: DayCell[][] = [];
    for (let i = 0; i < WEEK_COUNT; i += 1) {
      weeks.push(dayCells.slice(i * DAYS_PER_WEEK, (i + 1) * DAYS_PER_WEEK));
    }

    const focusWindowStart = subDays(today, 27);
    const focusDays = dayCells.filter(
      (cell) => cell.date >= focusWindowStart && cell.date <= today
    );
    const activeDays = focusDays.filter((cell) => cell.count > 0).length;
    const focusScore = Math.round((activeDays / focusDays.length) * 100);

    return { weeks, focusScore };
  }, [tasks]);

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-zinc-900/60";
    if (count === 1) return "bg-emerald-500/30";
    if (count === 2) return "bg-emerald-500/50";
    if (count === 3) return "bg-emerald-500/70";
    return "bg-emerald-400";
  };

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">Focus Heatmap</h2>
          <p className="text-xs text-zinc-400">
            Daily completions over the last 12 weeks.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-300">
          Focus Score
          <span className="ml-2 text-sm font-semibold text-zinc-50">
            {focusScore}%
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="flex gap-2">
          {weeks.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className="flex flex-col gap-2">
              {week.map((cell) => (
                <div
                  key={cell.date.toISOString()}
                  title={
                    cell.count > 0
                      ? `${format(cell.date, "MMM dd, yyyy")}: ${cell.count} completion${cell.count === 1 ? "" : "s"} — ${cell.taskNames.join(", ")}`
                      : format(cell.date, "MMM dd, yyyy")
                  }
                  className={`h-3.5 w-3.5 rounded-sm border border-zinc-800 ${getIntensity(
                    cell.count
                  )}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
