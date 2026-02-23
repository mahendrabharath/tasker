"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      router.push("/app");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-zinc-50">Welcome back</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Log in to access your tasks across devices.
        </p>
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="text-sm text-zinc-300">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
            />
          </label>
          <label className="text-sm text-zinc-300">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
            />
          </label>
          {error && (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="mt-6 flex items-center justify-between text-xs text-zinc-400">
          <Link href="/signup" className="hover:text-zinc-200">
            Create account
          </Link>
          <Link href="/forgot" className="hover:text-zinc-200">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
