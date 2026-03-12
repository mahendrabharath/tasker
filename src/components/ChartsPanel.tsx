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

type DataEntry = {
  label: string;
  count: number;
  value?: number;
  taskNames: string[];
  taskDetails?: Array<{ task: string; values?: Record<string, number | string> }>;
};

const chartOptions = ["bar", "line", "area"] as const;
type ChartType = (typeof chartOptions)[number];
const scopeOptions = ["repeating", "all"] as const;
type ScopeType = (typeof scopeOptions)[number];
const metricOptions = ["completions", "value"] as const;
type MetricType = (typeof metricOptions)[number];
const rangeOptions = [
  { id: "12h", label: "12 hours" },
  { id: "24h", label: "24 hours" },
  { id: "7d", label: "Weekly" },
  { id: "30d", label: "Monthly" },
] as const;
type RangeType = (typeof rangeOptions)[number]["id"];

export function ChartsPanel({ tasks }: ChartsPanelProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [scope, setScope] = useState<ScopeType>("all");
  const [metric, setMetric] = useState<MetricType>("completions");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [range, setRange] = useState<RangeType>("7d");

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach((task) => {
      (task.completion_fields ?? []).forEach((f) => {
        if (f?.tag?.trim()) tags.add(f.tag);
      });
      (task.task_completions ?? []).forEach((c) => {
        const vals = c.completion_values as Record<string, number | string> | undefined;
        if (vals) Object.keys(vals).forEach((k) => tags.add(k));
      });
    });
    return Array.from(tags).sort();
  }, [tasks]);

  const buildData = (
    sourceTasks: TaskWithExtras[],
    rangeType: RangeType,
    metricType: MetricType,
    tag: string
  ): DataEntry[] => {
    const now = new Date();

    if (rangeType === "12h" || rangeType === "24h") {
      const hoursBack = rangeType === "12h" ? 12 : 24;
      const start = subHours(now, hoursBack);
      const hours = eachHourOfInterval({ start, end: addHours(now, 1) });

      const base = new Map<
        string,
        { count: number; value: number; tasks: Map<string, Record<string, number | string>> }
      >();
      hours.forEach((hour) => {
        const key = format(hour, "HH:mm");
        base.set(key, { count: 0, value: 0, tasks: new Map() });
      });

      sourceTasks.forEach((task) => {
        (task.task_completions ?? []).forEach((completion) => {
          const completedAt = new Date(completion.completed_at);
          if (completedAt < start || completedAt > now) return;
          const hourKey = format(startOfHour(completedAt), "HH:mm");
          const entry = base.get(hourKey);
          if (!entry) return;
          entry.count += 1;
          const vals = (completion.completion_values ?? {}) as Record<string, number | string>;
          const tagVal = typeof vals[tag] === "number" ? vals[tag] : 0;
          entry.value += tagVal as number;
          entry.tasks.set(task.title, vals);
        });
      });

      return Array.from(base.entries()).map(([label, entry]) => ({
        label,
        count: entry.count,
        value: entry.value,
        taskNames: Array.from(entry.tasks.keys()),
        taskDetails: Array.from(entry.tasks.entries()).map(([t, v]) => ({
          task: t,
          values: Object.keys(v).length ? v : undefined,
        })),
      }));
    }

    const daysBack = rangeType === "30d" ? 29 : 6;
    const start = subDays(now, daysBack);
    const days = eachDayOfInterval({ start, end: now });
    const dayFormat = rangeType === "30d" ? "MMM d" : "MMM dd";
    const base = new Map<
      string,
      { count: number; value: number; tasks: Map<string, Record<string, number | string>> }
    >();
    days.forEach((day) => {
      const key = format(day, dayFormat);
      base.set(key, { count: 0, value: 0, tasks: new Map() });
    });

    sourceTasks.forEach((task) => {
      (task.task_completions ?? []).forEach((completion) => {
        const completedAt = new Date(completion.completed_at);
        if (completedAt < start || completedAt > now) return;
        const key = format(completedAt, dayFormat);
        const entry = base.get(key);
        if (!entry) return;
        entry.count += 1;
        const vals = (completion.completion_values ?? {}) as Record<string, number | string>;
        const tagVal = typeof vals[tag] === "number" ? vals[tag] : 0;
        entry.value += tagVal as number;
        entry.tasks.set(task.title, vals);
      });
    });

    return Array.from(base.entries()).map(([label, entry]) => ({
      label,
      count: entry.count,
      value: entry.value,
      taskNames: Array.from(entry.tasks.keys()),
      taskDetails: Array.from(entry.tasks.entries()).map(([t, v]) => ({
        task: t,
        values: Object.keys(v).length ? v : undefined,
      })),
    }));
  };

  const sourceTasks = useMemo(() => {
    const repeatingTasks = tasks.filter((task) => task.is_repeating);
    return scope === "repeating" ? repeatingTasks : tasks;
  }, [tasks, scope]);

  const effectiveTag = selectedTag || availableTags[0] || "";
  const data = useMemo(
    () => buildData(sourceTasks, range, metric, effectiveTag),
    [sourceTasks, range, metric, effectiveTag]
  );

  const dataKey = metric === "value" && effectiveTag ? "value" : "count";
  const hasData = data.some(
    (entry) => (metric === "value" ? (entry.value ?? 0) > 0 : entry.count > 0)
  );

  const rangeLabel =
    range === "12h"
      ? "last 12 hours"
      : range === "24h"
      ? "last 24 hours"
      : range === "30d"
      ? "last 30 days"
      : "last 7 days";

  const xAxisInterval = range === "30d" ? 4 : range === "7d" ? 1 : 0;
  const xAxisTick = { fontSize: 11 };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-zinc-100/80 p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Completion tracking
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {metric === "value" && selectedTag
              ? `${selectedTag} over the ${rangeLabel}`
              : `Tasks completed over the ${rangeLabel}. Tap for details.`}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 text-xs dark:border-zinc-800 dark:bg-zinc-950">
              {metricOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setMetric(option)}
                  className={`min-w-[4rem] rounded-md px-3 py-2 transition ${
                    metric === option
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {option === "completions" ? "Count" : "Value"}
                </button>
              ))}
            </div>
            {metric === "value" && availableTags.length > 0 && (
              <select
                value={effectiveTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="min-w-0 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
              >
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            )}
            {metric === "value" && availableTags.length === 0 && (
              <span className="self-center text-xs text-zinc-500 dark:text-zinc-400">
                Add completion fields to tasks
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 text-xs dark:border-zinc-800 dark:bg-zinc-950">
              {rangeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setRange(option.id)}
                  className={`min-w-[4rem] rounded-md px-3 py-2 transition ${
                    range === option.id
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 text-xs dark:border-zinc-800 dark:bg-zinc-950">
              {scopeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setScope(option)}
                  className={`min-w-[4rem] rounded-md px-3 py-2 transition ${
                    scope === option
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {option === "repeating" ? "Repeating" : "All"}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 text-xs dark:border-zinc-800 dark:bg-zinc-950">
              {chartOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setChartType(option)}
                  className={`min-w-[3.5rem] rounded-md px-3 py-2 transition ${
                    chartType === option
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="relative mt-4 h-64 min-w-0 overflow-hidden sm:mt-6">
        {!hasData ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            No completion data yet. Log completions to see trends.
          </div>
        ) : (
          <div className="h-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" && (
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="label"
                  stroke="#a1a1aa"
                  interval={xAxisInterval}
                  tick={xAxisTick}
                  tickLine={false}
                />
                <YAxis stroke="#a1a1aa" allowDecimals={metric === "value"} width={28} tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip content={<ChartTooltip metric={metric} />} />
                <Bar dataKey={dataKey} fill="#e4e4e7" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
            {chartType === "line" && (
              <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="label"
                  stroke="#a1a1aa"
                  interval={xAxisInterval}
                  tick={xAxisTick}
                  tickLine={false}
                />
                <YAxis stroke="#a1a1aa" allowDecimals={metric === "value"} width={28} tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip content={<ChartTooltip metric={metric} />} />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke="#e4e4e7"
                  strokeWidth={2}
                />
              </LineChart>
            )}
            {chartType === "area" && (
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="label"
                  stroke="#a1a1aa"
                  interval={xAxisInterval}
                  tick={xAxisTick}
                  tickLine={false}
                />
                <YAxis stroke="#a1a1aa" allowDecimals={metric === "value"} width={28} tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip content={<ChartTooltip metric={metric} />} />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke="#e4e4e7"
                  fill="#3f3f46"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}

function ChartTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ payload?: DataEntry }>;
  metric?: MetricType;
}) {
  if (!active || !payload?.length) return null;
  const info = payload[0]?.payload;
  if (!info) return null;
  const names = info.taskNames ?? [];
  const details = info.taskDetails ?? [];
  const showValue = metric === "value";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-200 shadow-lg min-w-[160px]">
      <p className="font-semibold text-zinc-100">{info.label}</p>
      <p className="mt-0.5 text-zinc-300">
        {showValue
          ? `${info.value ?? 0} total`
          : `${info.count ?? 0} completion${(info.count ?? 0) !== 1 ? "s" : ""}`}
      </p>
      {details.length > 0 && (
        <div className="mt-2 border-t border-zinc-800 pt-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Tasks
          </p>
          <ul className="mt-1 space-y-0.5 text-zinc-300">
            {details.map((d) => (
              <li key={d.task}>
                • {d.task}
                {d.values &&
                  Object.entries(d.values).map(([k, v]) => (
                    <span key={k} className="ml-1 text-zinc-400">
                      ({k}: {String(v)})
                    </span>
                  ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
