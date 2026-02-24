"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import type { TaskWithExtras } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";

type TasksContextValue = {
  tasks: TaskWithExtras[];
  loading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
  reload: () => Promise<void>;
};

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [tasks, setTasks] = useState<TaskWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadTasks = useCallback(async () => {
    if (!userId) return;
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("tasks")
      .select("*, task_images(*), task_completions(*)")
      .order("created_at", { ascending: false })
      .order("completed_at", {
        foreignTable: "task_completions",
        ascending: false,
      });

    loadingRef.current = false;

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setTasks(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadTasks();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [userId, loadTasks]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && userId) {
        loadTasks();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [userId, loadTasks]);

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      loading,
      error,
      setError,
      reload: loadTasks,
    }),
    [tasks, loading, error, loadTasks]
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasksContext() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasksContext must be used within TasksProvider");
  }
  return context;
}
