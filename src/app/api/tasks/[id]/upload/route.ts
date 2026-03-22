import { getSupabase } from "@/lib/supabase";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "file is required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `expected/${Date.now()}-${id.slice(0, 8)}.${ext}`;

  const supabase = getSupabase();

  const { error: uploadError } = await supabase.storage
    .from("shelf-coach")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("shelf-coach").getPublicUrl(path);

  // Update task with the expected image URL
  const { data, error } = await supabase
    .from("tasks")
    .update({ expected_image_url: publicUrl })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
