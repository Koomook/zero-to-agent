import { google } from "@ai-sdk/google";
import { generateText } from "ai";

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer.toString("base64");
}

export async function analyzeBeforeImage(
  beforeImageBuffer: Buffer,
  expectedImageUrl: string | null,
  textGuide: string | null,
): Promise<string> {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; image: string; mimeType: string }
  > = [];

  content.push({
    type: "text",
    text: [
      "You are Shelf Coach, an operational assistant that helps staff complete tasks.",
      "A staff member just uploaded a photo of the current state.",
      textGuide
        ? `Task guide: ${textGuide}`
        : "Compare with the expected state image.",
      "Generate a clear, actionable guide explaining what needs to be done to match the expected state.",
      "Be specific about what to move, clean, fill, or adjust.",
      "Keep it concise (3-5 bullet points).",
      "If the user writes in Korean, respond in Korean. Otherwise respond in English.",
    ].join("\n"),
  });

  content.push({
    type: "image",
    image: beforeImageBuffer.toString("base64"),
    mimeType: "image/jpeg",
  });

  if (expectedImageUrl) {
    const expectedBase64 = await fetchImageAsBase64(expectedImageUrl);
    content.push({
      type: "text",
      text: "This is the expected (goal) state:",
    });
    content.push({
      type: "image",
      image: expectedBase64,
      mimeType: "image/jpeg",
    });
  }

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    messages: [{ role: "user", content }],
  });

  return result.text.trim();
}

export async function evaluateAfterImage(
  afterImageBuffer: Buffer,
  expectedImageUrl: string | null,
  textGuide: string | null,
): Promise<{ score: number; evaluation: string }> {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; image: string; mimeType: string }
  > = [];

  content.push({
    type: "text",
    text: [
      "You are Shelf Coach, evaluating whether a task was completed properly.",
      textGuide ? `Task guide: ${textGuide}` : "",
      "Score the completion from 0 to 100 based on how well it matches the expected state.",
      "Respond in this exact format:",
      "SCORE: <number>",
      "EVALUATION: <brief feedback>",
      "If the user's previous messages were in Korean, respond in Korean. Otherwise English.",
    ].join("\n"),
  });

  content.push({
    type: "image",
    image: afterImageBuffer.toString("base64"),
    mimeType: "image/jpeg",
  });

  if (expectedImageUrl) {
    const expectedBase64 = await fetchImageAsBase64(expectedImageUrl);
    content.push({
      type: "text",
      text: "This is the expected (goal) state:",
    });
    content.push({
      type: "image",
      image: expectedBase64,
      mimeType: "image/jpeg",
    });
  }

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    messages: [{ role: "user", content }],
  });

  const text = result.text.trim();
  const scoreMatch = text.match(/SCORE:\s*(\d+)/);
  const evalMatch = text.match(/EVALUATION:\s*([\s\S]+)/);

  return {
    score: scoreMatch ? parseInt(scoreMatch[1], 10) : 50,
    evaluation: evalMatch ? evalMatch[1].trim() : text,
  };
}
