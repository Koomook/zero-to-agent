import { getSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskListId = searchParams.get("task_list_id");

  let query = getSupabase()
    .from("tasks")
    .select("*, task_list:task_lists(name)")
    .order("sort_order", { ascending: true });

  if (taskListId) {
    query = query.eq("task_list_id", taskListId);
  }

  const { data, error } = await query;

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    task_list_id,
    title,
    description,
    text_guide,
    expected_image_url,
    reward_amount,
    sort_order,
  } = body;

  const { data, error } = await getSupabase()
    .from("tasks")
    .insert({
      task_list_id,
      title,
      description,
      text_guide,
      expected_image_url,
      reward_amount,
      sort_order,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
