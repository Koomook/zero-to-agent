import { google } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import type { GeneratedTaskList } from "./types";

const KANI_SYSTEM = [
  "You are Kani, an AI-powered operational assistant for on-site task management.",
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

type Base64Image = {
  image: string;
  mimeType: string;
};

async function fetchImageAsBase64(url: string): Promise<Base64Image> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    image: buffer.toString("base64"),
    mimeType: res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg",
  };
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
    const expectedImage = await fetchImageAsBase64(expectedImageUrl);
    content.push({
      type: "text",
      text: "This is the EXPECTED (goal) state from the manager:",
    });
    content.push({
      type: "image",
      image: expectedImage.image,
      mimeType: expectedImage.mimeType,
    });
  }

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    system: KANI_SYSTEM,
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
    const expectedImage = await fetchImageAsBase64(expectedImageUrl);
    content.push({
      type: "text",
      text: "This is the EXPECTED (goal) state from the manager:",
    });
    content.push({
      type: "image",
      image: expectedImage.image,
      mimeType: expectedImage.mimeType,
    });
  }

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    system: KANI_SYSTEM,
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

export type GuideImageResult = {
  guideImage: Buffer;
  guideText: string;
  mimeType: string;
};

const TaskListSchema = z.object({
  name: z.string().describe("Short descriptive name for this task list"),
  tasks: z
    .array(
      z.object({
        title: z.string().describe("Short, specific task title (what to check)"),
        text_guide: z
          .string()
          .describe(
            "Exactly 3 bullet points starting with '• ', each max 10 words, short actionable phrases",
          ),
        assigned_to: z
          .string()
          .nullable()
          .describe("Staff member name assigned to this task, or null if no staff specified"),
      }),
    )
    .min(1)
    .max(15),
});

export async function generateTaskList(
  prompt: string,
): Promise<GeneratedTaskList> {
  const result = await generateObject({
    model: google("gemini-3-flash-preview"),
    schema: TaskListSchema,
    system: [
      "You are Kani, an AI operational assistant for on-site venue management.",
      "Generate a practical task list based on the manager's description.",
      "Each task must be a specific, photo-verifiable check.",
      "",
      "STRICT FORMAT RULES for text_guide:",
      "- Exactly 3 bullet points, no more, no less.",
      "- Each bullet starts with '• ' and is max 10 words.",
      "- Short, actionable phrases only. No full sentences.",
      "- Example: '• Check food trays are full\\n• Wipe table surfaces clean\\n• Restock napkins and plates'",
      "",
      "STAFF ASSIGNMENT RULES:",
      "- If the user mentions staff names (e.g., 'Staff: Alice, Bob'), distribute tasks across them in round-robin order using the assigned_to field.",
      "- If no staff names are mentioned, set assigned_to to null for ALL tasks.",
      "- Do NOT invent or guess staff names that the user did not provide.",
      "",
      "Keep task titles short (max 6 words).",
      "Write in the same language as the user's prompt.",
    ].join("\n"),
    prompt: `Create a task list for this situation: ${prompt}`,
  });
  return result.object;
}

export async function generateGuideImage(
  beforeImageBuffer: Buffer,
  expectedImageUrl: string | null,
  textGuide: string | null,
  imageMimeType: string = "image/jpeg",
): Promise<GuideImageResult | null> {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; image: string; mimeType: string }
  > = [];

  content.push({
    type: "text",
    text: [
      "You are an AI visual guide generator for on-site task management.",
      "A staff member uploaded a photo of the CURRENT state of their workspace.",
      textGuide ? `The manager's task guide says: "${textGuide}"` : "",
      "",
      "Generate an image that shows what this SAME scene should look like",
      "when the task is PROPERLY COMPLETED.",
      "- Keep the same camera angle, lighting, and environment.",
      "- Show items properly arranged, stocked, cleaned, or organized.",
      "- The output should be a realistic transformation of the input photo.",
      "",
      "Also provide a brief text description of what you changed.",
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
    const expectedImage = await fetchImageAsBase64(expectedImageUrl);
    content.push({
      type: "text",
      text: "Use this REFERENCE image as the goal state:",
    });
    content.push({
      type: "image",
      image: expectedImage.image,
      mimeType: expectedImage.mimeType,
    });
  }

  try {
    const result = await generateText({
      model: google("gemini-3.1-flash-image-preview"),
      providerOptions: {
        google: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      },
      messages: [{ role: "user", content }],
    });

    const imageFile = result.files?.find((f) =>
      f.mediaType?.startsWith("image/"),
    );

    if (!imageFile) {
      console.warn("[kani] Gemini returned no image");
      return null;
    }

    return {
      guideImage: Buffer.from(imageFile.uint8Array),
      guideText: result.text?.trim() ?? "",
      mimeType: imageFile.mediaType ?? "image/png",
    };
  } catch (e) {
    console.error("[kani] Guide image generation failed:", e);
    return null;
  }
}
