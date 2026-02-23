"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { TaskWithExtras } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("tasks")
      .select("*, task_images(*), task_completions(*)")
      .order("created_at", { ascending: false })
      .order("completed_at", { foreignTable: "task_completions", ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setTasks(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTasks();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [user, loadTasks]);

  return { tasks, loading, error, setError, reload: loadTasks };
}
