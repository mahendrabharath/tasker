"use client";

export function TaskListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-3xl border border-zinc-200 bg-zinc-100/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/70"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="h-5 w-3/4 animate-pulse rounded-lg bg-zinc-300 dark:bg-zinc-700" />
              <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-3 flex gap-3">
                <div className="h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="mt-3 flex gap-2">
                <div className="h-6 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-6 w-14 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
