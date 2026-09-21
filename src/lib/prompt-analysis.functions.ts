import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CATEGORIES } from "@/lib/constants";

const analysisInputSchema = z.object({
  title: z.string().trim().min(3).max(160),
  promptText: z.string().trim().min(10),
  competitorLinks: z
    .array(z.object({ label: z.string().max(160), url: z.string().max(2000) }))
    .max(10),
});

const analysisSchema = z.object({
  category: z.enum(CATEGORIES),
  tags: z.array(z.string()),
  missingDetails: z.array(z.string()),
  summary: z.string(),
});

export type PromptAnalysis = z.infer<typeof analysisSchema>;

function safeGatewayMessage(status: number, body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string }; message?: string };
    return parsed.error?.message ?? parsed.message ?? `AI analysis failed (${status})`;
  } catch {
    return `AI analysis failed (${status})`;
  }
}

async function readResponseText(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("The AI service returned an empty response");

  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const event = JSON.parse(data) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (event.type === "response.output_text.delta" && event.delta) output += event.delta;
        if (!output && event.type === "response.completed" && event.response?.output_text) {
          output = event.response.output_text;
        }
      } catch {
        // Ignore non-JSON SSE metadata lines.
      }
    }
  }

  return output.trim();
}

async function requestAnalysis(apiKey: string, input: z.infer<typeof analysisInputSchema>) {
  const promptExcerpt = input.promptText.slice(0, 120_000);
  const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      input: [
        {
          role: "developer",
          content:
            "You classify reusable content-creation prompts. Pick exactly one allowed niche, create concise lowercase search tags, and identify genuinely missing details that would prevent reliable reuse. Do not critique style when the information is already sufficient. Return only the requested structured output.",
        },
        {
          role: "user",
          content: JSON.stringify({
            title: input.title,
            prompt: promptExcerpt,
            promptWasTruncated: input.promptText.length > promptExcerpt.length,
            competitorLinks: input.competitorLinks,
            allowedCategories: CATEGORIES,
            limits: { tags: "up to 10", missingDetails: "up to 5", summary: "one sentence" },
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "prompt_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              category: { type: "string", enum: CATEGORIES },
              tags: { type: "array", items: { type: "string" } },
              missingDetails: { type: "array", items: { type: "string" } },
              summary: { type: "string" },
            },
            required: ["category", "tags", "missingDetails", "summary"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(safeGatewayMessage(response.status, body));
  }

  const text = await readResponseText(response);
  if (!text) throw new Error("The AI analysis finished without suggestions");
  const result = analysisSchema.parse(JSON.parse(text));
  return {
    ...result,
    tags: result.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 10),
    missingDetails: result.missingDetails.map((item) => item.trim()).filter(Boolean).slice(0, 5),
  };
}

export const analyzeMasterPrompt = createServerFn({ method: "POST" })
  .inputValidator((input) => analysisInputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI analysis is not configured yet");

    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await requestAnalysis(apiKey, data);
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : "";
        const retryable = /\((429|5\d\d)\)/.test(message);
        if (!retryable || attempt === 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 900));
      }
    }
    throw lastError;
  });