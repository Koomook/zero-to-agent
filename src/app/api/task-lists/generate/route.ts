import { generateTaskList } from "@/lib/gemini";

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt: string };

  if (!prompt?.trim()) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  try {
    const result = await generateTaskList(prompt.trim());
    return Response.json(result);
  } catch (e) {
    console.error("[kani] generateTaskList failed:", e);
    return Response.json(
      { error: "Failed to generate task list" },
      { status: 500 },
    );
  }
}
