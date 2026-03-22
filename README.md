# Cosmo — AI Space Companion for Kids

Cosmo is a child-friendly space companion web app built for **ASU Hacks**. Kids chat with Cosmo, who pulls **live space data** (ISS position, crew in space, NASA picture of the day, Mars rover photos) when the question calls for it, and gives clear, age-appropriate explanations when it doesn't. No accounts, no sign-up — everything private to the device.

---

## Features

### 💬 Chat with Cosmo
Ask anything about space and Cosmo answers in simple, enthusiastic language tuned for ~age 7. Supports typed input, 🎤 voice input (Web Speech API), and 🔊 read-aloud replies.

### 🧠 Space Quiz Adventure
After a real question, a **"Quiz me on this!"** button appears. Click it to get a 3-question AI-generated multiple choice quiz on the topic, with animated correct/wrong feedback and a score screen.

### 🌙 Tonight's Sky
Shows the current **moon phase** (name, emoji, illumination %, days until full), the **live ISS position** (lat/lng from Open-Notify), and — if you share your location — an AI-generated description of what planets and stars are visible tonight from your city.

### 📓 Space Journal
Save any chat session as a named **mission log** stored in your browser's localStorage. Browse, rename, expand, and delete past missions from the Journal panel.

### 🃏 Did You Know?
Six flip cards below the chat covering black holes, the ISS, Mars sunsets, Jupiter's storm, and more — tap any card to reveal the full explanation.

### 📺 Watch & Explore
A curated row of NASA / space YouTube links (Solar System 101, Black Holes, Artemis launch, ISS life, Mars 4K, Universe explainer) with thumbnails — opens on YouTube.

### ✨ Animated intro
A flying Cosmo astronaut greets new visitors with a speech bubble intro. Runs once per tab session; skip any time.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| API | Vercel serverless functions (`api/`) |
| LLM | Anthropic Claude (recommended), OpenAI, or Google Gemini |
| Space data | Open-Notify (ISS + crew), NASA APOD + Mars rover, OpenStreetMap Nominatim |
| Map | Leaflet (ISS position) |
| Storage | localStorage (journal, welcome flag) |
| Audio | Web Speech API (TTS + STT), NASA audio clips (audio-first mode only) |

---

## Quickstart

### 1. Install

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and add **one** AI key:

```bash
# Recommended — free $5 credit on first signup at console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-...

# Or Google Gemini (free tier) — aistudio.google.com/apikey
# GEMINI_API_KEY=AIza...

# Or OpenAI
# OPENAI_API_KEY=sk-...
```

With **no key** the app runs in **demo mode**: live ISS/NASA data still works, but Cosmo's replies are short templates.

### 3. Run locally

```bash
npx vercel dev
```

This serves both the Vite frontend and all `/api` routes on one port (usually `http://localhost:3000`). Open the exact URL printed after **"Ready! Available at"**.

> **UI only** (no API): `npm run dev` — Vite proxies `/api` to `http://127.0.0.1:3000`, so run `npx vercel dev` in a second terminal on port 3000 first.

---

## Deploy to Vercel

