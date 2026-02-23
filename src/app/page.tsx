import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-10 shadow-xl">
        <div className="flex flex-col gap-5">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
            Task creation + repetition tracking
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-zinc-50">
            Build focus with tasks, streaks, and reminders.
          </h1>
          <p className="max-w-2xl text-base text-zinc-300">
            Tasker helps you capture one-time tasks, set repeating routines, add
            supporting images, and stay on track with completion charts and
            browser notifications.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/login"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
          >
            Create account
          </Link>
          <Link
            href="/app"
            className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
          >
            Go to tasks
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Create tasks with images",
            "Track repeating task streaks",
            "Get reminders and notifications",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-sm text-zinc-300"
            >
              {item}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
