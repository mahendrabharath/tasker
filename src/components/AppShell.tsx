"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-semibold">
              Tasker
            </Link>
            <span className="text-xs text-zinc-400">Personal task hub</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-300">
            {user?.email && <span>{user.email}</span>}
            <button
              onClick={signOut}
              className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-500"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
