import { llmComplete, type ResolvedLlm } from "./llm.js";
import { maybeTinyFish } from "./spaceData.js";

export type NasaSoundItem = {
  title: string;
  description?: string;
  url: string;
  category?: string;
};

/**
 * Curated direct links from NASA’s “Sounds from Beyond” / Artemis pages so clips still work
 * when TinyFish is missing, fails, or returns unparseable JSON.
 */
export const FALLBACK_NASA_SOUND_CATALOG: NasaSoundItem[] = [
  {
    title: "Artemis I — Liftoff",
    url: "https://www.nasa.gov/wp-content/uploads/2023/02/liftoff1.mp3",
    category: "launch",
    description: "SLS rocket liftoff",
  },
  {
    title: "Artemis I — We rise together",
    url: "https://www.nasa.gov/wp-content/uploads/2023/02/we-rise-together1.mp3",
    category: "launch",
    description: "Launch commentary clip",
  },
  {
    title: "First audio from Mars (Perseverance)",
    url: "https://www.nasa.gov/wp-content/uploads/2024/05/scam-mic-sol001-run001.wav",
    category: "Mars",
    description: "SuperCam microphone after landing",
  },
  {
    title: "Wind on Mars (Perseverance)",
    url: "https://www.nasa.gov/wp-content/uploads/2024/05/scam-mic-sol004-run001.wav",
    category: "Mars",
    description: "Wind with mast deployed",
  },
  {
    title: "Ingenuity helicopter flying on Mars",
    url: "https://www.nasa.gov/wp-content/uploads/2024/05/jpl-20210506-listen-to-nasas-ingenuity-helicopter-as-it-flies-on-mars.wav",
    category: "Mars",
    description: "Helicopter hum recorded by Perseverance",
  },
  {
    title: "Juno — radio emissions at Ganymede",
    url: "https://www.nasa.gov/wp-content/uploads/2024/05/e2-wave-ganymede-flyby-compressed.wav",
    category: "Jupiter",
    description: "Plasma wave instrument",
  },
];

export function mergeNasaSoundPools(primary: NasaSoundItem[], fallback: NasaSoundItem[]): NasaSoundItem[] {
  const seen = new Set<string>();
  const out: NasaSoundItem[] = [];
  for (const item of primary) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    out.push(item);
  }
  for (const item of fallback) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    out.push(item);
  }
  return out;
}

export const NASA_AUDIO_RINGTONES_PAGE = "https://www.nasa.gov/audio-and-ringtones/";

const PICK_SOUND_SYSTEM = `You are Cosmo's sound DJ for kids (~age 7). You receive:
1) The child's latest question.
2) A JSON array of NASA audio clips: {title, description?, url, category?}.

Pick exactly ONE clip that best matches the child's curiosity. Prefer clips whose title or description clearly relates to the topic (planets, rockets, astronauts, ISS, Moon, etc.).

Reply with ONLY valid JSON, no markdown:
{"title":"<exact title from list>","url":"<exact url from list>"}

If nothing fits or all URLs look wrong, reply: {}`;

function isAllowedNasaAudioUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    return h === "www.nasa.gov" || h === "nasa.gov" || h.endsWith(".nasa.gov");
  } catch {
    return false;
  }
}

function normalizeItems(raw: unknown): NasaSoundItem[] {
  if (!Array.isArray(raw)) return [];
  const out: NasaSoundItem[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const title = typeof o.title === "string" ? o.title.trim() : "";
    const url = typeof o.url === "string" ? o.url.trim() : "";
    if (!title || !url || !isAllowedNasaAudioUrl(url)) continue;
    out.push({
      title,
      url,
      description: typeof o.description === "string" ? o.description : undefined,
      category: typeof o.category === "string" ? o.category : undefined,
    });
  }
  return out;
}

/** Pull JSON array from TinyFish / LLM markdown blobs. */
export function parseSoundsJsonArray(text: string): NasaSoundItem[] {
  let s = text.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  const start = s.indexOf("[");
  if (start === -1) return [];
  let depth = 0;
  let end = -1;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return [];
  try {
    const parsed = JSON.parse(s.slice(start, end + 1)) as unknown;
    return normalizeItems(parsed);
  } catch {
    return [];
  }
}

function parsePickJson(text: string): { title: string; url: string } | null {
  let s = text.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a === -1 || b <= a) return null;
  try {
    const j = JSON.parse(s.slice(a, b + 1)) as { title?: string; url?: string };
    const title = typeof j.title === "string" ? j.title.trim() : "";
    const url = typeof j.url === "string" ? j.url.trim() : "";
    if (!title || !url || !isAllowedNasaAudioUrl(url)) return null;
    return { title, url };
  } catch {
    return null;
  }
}

function heuristicPick(message: string, items: NasaSoundItem[]): NasaSoundItem | null {
  const q = message.toLowerCase();
  const keywords = q.split(/\W+/).filter((w) => w.length > 3);
  let best: NasaSoundItem | null = null;
  let bestScore = 0;
  for (const item of items) {
    const hay = `${item.title} ${item.description ?? ""} ${item.category ?? ""}`.toLowerCase();
    let score = 0;
    for (const w of keywords) {
      if (hay.includes(w)) score += 2;
    }
    for (const planet of ["saturn", "jupiter", "mars", "moon", "earth", "venus", "rocket", "launch", "iss", "shuttle", "apollo"]) {
      if (q.includes(planet) && hay.includes(planet)) score += 5;
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return bestScore >= 2 ? best : items[0] ?? null;
}

export async function fetchNasaSoundsViaTinyFish(childQuestion: string): Promise<NasaSoundItem[]> {
  const goal = `Extract NASA audio clips as a JSON array only (no prose): [{"title": string, "description": string, "url": string, "category": string}].
Rules:
- Only include entries with a direct playable audio URL (https, ending in .mp3, .wav, .m4a, .ogg or clearly labeled audio file on nasa.gov).
- Base your extraction on NASA's public audio & ringtones content.
- Focus on clips related to this child's interest: ${childQuestion.slice(0, 500)}`;

  const raw = await maybeTinyFish(goal, [NASA_AUDIO_RINGTONES_PAGE]);
  if (!raw) return [];
  return parseSoundsJsonArray(raw);
}

export async function curateNasaSoundForQuestion(
  llm: ResolvedLlm,
  childQuestion: string,
  items: NasaSoundItem[]
): Promise<NasaSoundItem | null> {
  if (items.length === 0) return null;
  if (llm.provider === "mock") {
    return heuristicPick(childQuestion, items);
  }
  const user = `Child question:\n${childQuestion}\n\nSounds:\n${JSON.stringify(items).slice(0, 8000)}`;
  try {
    const out = await llmComplete(llm, PICK_SOUND_SYSTEM, user, 400);
    const picked = parsePickJson(out);
    if (!picked) return heuristicPick(childQuestion, items);
    const match = items.find((i) => i.url === picked.url) ?? items.find((i) => i.title === picked.title);
    if (match && isAllowedNasaAudioUrl(match.url)) return match;
    return heuristicPick(childQuestion, items);
  } catch {
    return heuristicPick(childQuestion, items);
  }
}
