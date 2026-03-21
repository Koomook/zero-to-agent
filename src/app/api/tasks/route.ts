import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await getSupabase()
    .from("tasks")
    .select("*, task_list:task_lists(name)")
    .order("sort_order", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { task_list_id, title, text_guide, expected_image_url, sort_order } =
    body;

  const { data, error } = await getSupabase()
    .from("tasks")
    .insert({ task_list_id, title, text_guide, expected_image_url, sort_order })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
