import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const SHELF_COACH_SYSTEM = [
  "You are Shelf Coach, an AI-powered operational assistant for on-site task management.",
  "You work with staff at cafes, restaurants, retail stores, and shared spaces.",
  "Your role is to analyze photos of the current state, compare against the expected state,",
  "and provide clear, actionable guidance to help staff meet quality standards.",
  "",
  "Key behaviors:",
  "- Be specific and visual: refer to exact locations (left side, top shelf, etc.)",
  "- Be encouraging: acknowledge what's already done well before listing improvements",
  "- Be concise: 3-5 bullet points maximum for guides",
  "- Adapt language: if the staff writes in Korean, respond in Korean. Otherwise English.",
  "- Focus on actionable steps, not subjective opinions",
].join("\n");

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer.toString("base64");
}

export async function analyzeBeforeImage(
  beforeImageBuffer: Buffer,
  expectedImageUrl: string | null,
  textGuide: string | null,
  imageMimeType: string = "image/jpeg",
): Promise<string> {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; image: string; mimeType: string }
  > = [];

  content.push({
    type: "text",
    text: [
      "A staff member uploaded a BEFORE photo of the current state.",
      textGuide ? `Task guide from manager: "${textGuide}"` : "",
      "",
      "Analyze this image and generate an actionable guide:",
      "1. What is the current state? (brief assessment)",
      "2. What specific actions should be taken? (3-5 bullet points)",
      "3. What does the goal state look like?",
      "",
      "If an expected state image is provided, compare directly against it.",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  content.push({
    type: "image",
    image: beforeImageBuffer.toString("base64"),
    mimeType: imageMimeType,
  });

  if (expectedImageUrl) {
    const expectedBase64 = await fetchImageAsBase64(expectedImageUrl);
    content.push({
      type: "text",
      text: "This is the EXPECTED (goal) state from the manager:",
    });
    content.push({
      type: "image",
      image: expectedBase64,
      mimeType: "image/jpeg",
    });
  }

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    system: SHELF_COACH_SYSTEM,
    messages: [{ role: "user", content }],
  });

  return result.text.trim();
}

export async function evaluateAfterImage(
  afterImageBuffer: Buffer,
  expectedImageUrl: string | null,
  textGuide: string | null,
  imageMimeType: string = "image/jpeg",
): Promise<{ score: number; evaluation: string }> {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; image: string; mimeType: string }
  > = [];

  content.push({
    type: "text",
    text: [
      "A staff member uploaded an AFTER photo — they claim the task is complete.",
      textGuide ? `Task guide from manager: "${textGuide}"` : "",
      "",
      "Evaluate the completion quality:",
      "- How well does it match the expected state?",
      "- What was done well?",
      "- What could be improved?",
      "",
      "Respond in this EXACT format (keep the labels):",
      "SCORE: <number from 0 to 100>",
      "EVALUATION: <2-3 sentences of feedback>",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  content.push({
    type: "image",
    image: afterImageBuffer.toString("base64"),
    mimeType: imageMimeType,
  });

  if (expectedImageUrl) {
    const expectedBase64 = await fetchImageAsBase64(expectedImageUrl);
    content.push({
      type: "text",
      text: "This is the EXPECTED (goal) state from the manager:",
    });
    content.push({
      type: "image",
      image: expectedBase64,
      mimeType: "image/jpeg",
    });
  }

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    system: SHELF_COACH_SYSTEM,
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
