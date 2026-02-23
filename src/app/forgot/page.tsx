"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/login`
            : undefined,
      }
    );

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage("Password reset email sent. Check your inbox.");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-zinc-50">
          Forgot password
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          We will send a password reset link to your email.
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
          {error && (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-200">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
        <div className="mt-6 text-xs text-zinc-400">
          Remembered your password?{" "}
          <Link href="/login" className="hover:text-zinc-200">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
