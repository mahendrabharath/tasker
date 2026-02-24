"use client";

import { useTasksContext } from "@/components/TasksProvider";

export function useTasks() {
  return useTasksContext();
}