1. Push this folder to GitHub and import the repo at [vercel.com](https://vercel.com), **or** run `npx vercel` from this directory.
2. Add environment variables in the Vercel dashboard:
   - Required: one of `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, or `OPENAI_API_KEY`
   - Optional: `NASA_API_KEY`, `ANTHROPIC_MODEL`, `COSMO_LLM_PROVIDER`, `COSMO_MOCK_LLM`, `TINYFISH_*`

---

## Environment variables reference

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Anthropic Claude key (checked first) |
| `ANTHROPIC_MODEL` | `claude-3-5-haiku-20241022` | Any Claude model ID |
| `OPENAI_API_KEY` | — | OpenAI key (fallback) |
| `OPENAI_MODEL` | `gpt-4o-mini` | Any OpenAI chat model |
| `GEMINI_API_KEY` | — | Google AI Studio key (fallback) |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Any Gemini model |
| `COSMO_LLM_PROVIDER` | auto | Force `anthropic` / `openai` / `gemini` / `mock` |
| `COSMO_MOCK_LLM` | `false` | Set `true` to disable LLM calls entirely |
| `NASA_API_KEY` | `DEMO_KEY` | Higher rate limits for NASA APOD + Mars |
| `TINYFISH_API_URL` | — | Optional web-scraping agent base URL |
| `TINYFISH_API_KEY` | — | Bearer token for TinyFish agent |
| `TINYFISH_NASA_SOUNDS` | `true` | Fetch NASA audio clips via TinyFish |

---

## Project structure

```
├── api/
│   ├── cosmo.ts              # Main chat + quiz endpoints
│   ├── quiz.ts               # Quiz generation endpoint
│   └── _lib/
│       ├── llm.ts            # Provider resolution + completions
│       ├── anthropic.ts      # Anthropic Messages API
│       ├── prompts.ts        # System prompts
│       ├── spaceData.ts      # ISS / APOD / Mars / TinyFish fetches
│       └── nasaSoundCurator.ts  # NASA audio selection
├── src/
│   ├── components/
│   │   ├── Chat.tsx          # Main chat UI + quiz trigger
│   │   ├── CosmoBuddy.tsx    # Cosmo helper widget + prompt chips
│   │   ├── CosmoWelcomeOverlay.tsx  # Fly-in intro animation
│   │   ├── DidYouKnow.tsx    # Flip cards
│   │   ├── FeatureBar.tsx    # Bottom feature pill bar
│   │   ├── NasaVideoLinks.tsx       # YouTube link cards
│   │   ├── SpaceJournalModal.tsx    # Mission log
│   │   ├── SpaceQuiz.tsx            # Animated quiz UI
│   │   ├── SpaceWordBadge.tsx       # Space Word of the Day
│   │   ├── TonightsSkyPanel.tsx     # Moon + ISS + planets
│   │   └── VisualPanel.tsx          # APOD / ISS map / Mars photo
│   └── lib/
│       ├── api.ts            # fetch wrappers
│       ├── astronomy.ts      # Moon phase math
│       ├── journal.ts        # localStorage mission log CRUD
│       ├── spaceSounds.ts    # Ambient audio + sfx
│       ├── speech.ts         # TTS / STT / NASA audio playback
│       ├── spaceWordOfDay.ts # Daily space word
│       └── types.ts          # Shared TypeScript types
└── public/
    └── astrocutie.svg        # Cosmo mascot
```

---

## Accessibility

- Skip-to-chat link, `aria-live` chat log, labeled form controls throughout
- **Audio-first mode** hides maps and images; Cosmo is prompted to describe visuals in words instead
- **Reduced-motion** respected for all CSS animations (intro fly-in, wobble, quiz transitions)

---

## TinyFish (optional web agent)

Cosmo integrates with **TinyFish** — a web-scraping agent — as a progressive enhancement layer. Set `TINYFISH_API_URL` and `TINYFISH_API_KEY` in your environment to enable it; without them the app works identically, just without the two extras below.

**Live web context for answers.** When a child asks a realtime question, Cosmo's intent classifier can identify relevant URLs (e.g. a NASA news page). TinyFish scrapes those pages and returns a text summary, which is injected into the LLM prompt as optional context. This lets Cosmo cite fresher information than its training data alone — without hallucinating sources.

**NASA audio clip matching.** TinyFish visits `nasa.gov/audio-and-ringtones/` and extracts a structured JSON list of playable audio clips. The LLM then picks the clip most relevant to what the child just asked — so if they ask about Mars, they might hear the Perseverance rover recording wind on the Martian surface. The clip plays in the background during **Audio-first mode**. If TinyFish is not configured, a curated fallback catalog of six verified NASA clips (Artemis launch, Mars wind, Ingenuity helicopter, Ganymede flyby, and more) is used instead.

Set `TINYFISH_NASA_SOUNDS=false` to disable audio matching while keeping the web-context feature active.

---

## Built with Claude

Cosmo was built entirely using **Claude Sonnet** as the development intelligence — every component, API route, and design decision was architected through Claude via Cursor. Claude's reasoning shaped the educational prompt design, the age-adaptive response system, and the multi-source space data pipeline.

The app is provider-agnostic by design — it supports Claude's API, OpenAI, and Gemini interchangeably, so educators and developers can plug in whichever model they have access to. The prompts, the Cosmo personality, and the kid-friendly system instructions were all designed specifically around Claude's capabilities.

Claude isn't just a tool we used to build this — it's the intended brain of Cosmo.

---

## License

Hackathon / educational use. Built for ASU Hacks 2026.
