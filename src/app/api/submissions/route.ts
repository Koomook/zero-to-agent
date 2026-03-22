import { getSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskListId = searchParams.get("task_list_id");

  const taskJoin = taskListId
    ? "task:tasks!inner(id, title, text_guide, expected_image_url, task_list_id)"
    : "task:tasks(id, title, text_guide, expected_image_url)";

  let query = getSupabase()
    .from("task_submissions")
    .select(`*, ${taskJoin}`)
    .order("created_at", { ascending: false });

  if (taskListId) {
    query = query.eq("task.task_list_id", taskListId);
  }

  const { data, error } = await query;

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
