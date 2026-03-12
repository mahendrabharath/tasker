"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { BarChart3, LayoutDashboard, Settings } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Analytics", href: "/app/analytics", icon: BarChart3 },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const initials = user?.email
    ? user.email.split("@")[0].slice(0, 2).toUpperCase()
    : "U";

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => null);
    }
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/" className="text-lg font-semibold">
                Tasker
              </Link>
              <span className="hidden text-xs text-zinc-400 sm:inline">
                Personal task hub
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              {user?.email && (
                <>
                  <span className="hidden text-xs text-zinc-500 sm:inline dark:text-zinc-400">
                    {user.email}
                  </span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                    {initials}
                  </div>
                </>
              )}
            </div>
          </div>
          <nav
            className="no-scrollbar flex w-full flex-nowrap gap-2 overflow-x-auto text-xs text-zinc-600 sm:flex-wrap dark:text-zinc-300"
            aria-label="Main navigation"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:focus:ring-zinc-500 dark:focus:ring-offset-zinc-950 sm:px-4 ${
                    isActive
                      ? "border-zinc-300 bg-zinc-900 text-white dark:border-zinc-800 dark:bg-white dark:text-zinc-900"
                      : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                  }`}
                >
                  <span className="flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-2">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="leading-none">{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto min-w-0 max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
