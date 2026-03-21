export type TaskList = {
  id: string;
  name: string;
  created_at: string;
};

export type Task = {
  id: string;
  task_list_id: string;
  title: string;
  text_guide: string | null;
  expected_image_url: string | null;
  sort_order: number;
  created_at: string;
};

export type TaskSubmission = {
  id: string;
  task_id: string;
  staff_name: string | null;
  platform: string;
  thread_id: string;
  before_image_url: string | null;
  after_image_url: string | null;
  ai_guide: string | null;
  ai_guide_image_url: string | null;
  ai_score: number | null;
  ai_evaluation: string | null;
  status: "pending" | "reviewed" | "ok" | "fail";
  created_at: string;
  reviewed_at: string | null;
};

export type SubmissionWithTask = TaskSubmission & {
  task: Task;
};
