import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  heuristicClassify,
  llmComplete,
  mockCosmoReply,
  mockParentSummary,
  resolveLlm,
} from "./_lib/llm";
import { CLASSIFIER_SYSTEM, buildCosmoSystem, liveDataBlock } from "./_lib/prompts";
import { curateNasaSoundForQuestion, fetchNasaSoundsViaTinyFish } from "./_lib/nasaSoundCurator";
import {
  type FetchFocus,
  type LiveSpaceBundle,
  gatherLiveData,
  maybeTinyFish,
} from "./_lib/spaceData";

function tinyFishConfigured(): boolean {
  return Boolean(process.env.TINYFISH_API_URL?.trim() && process.env.TINYFISH_API_KEY?.trim());
}

function tinyFishNasaSoundsEnabled(): boolean {
  if (!tinyFishConfigured()) return false;
  const v = (process.env.TINYFISH_NASA_SOUNDS || "true").toLowerCase().trim();
  return v !== "0" && v !== "false" && v !== "no";
}

const PARENT_SUMMARY_SYSTEM = `You are helping parents understand what happened in a short chat between their child and Cosmo, a space companion AI.
Write a concise, neutral summary: 5 short bullet points max. No blame, no clinical tone. Note any big curiosity themes. Do not include private instructions.`;

type ClassifierOut = {
  type: "realtime" | "knowledge";
  query: string;
  fetch: FetchFocus[];
  sources: string[];
};

function parseClassifierJson(text: string): ClassifierOut {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON object");
  const j = JSON.parse(cleaned.slice(start, end + 1)) as ClassifierOut;
  if (j.type !== "realtime" && j.type !== "knowledge") {
    throw new Error("Invalid classifier type");
  }
  return {
    type: j.type,
    query: typeof j.query === "string" ? j.query : "",
    fetch: Array.isArray(j.fetch) ? j.fetch : [],
    sources: Array.isArray(j.sources) ? j.sources : [],
  };
}

function normalizeFetch(f: FetchFocus[]): FetchFocus[] {
  const allowed: FetchFocus[] = ["iss", "crew", "apod", "mars", "general"];
  const set = new Set<FetchFocus>();
  for (const x of f) {
    if (allowed.includes(x)) set.add(x);
  }
  if (set.has("general")) {
    ["iss", "crew", "apod"].forEach((k) => set.add(k as FetchFocus));
    set.delete("general");
  }
  if (set.size === 0) return ["iss", "crew", "apod"];
  return [...set];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let llm: ReturnType<typeof resolveLlm>;
  try {
    llm = resolveLlm();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }

  const nasaKey = process.env.NASA_API_KEY || "";

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const mode = body?.mode === "parent_summary" ? "parent_summary" : "chat";

    if (mode === "parent_summary") {
      const transcript = String(body?.transcript ?? "").trim().slice(0, 12000);
      if (!transcript) {
        return res.status(400).json({ error: "transcript is required" });
      }
      let summary: string;
      if (llm.provider === "mock") {
        summary = mockParentSummary();
      } else {
        summary = await llmComplete(llm, PARENT_SUMMARY_SYSTEM, transcript, 1024);
      }
      return res.status(200).json({
        reply: summary,
        meta: { intent: "parent_summary" as const, llmProvider: llm.provider },
        visuals: { apod: null, iss: null, mars: null },
      });
    }

    const message = String(body?.message ?? "").trim();
    const childName = body?.childName ? String(body.childName).trim().slice(0, 40) : undefined;
    const age = Math.min(12, Math.max(4, Number(body?.age) || 7));

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const nasaSoundsPromise = tinyFishNasaSoundsEnabled()
      ? fetchNasaSoundsViaTinyFish(message)
      : Promise.resolve([]);

    let classified: ClassifierOut;
    if (llm.provider === "mock") {
      const h = heuristicClassify(message);
      classified = { ...h, sources: [] };
    } else {
      const classifyText = await llmComplete(llm, CLASSIFIER_SYSTEM, message, 512);
      try {
        classified = parseClassifierJson(classifyText);
      } catch {
        const h = heuristicClassify(message);
        classified = { ...h, sources: [] };
      }
    }

    let liveBundle = {};
    let tinyFishRaw: string | null = null;

    if (classified.type === "realtime") {
      const fetchList = normalizeFetch(classified.fetch);
      liveBundle = await gatherLiveData(fetchList, nasaKey);
      tinyFishRaw = await maybeTinyFish(classified.query || message, classified.sources);
    }

    const soundItems = await nasaSoundsPromise;
    const nasaSound =
      soundItems.length > 0 ? await curateNasaSoundForQuestion(llm, message, soundItems) : null;

    const userPayload = [
      `Child question: ${message}`,
      classified.type === "realtime"
        ? `LIVE DATA JSON:\n${liveDataBlock(liveBundle as LiveSpaceBundle)}`
        : "No live fetch was required (knowledge question).",
      tinyFishRaw ? `OPTIONAL WEB AGENT OUTPUT:\n${tinyFishRaw}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const bundle = liveBundle as LiveSpaceBundle;
    const answer =
      llm.provider === "mock"
        ? mockCosmoReply(message, bundle, age, childName)
        : await llmComplete(llm, buildCosmoSystem(age, childName), userPayload, 2048);

    return res.status(200).json({
      reply: answer,
      meta: {
        intent: classified.type,
        query: classified.query,
        llmProvider: llm.provider,
        hasIss: Boolean(bundle.iss),
        hasApod: Boolean(bundle.apod),
        hasCrew: Boolean(bundle.crew),
        hasMars: Boolean(bundle.mars?.latestPhotoUrl),
        tinyFishUsed: Boolean(tinyFishRaw),
        nasaSound: nasaSound
          ? {
              title: nasaSound.title,
              url: nasaSound.url,
              description: nasaSound.description,
              category: nasaSound.category,
            }
          : null,
      },
      visuals: {
        apod: bundle.apod
          ? {
              title: bundle.apod.title,
              url: bundle.apod.url,
              hdurl: bundle.apod.hdurl,
              explanation: bundle.apod.explanation,
              media_type: bundle.apod.media_type,
              date: bundle.apod.date,
            }
          : null,
        iss: bundle.iss
          ? {
              latitude: bundle.iss.latitude,
              longitude: bundle.iss.longitude,
              approxLocation: bundle.iss.approxLocation,
            }
          : null,
        mars: bundle.mars?.latestPhotoUrl
          ? {
              url: bundle.mars.latestPhotoUrl,
              rover: bundle.mars.rover,
              earthDate: bundle.mars.earthDate,
            }
          : null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
