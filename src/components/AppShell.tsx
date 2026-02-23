"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const initials = user?.email
    ? user.email.split("@")[0].slice(0, 2).toUpperCase()
    : "U";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => null);
    }
  }, []);

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
          <div className="relative flex items-center gap-3 text-sm text-zinc-300">
            {user?.email && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-100"
                  aria-label="Open profile menu"
                >
                  {initials}
                </button>
                <span className="hidden text-xs text-zinc-400 sm:inline">
                  {user.email}
                </span>
              </div>
            )}
            {menuOpen && (
              <div className="absolute right-0 top-11 z-20 w-40 rounded-2xl border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-200 shadow-xl">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-zinc-900"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
