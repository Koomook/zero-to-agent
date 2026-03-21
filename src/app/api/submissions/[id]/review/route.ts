import { getSupabase } from "@/lib/supabase";

export async function POST(
  request: Request,
  context: RouteContext<"/api/submissions/[id]/review">,
) {
  const { id } = await context.params;
  const body = await request.json();
  const { status } = body as { status: "ok" | "fail" };

  if (!["ok", "fail"].includes(status)) {
    return Response.json(
      { error: 'status must be "ok" or "fail"' },
      { status: 400 },
    );
  }

  const { data, error } = await getSupabase()
    .from("task_submissions")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
