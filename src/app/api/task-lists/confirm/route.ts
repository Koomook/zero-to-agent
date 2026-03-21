import { getSupabase } from "@/lib/supabase";
import type { GeneratedTask } from "@/lib/types";

export async function POST(request: Request) {
  const { name, tasks } = (await request.json()) as {
    name: string;
    tasks: GeneratedTask[];
  };

  if (!name?.trim() || !tasks?.length) {
    return Response.json(
      { error: "name and tasks are required" },
      { status: 400 },
    );
  }

  // 1. Create task list
  const { data: taskList, error: listError } = await getSupabase()
    .from("task_lists")
    .insert({ name: name.trim() })
    .select()
    .single();

  if (listError) {
    return Response.json({ error: listError.message }, { status: 500 });
  }

  // 2. Bulk insert tasks
  const taskRows = tasks.map((t, i) => ({
    task_list_id: taskList.id,
    title: t.title,
    text_guide: t.text_guide,
    assigned_to: t.assigned_to ?? null,
    sort_order: i,
  }));

  const { error: tasksError } = await getSupabase()
    .from("tasks")
    .insert(taskRows);

  if (tasksError) {
    return Response.json({ error: tasksError.message }, { status: 500 });
  }

  return Response.json(
    { taskList, taskCount: tasks.length },
    { status: 201 },
  );
}
