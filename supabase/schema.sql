-- Shelf Coach Schema

-- task_lists: Manager가 만드는 작업 세트
create table if not exists task_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- tasks: 개별 작업 정의
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  task_list_id uuid references task_lists(id) on delete cascade,
  title text not null,
  text_guide text,
  expected_image_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- task_submissions: Staff의 제출 + AI 평가 + Manager 검수
create table if not exists task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  staff_name text,
  platform text not null,
  thread_id text not null,
  before_image_url text,
  after_image_url text,
  ai_guide text,
  ai_score int,
  ai_evaluation text,
  status text default 'pending' check (status in ('pending', 'reviewed', 'ok', 'fail')),
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

-- indexes
create index if not exists idx_tasks_list on tasks(task_list_id);
create index if not exists idx_submissions_task on task_submissions(task_id);
create index if not exists idx_submissions_thread on task_submissions(thread_id);

-- Storage bucket (run manually in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('shelf-coach', 'shelf-coach', true);
