import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolveLlm } from "./_lib/llm";

const SYSTEM =
  "You are Cosmo, a magical space companion for children around age 7. A child just drew a space picture for you. Describe it back as an exciting 3-4 sentence space adventure story. Use simple, enthusiastic language with emojis. Even if it looks abstract, imagine rockets, planets, aliens, stars, or astronauts. Make the child feel their drawing is absolutely incredible.";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let llm: ReturnType<typeof resolveLlm>;
  try {
    llm = resolveLlm();
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }

  const body = typeof req.body === "string" ? (JSON.parse(req.body) as Record<string, unknown>) : (req.body as Record<string, unknown>);
  const imageData = String(body?.imageData ?? "");

  if (!imageData.startsWith("data:image/")) {
    return res.status(400).json({ error: "imageData must be a base64 data URL" });
  }

  if (llm.provider === "mock") {
    return res.status(200).json({
      story:
        "Wow, what an amazing space adventure! 🚀✨ I can see a brave astronaut zooming past colorful planets on a super-fast rocket! There's a friendly purple alien waving hello from a glowing moon, and shooting stars lighting up the whole galaxy! Your drawing is absolutely OUT OF THIS WORLD! 🌟🪐",
    });
  }

  const base64 = imageData.split(",")[1] ?? "";
  const mimeRaw = imageData.split(";")[0]?.split(":")[1] ?? "image/png";
  const mimeType = (mimeRaw === "image/png" || mimeRaw === "image/jpeg" || mimeRaw === "image/gif" || mimeRaw === "image/webp")
    ? mimeRaw
    : ("image/png" as const);

  if (llm.provider === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": llm.key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: llm.model,
        max_tokens: 400,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
              { type: "text", text: "Describe this child's space drawing as a fun adventure story!" },
            ],
          },
        ],
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: `Anthropic ${r.status}: ${t.slice(0, 300)}` });
    }
    const data = (await r.json()) as { content: Array<{ type: string; text?: string }> };
    return res.status(200).json({ story: data.content?.find((c) => c.type === "text")?.text?.trim() ?? "" });
  }

  if (llm.provider === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(llm.model)}:generateContent?key=${encodeURIComponent(llm.key)}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: "Describe this child's space drawing as a fun adventure story!" },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 400 },
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: `Gemini ${r.status}: ${t.slice(0, 300)}` });
    }
    const data = (await r.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
    return res.status(200).json({ story: text.trim() });
  }

  return res.status(400).json({ error: "Vision requires Anthropic or Gemini API key" });
}
