export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  is_repeating: boolean;
  repeat_rule: string | null;
  created_at: string;
};

export type TaskImage = {
  id: string;
  task_id: string;
  storage_path: string;
  created_at: string;
};

export type TaskCompletion = {
  id: string;
  task_id: string;
  completed_at: string;
};

export type TaskWithExtras = Task & {
  task_images?: TaskImage[];
  task_completions?: TaskCompletion[];
};
