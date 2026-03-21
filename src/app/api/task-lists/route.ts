import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await getSupabase()
    .from("task_lists")
    .select("*, tasks(count)")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name } = body;

  const { data, error } = await getSupabase()
    .from("task_lists")
    .insert({ name })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
