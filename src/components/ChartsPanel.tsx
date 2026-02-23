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
import { eachDayOfInterval, format, subDays } from "date-fns";
import type { TaskWithExtras } from "@/lib/types";

type ChartsPanelProps = {
  tasks: TaskWithExtras[];
};

const chartOptions = ["bar", "line", "area"] as const;
type ChartType = (typeof chartOptions)[number];
const scopeOptions = ["repeating", "all"] as const;
type ScopeType = (typeof scopeOptions)[number];

export function ChartsPanel({ tasks }: ChartsPanelProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [scope, setScope] = useState<ScopeType>("repeating");

  const buildData = (sourceTasks: TaskWithExtras[]) => {
    const start = subDays(new Date(), 13);
    const end = new Date();
    const days = eachDayOfInterval({ start, end });

    const base = new Map(
      days.map((day) => [format(day, "MMM dd"), 0])
    );

    sourceTasks
      .flatMap((task) => task.task_completions ?? [])
      .forEach((completion) => {
        const key = format(new Date(completion.completed_at), "MMM dd");
        if (base.has(key)) {
          base.set(key, (base.get(key) ?? 0) + 1);
        }
      });

    return Array.from(base.entries()).map(([day, count]) => ({
      day,
      count,
    }));
  };

  const data = useMemo(() => {
    const repeatingTasks = tasks.filter((task) => task.is_repeating);
    return scope === "repeating" ? buildData(repeatingTasks) : buildData(tasks);
  }, [tasks, scope]);

  const hasData = data.some((entry) => entry.count > 0);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">
            Completion tracking
          </h2>
          <p className="text-xs text-zinc-400">
            Completion activity over the last 14 days.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            No repetition data yet. Log completions to see trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" && (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="day" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#09090b",
                    border: "1px solid #27272a",
                    color: "#f4f4f5",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#e4e4e7" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
            {chartType === "line" && (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="day" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#09090b",
                    border: "1px solid #27272a",
                    color: "#f4f4f5",
                    fontSize: "12px",
                  }}
                />
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
                <XAxis dataKey="day" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#09090b",
                    border: "1px solid #27272a",
                    color: "#f4f4f5",
                    fontSize: "12px",
                  }}
                />
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
