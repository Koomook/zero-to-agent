import { beforeEach, describe, expect, it, vi } from "vitest";

const createClient = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient,
}));

describe("supabase helpers", () => {
  beforeEach(() => {
    createClient.mockReset();
  });

  it("throws when required env vars are missing", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    vi.resetModules();
    const { getSupabase } = await import("./supabase");

    expect(() => getSupabase()).toThrow(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
    );
  });

  it("caches the client and reuses it", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";

    createClient.mockReturnValue({ tag: "client" });

    vi.resetModules();
    const { getSupabase } = await import("./supabase");

    expect(getSupabase()).toEqual({ tag: "client" });
    expect(getSupabase()).toEqual({ tag: "client" });
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it("uploads images with the provided content type and returns the public URL", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";

    const upload = vi.fn().mockResolvedValue({ error: null });
    const getPublicUrl = vi.fn().mockReturnValue({
      data: {
        publicUrl: "https://example.supabase.co/storage/v1/object/public/shelf-coach/submissions/test.webp",
      },
    });
    const from = vi.fn().mockReturnValue({
      upload,
      getPublicUrl,
    });

    createClient.mockReturnValue({
      storage: {
        from,
      },
    });

    vi.setSystemTime(new Date("2026-03-21T12:00:00.000Z"));
    vi.resetModules();
    const { uploadImage } = await import("./supabase");

    const publicUrl = await uploadImage(
      Buffer.from("image-data"),
      "submission.webp",
      "image/webp",
    );

    expect(from).toHaveBeenCalledWith("shelf-coach");
    expect(upload).toHaveBeenCalledWith(
      "submissions/1774094400000-submission.webp",
      Buffer.from("image-data"),
      {
        contentType: "image/webp",
        upsert: false,
      },
    );
    expect(publicUrl).toContain("submissions/test.webp");
  });
});
