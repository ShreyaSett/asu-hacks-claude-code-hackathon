import type { VercelRequest, VercelResponse } from "@vercel/node";
import { llmComplete, resolveLlm } from "./_lib/llm";
import type { QuizData } from "../src/lib/types";

const SYSTEM = `You are generating a fun 3-question multiple choice space quiz for a child aged ~7.
Rules:
- Questions must relate to the given topic.
- Each question has exactly 4 short options.
- One correct answer (0-indexed in "correct").
- "funFact" is a single exciting sentence revealed after answering, starting with "Did you know...".
- Keep all text simple and enthusiastic.
Reply with ONLY valid JSON, no markdown:
{
  "topic": "<topic>",
  "questions": [
    { "q": "<question>", "opts": ["<A>","<B>","<C>","<D>"], "correct": <0-3>, "funFact": "<fact>" }
  ]
}`;

const MOCK_QUIZ: QuizData = {
  topic: "Space",
  questions: [
    {
      q: "How long does it take the ISS to orbit Earth once?",
      opts: ["About 90 minutes", "About 24 hours", "About 7 days", "About 1 hour"],
      correct: 0,
      funFact: "Did you know the astronauts on the ISS see 16 sunrises every single day!",
    },
    {
      q: "Which planet has the most moons?",
      opts: ["Jupiter", "Mars", "Earth", "Venus"],
      correct: 0,
      funFact: "Did you know Saturn has over 140 moons — that's a LOT of night lights!",
    },
    {
      q: "What do you need to hear sound in space?",
      opts: ["Air or another medium", "Just ears", "A special suit", "A radio"],
      correct: 0,
      funFact: "Did you know space is totally silent because there's no air — like being underwater but emptier!",
    },
  ],
};

function parseQuizJson(text: string): QuizData | null {
  let s = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a === -1 || b <= a) return null;
  try {
    return JSON.parse(s.slice(a, b + 1)) as QuizData;
  } catch {
    return null;
  }
}

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
  const topic = String(body?.topic ?? "space").slice(0, 200);

  if (llm.provider === "mock") {
    return res.status(200).json(MOCK_QUIZ);
  }

  try {
    const raw = await llmComplete(llm, SYSTEM, `Topic: ${topic}`, 800);
    const quiz = parseQuizJson(raw);
    if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      return res.status(200).json(MOCK_QUIZ);
    }
    return res.status(200).json(quiz);
  } catch {
    return res.status(200).json(MOCK_QUIZ);
  }
}
