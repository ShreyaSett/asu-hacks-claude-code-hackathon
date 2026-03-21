import { anthropicMessages } from "./anthropic";
import type { FetchFocus, LiveSpaceBundle } from "./spaceData";

export type LlmProviderName = "anthropic" | "openai" | "gemini" | "mock";

export type ResolvedLlm =
  | { provider: "anthropic"; key: string; model: string }
  | { provider: "openai"; key: string; model: string }
  | { provider: "gemini"; key: string; model: string }
  | { provider: "mock"; model: "mock" };

/** Pick provider: explicit COSMO_LLM_PROVIDER, else first available key, else mock. */
export function resolveLlm(): ResolvedLlm {
  const forced = (process.env.COSMO_LLM_PROVIDER || "").toLowerCase().trim();
  const mockFlag =
    process.env.COSMO_MOCK_LLM === "1" ||
    process.env.COSMO_MOCK_LLM === "true" ||
    forced === "mock";

  if (mockFlag) {
    return { provider: "mock", model: "mock" };
  }

  if (forced === "openai" || (!forced && process.env.OPENAI_API_KEY)) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("COSMO_LLM_PROVIDER=openai but OPENAI_API_KEY is missing");
    return {
      provider: "openai",
      key,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }

  if (forced === "gemini" || (!forced && process.env.GEMINI_API_KEY)) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("COSMO_LLM_PROVIDER=gemini but GEMINI_API_KEY is missing");
    return {
      provider: "gemini",
      key,
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    };
  }

  if (forced === "anthropic" || process.env.ANTHROPIC_API_KEY) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("COSMO_LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is missing");
    return {
      provider: "anthropic",
      key,
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
    };
  }

  return { provider: "mock", model: "mock" };
}

async function openaiComplete(
  apiKey: string,
  model: string,
  system: string,
  user: string,
  maxTokens: number
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI API ${res.status}: ${t.slice(0, 500)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function geminiComplete(
  apiKey: string,
  model: string,
  system: string,
  user: string,
  maxTokens: number
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini API ${res.status}: ${t.slice(0, 500)}`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  return text.trim();
}

export async function llmComplete(
  llm: ResolvedLlm,
  system: string,
  user: string,
  maxTokens: number
): Promise<string> {
  if (llm.provider === "mock") {
    throw new Error("llmComplete should not be called in mock mode");
  }
  if (llm.provider === "anthropic") {
    return anthropicMessages(llm.key, llm.model, system, [{ role: "user", content: user }], maxTokens);
  }
  if (llm.provider === "openai") {
    return openaiComplete(llm.key, llm.model, system, user, maxTokens);
  }
  return geminiComplete(llm.key, llm.model, system, user, maxTokens);
}

export function heuristicClassify(message: string): {
  type: "realtime" | "knowledge";
  query: string;
  fetch: FetchFocus[];
} {
  const realtime = /now|today|right now|currently|iss|station|crew|astronaut|where is|apod|picture|photo|mars|rover|in space|how many people/i.test(
    message
  );
  return {
    type: realtime ? "realtime" : "knowledge",
    query: message,
    fetch: realtime ? ["general"] : [],
  };
}

export function mockCosmoReply(
  message: string,
  bundle: LiveSpaceBundle,
  age: number,
  childName?: string
): string {
  const greet = childName ? `Hi ${childName}! ` : "Hi! ";
  const bits: string[] = [];

  if (bundle.crew && bundle.crew.number > 0) {
    const names = bundle.crew.people.slice(0, 4).map((p) => p.name);
    const extra =
      bundle.crew.number > names.length ? ` and ${bundle.crew.number - names.length} more` : "";
    bits.push(
      `Right now there are ${bundle.crew.number} people in space. Some names from the list: ${names.join(", ")}${extra}.`
    );
  }

  if (bundle.iss) {
    const where = bundle.iss.approxLocation
      ? `It looks like the ISS is roughly over ${bundle.iss.approxLocation}.`
      : "The ISS is always moving, so its spot on Earth changes fast.";
    bits.push(
      `${where} (If an adult helps you read numbers: about ${bundle.iss.latitude.toFixed(1)}° and ${bundle.iss.longitude.toFixed(1)}°.)`
    );
  }

  if (bundle.apod) {
    bits.push(
      `NASA's astronomy picture today is called "${bundle.apod.title}". I would paint it in words for you, but demo mode keeps my story short — ask again when a grown-up adds an AI key for the full Cosmo voice.`
    );
  }

  if (bundle.mars?.latestPhotoUrl) {
    bits.push(
      `There is a fresh rover photo from Mars (${bundle.mars.rover || "rover"}, Earth date ${bundle.mars.earthDate || "recent"}).`
    );
  }

  if (bits.length === 0) {
    bits.push(
      `You asked: "${message.slice(0, 200)}". I'm in demo mode right now (no AI key), so I can't think up a full kid-sized answer yet — but I'm still glad you're curious!`
    );
    bits.push(
      `For someone about age ${age}: space is huge, and we explore it with telescopes, robots, and brave astronauts.`
    );
  } else {
    bits.push(
      `(This reply used live space data but demo Cosmo — add OpenAI, Gemini, or Anthropic for the full personality.)`
    );
  }

  const wonder =
    "If you could send one toy to the astronauts, what would it be, and why would it be funny in zero gravity?";
  const tonight =
    "Tonight, try this: if the sky is clear, find one bright dot that is not an airplane — even one star counts as a discovery.";

  return `${greet}${bits.join(" ")}\n\n${wonder}\n\n${tonight}`;
}

export function mockParentSummary(): string {
  return [
    "- Cosmo chatted with a child about space topics.",
    "- Demo mode may have been used (shorter replies unless an API key was set).",
    "- Name and age were only stored on this device (browser), not as an account.",
    "- Encourage curiosity; add facts gently and follow the child’s interest.",
    "- If you use parent summary again with a real AI key, the recap will be richer.",
  ].join("\n");
}
