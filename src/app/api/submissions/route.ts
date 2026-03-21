import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await getSupabase()
    .from("task_submissions")
    .select("*, task:tasks(id, title, text_guide, expected_image_url)")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
