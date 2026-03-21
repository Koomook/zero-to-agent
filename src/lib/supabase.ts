import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
    );
  }

  _client = createClient(url, key, {
    global: {
      fetch: (...args) => fetch(...args),
    },
  });
  return _client;
}

export async function uploadImage(
  buffer: Buffer,
  filename: string,
  contentType: string = "image/jpeg",
): Promise<string> {
  const supabase = getSupabase();
  const path = `submissions/${Date.now()}-${filename}`;

  const { error } = await supabase.storage
    .from("shelf-coach")
    .upload(path, buffer, { contentType, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from("shelf-coach").getPublicUrl(path);

  return publicUrl;
}
