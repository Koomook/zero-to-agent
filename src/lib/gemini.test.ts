import { beforeEach, describe, expect, it, vi } from "vitest";

const generateText = vi.fn();
const google = vi.fn((model: string) => `google:${model}`);

vi.mock("ai", () => ({
  generateText,
}));

vi.mock("@ai-sdk/google", () => ({
  google,
}));

describe("gemini helpers", () => {
  beforeEach(() => {
    generateText.mockReset();
    google.mockClear();
  });

  it("builds a multimodal before-image analysis request with fetched expected image metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(Buffer.from("expected-image"), {
          status: 200,
          headers: {
            "content-type": "image/png; charset=binary",
          },
        }),
      ),
    );
    generateText.mockResolvedValue({ text: "guide text" });

    const { analyzeBeforeImage } = await import("./gemini");
    const result = await analyzeBeforeImage(
      Buffer.from("before-image"),
      "https://example.com/expected.png",
      "Face labels forward",
      "image/webp",
    );

    expect(result).toBe("guide text");
    expect(google).toHaveBeenCalledWith("gemini-2.5-flash");

    const call = generateText.mock.calls[0][0];
    const content = call.messages[0].content;

    expect(call.system).toContain("Shelf Coach");
    expect(content[0].text).toContain('Task guide from manager: "Face labels forward"');
    expect(content[1]).toMatchObject({
      type: "image",
      mimeType: "image/webp",
      image: Buffer.from("before-image").toString("base64"),
    });
    expect(content[3]).toMatchObject({
      type: "image",
      mimeType: "image/png",
      image: Buffer.from("expected-image").toString("base64"),
    });
  });

  it("parses structured evaluation output", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(Buffer.from("expected-image"), {
          status: 200,
          headers: {
            "content-type": "image/jpeg",
          },
        }),
      ),
    );
    generateText.mockResolvedValue({
      text: "SCORE: 84\nEVALUATION: Well arranged and close to the expected state.",
    });

    const { evaluateAfterImage } = await import("./gemini");
    const result = await evaluateAfterImage(
      Buffer.from("after-image"),
      "https://example.com/expected.jpg",
      "Keep rows even",
      "image/jpeg",
    );

    expect(result).toEqual({
      score: 84,
      evaluation: "Well arranged and close to the expected state.",
    });
  });

  it("falls back gracefully when the model response is not structured", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(Buffer.from("expected-image"), {
          status: 200,
          headers: {
            "content-type": "image/jpeg",
          },
        }),
      ),
    );
    generateText.mockResolvedValue({
      text: "Looks decent, but there are gaps on the left.",
    });

    const { evaluateAfterImage } = await import("./gemini");
    const result = await evaluateAfterImage(
      Buffer.from("after-image"),
      "https://example.com/expected.jpg",
      null,
      "image/jpeg",
    );

    expect(result).toEqual({
      score: 50,
      evaluation: "Looks decent, but there are gaps on the left.",
    });
  });
});
