export type Priority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Achievement {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  createdAt: string;
  achievements: Achievement[];
}

export interface Staff {
  id: string;
  name: string;
}
