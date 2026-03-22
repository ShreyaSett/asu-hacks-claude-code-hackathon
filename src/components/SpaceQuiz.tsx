import { useEffect, useState } from "react";
import type { QuizData, QuizQuestion } from "@/lib/types";

type Phase = "loading" | "question" | "answered" | "done";

type Props = {
  topic: string;
  onClose: () => void;
};

const STAR_MSGS = ["⭐ 1 star — keep exploring!", "⭐⭐ 2 stars — great job!", "⭐⭐⭐ 3 stars — space genius!"];

async function fetchQuiz(topic: string): Promise<QuizData> {
  const r = await fetch("/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });
  if (!r.ok) throw new Error("Quiz fetch failed");
  return (await r.json()) as QuizData;
}

export function SpaceQuiz({ topic, onClose }: Props) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuiz(topic)
      .then((q) => {
        setQuiz(q);
        setPhase("question");
      })
      .catch(() => {
        setError("Couldn't load the quiz. Try again!");
        setPhase("done");
      });
  }, [topic]);

  const question: QuizQuestion | undefined = quiz?.questions[qIdx];

  function handlePick(idx: number) {
    if (phase !== "question" || !question) return;
    setChosen(idx);
    if (idx === question.correct) setScore((s) => s + 1);
    setPhase("answered");
  }

  function handleNext() {
    if (!quiz) return;
    if (qIdx + 1 >= quiz.questions.length) {
      setPhase("done");
    } else {
      setQIdx((i) => i + 1);
      setChosen(null);
      setPhase("question");
    }
  }

  return (
    <div className="quiz-panel mt-4 rounded-2xl border border-fuchsia-400/30 bg-gradient-to-br from-violet-950/80 to-indigo-950/80 p-4 shadow-glow">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-sm font-semibold text-fuchsia-200">🧠 Quick Space Quiz!</p>
        <button type="button" onClick={onClose} className="rounded-full px-2 py-0.5 text-xs text-slate-500 hover:text-slate-300">
          ✕ Close
        </button>
      </div>

      {phase === "loading" && (
        <div className="flex items-center gap-2 py-4 text-sm text-cyan-200">
          <span className="animate-spin">🌀</span> Generating your quiz…
        </div>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}

      {(phase === "question" || phase === "answered") && question && quiz && (
        <>
          <div className="quiz-progress mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all"
              style={{ width: `${((qIdx + (phase === "answered" ? 1 : 0)) / quiz.questions.length) * 100}%` }}
            />
          </div>
          <p className="mb-1 text-[0.65rem] uppercase tracking-widest text-slate-500">
            Question {qIdx + 1} of {quiz.questions.length}
          </p>
          <p className="mb-4 font-display text-base font-semibold text-white">{question.q}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {question.opts.map((opt, i) => {
              let cls = "quiz-opt rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition ";
              if (phase === "answered") {
                if (i === question.correct) cls += "border-green-400/60 bg-green-900/50 text-green-100 quiz-opt--correct";
                else if (i === chosen) cls += "border-red-400/60 bg-red-900/50 text-red-200 quiz-opt--wrong";
                else cls += "border-white/10 text-slate-500 opacity-50";
              } else {
                cls += "border-white/15 bg-slate-800/50 text-slate-200 hover:border-fuchsia-400/50 hover:bg-fuchsia-950/40 cursor-pointer";
              }
              return (
                <button key={i} type="button" className={cls} onClick={() => handlePick(i)} disabled={phase === "answered"}>
                  <span className="mr-2 font-mono text-xs text-slate-500">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>
          {phase === "answered" && (
            <div className="mt-3 rounded-xl border border-cyan-400/30 bg-cyan-950/40 px-3 py-2 text-sm text-cyan-100">
              {chosen === question.correct ? "🌟 Correct! " : "💫 Almost! "}
              {question.funFact}
            </div>
          )}
          {phase === "answered" && (
            <button type="button" onClick={handleNext} className="btn-neon mt-3 w-full rounded-xl py-2 text-sm font-semibold">
              {qIdx + 1 < (quiz?.questions.length ?? 0) ? "Next question →" : "See my score!"}
            </button>
          )}
        </>
      )}

      {phase === "done" && !error && quiz && (
        <div className="quiz-done flex flex-col items-center gap-3 py-2 text-center">
          <p className="text-4xl">{score === 3 ? "🏆" : score === 2 ? "🥈" : score === 1 ? "🥉" : "🚀"}</p>
          <p className="font-display text-xl font-bold text-cosmic-star">
            {score} / {quiz.questions.length}
          </p>
          <p className="text-sm text-slate-300">{STAR_MSGS[Math.min(score, 2)]}</p>
          <button type="button" onClick={onClose} className="mt-1 rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-300 hover:bg-white/10">
            Back to chat
          </button>
        </div>
      )}
    </div>
  );
}
