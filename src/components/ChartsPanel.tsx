"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  addHours,
  eachDayOfInterval,
  eachHourOfInterval,
  format,
  startOfHour,
  subDays,
  subHours,
} from "date-fns";
import type { TaskWithExtras } from "@/lib/types";

type ChartsPanelProps = {
  tasks: TaskWithExtras[];
};

const chartOptions = ["bar", "line", "area"] as const;
type ChartType = (typeof chartOptions)[number];
const scopeOptions = ["repeating", "all"] as const;
type ScopeType = (typeof scopeOptions)[number];
const rangeOptions = [
  { id: "12h", label: "12 hours" },
  { id: "24h", label: "24 hours" },
  { id: "7d", label: "Weekly" },
] as const;
type RangeType = (typeof rangeOptions)[number]["id"];

export function ChartsPanel({ tasks }: ChartsPanelProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [scope, setScope] = useState<ScopeType>("all");
  const [range, setRange] = useState<RangeType>("7d");

  const buildData = (
    sourceTasks: TaskWithExtras[],
    rangeType: RangeType
  ): { label: string; count: number; taskNames: string[] }[] => {
    const now = new Date();

    if (rangeType === "12h" || rangeType === "24h") {
      const hoursBack = rangeType === "12h" ? 12 : 24;
      const start = subHours(now, hoursBack);
      const hours = eachHourOfInterval({ start, end: addHours(now, 1) });

      const base = new Map<
        string,
        { count: number; tasks: Set<string> }
      >();
      hours.forEach((hour) => {
        const key = format(hour, "HH:mm");
        base.set(key, { count: 0, tasks: new Set<string>() });
      });

      sourceTasks.forEach((task) => {
        (task.task_completions ?? []).forEach((completion) => {
          const completedAt = new Date(completion.completed_at);
          if (completedAt < start || completedAt > now) return;
          const hourKey = format(startOfHour(completedAt), "HH:mm");
          const entry = base.get(hourKey);
          if (entry) {
            entry.count += 1;
            entry.tasks.add(task.title);
          }
        });
      });

      return Array.from(base.entries()).map(([label, entry]) => ({
        label,
        count: entry.count,
        taskNames: Array.from(entry.tasks),
      }));
    }

    const start = subDays(now, 6);
    const days = eachDayOfInterval({ start, end: now });
    const base = new Map<
      string,
      { count: number; tasks: Set<string> }
    >();
    days.forEach((day) => {
      const key = format(day, "MMM dd");
      base.set(key, { count: 0, tasks: new Set<string>() });
    });

    sourceTasks.forEach((task) => {
      (task.task_completions ?? []).forEach((completion) => {
        const key = format(new Date(completion.completed_at), "MMM dd");
        const entry = base.get(key);
        if (entry) {
          entry.count += 1;
          entry.tasks.add(task.title);
        }
      });
    });

    return Array.from(base.entries()).map(([label, entry]) => ({
      label,
      count: entry.count,
      taskNames: Array.from(entry.tasks),
    }));
  };

  const sourceTasks = useMemo(() => {
    const repeatingTasks = tasks.filter((task) => task.is_repeating);
    return scope === "repeating" ? repeatingTasks : tasks;
  }, [tasks, scope]);

  const data = useMemo(
    () => buildData(sourceTasks, range),
    [sourceTasks, range]
  );

  const hasData = data.some((entry) => entry.count > 0);

  const rangeLabel =
    range === "12h"
      ? "last 12 hours"
      : range === "24h"
      ? "last 24 hours"
      : "last 7 days";

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">
            Completion tracking
          </h2>
          <p className="text-xs text-zinc-400">
            Tasks completed over the {rangeLabel}. Hover for task names.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-zinc-800 bg-zinc-950 text-xs text-zinc-300">
            {rangeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setRange(option.id)}
                className={`rounded-full px-4 py-2 transition ${
                  range === option.id
                    ? "bg-white text-zinc-900"
                    : "hover:bg-zinc-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-full border border-zinc-800 bg-zinc-950 text-xs text-zinc-300">
            {scopeOptions.map((option) => (
              <button
                key={option}
                onClick={() => setScope(option)}
                className={`rounded-full px-4 py-2 transition ${
                  scope === option
                    ? "bg-white text-zinc-900"
                    : "hover:bg-zinc-800"
                }`}
              >
                {option === "repeating" ? "Repeating" : "All"}
              </button>
            ))}
          </div>
          <div className="flex rounded-full border border-zinc-800 bg-zinc-950 text-xs text-zinc-300">
            {chartOptions.map((option) => (
              <button
                key={option}
                onClick={() => setChartType(option)}
                className={`rounded-full px-4 py-2 transition ${
                  chartType === option
                    ? "bg-white text-zinc-900"
                    : "hover:bg-zinc-800"
                }`}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 h-64">
        {!hasData ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-zinc-800 text-sm text-zinc-400">
            No completion data yet. Log completions to see trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" && (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="label" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="#e4e4e7" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
            {chartType === "line" && (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="label" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#e4e4e7"
                  strokeWidth={2}
                />
              </LineChart>
            )}
            {chartType === "area" && (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="label" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#e4e4e7"
                  fill="#3f3f46"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: { label?: string; count?: number; taskNames?: string[] };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const info = payload[0]?.payload;
  if (!info) return null;
  const names = info.taskNames ?? [];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-200 shadow-lg min-w-[160px]">
      <p className="font-semibold text-zinc-100">{info.label}</p>
      <p className="mt-0.5 text-zinc-300">
        {info.count ?? 0} completion{info.count !== 1 ? "s" : ""}
      </p>
      {names.length > 0 && (
        <div className="mt-2 border-t border-zinc-800 pt-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Tasks completed
          </p>
          <ul className="mt-1 space-y-0.5 text-zinc-300">
            {names.map((name) => (
              <li key={name}>• {name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
