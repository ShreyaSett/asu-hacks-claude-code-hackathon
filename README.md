# Cosmo — AI space companion

Web app for kids: chat with **Cosmo**, who answers with **live space data** (ISS position, people in space, NASA picture of the day, Mars rover photos) when the question needs it, and plain explanations when it does not. **Web Speech API** for voice in and out. **No accounts**, name/age only in **localStorage** on the device.

## Stack

- **React + Vite + TypeScript + Tailwind**
- **Vercel** serverless API: `api/cosmo.ts`
- **LLM** (pick one): **Anthropic Claude**, **OpenAI** (`gpt-4o-mini`), or **Google Gemini** — intent + Cosmo voice. If no key is set, the app runs in **demo mode** (live NASA / ISS data + short template replies).
- **Open Notify** — ISS position, humans in space
- **NASA** — APOD + Mars rover latest (optional API key)
- **OpenStreetMap Nominatim** — rough “flying over” country/region
- **Leaflet** — ISS map in the side panel

## Local development

1. **Install**

   ```bash
   npm install
   ```

2. **Environment** — copy `.env.example` to `.env`. For full Cosmo, set **one** of:

   - `ANTHROPIC_API_KEY`, or
   - `OPENAI_API_KEY` (optional `OPENAI_MODEL`, default `gpt-4o-mini`), or
   - `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey) (optional `GEMINI_MODEL`)

   With **no** key, the API still works in **demo mode** (live space fetches + simple replies). Use `COSMO_LLM_PROVIDER` if multiple keys exist. Set `COSMO_MOCK_LLM=true` to force demo mode.

3. **Run API + UI together** (recommended):

   ```bash
   npx vercel dev
   ```

   This serves the Vite app and `/api/cosmo` on one port (often `http://localhost:3000`).

   If the terminal says **“Requested port 3000 is already in use”**, Vercel picks another port (e.g. **3001**). Open the exact URL it prints after **“Ready! Available at”** — `http://localhost:3000` may then be a different app or an empty page.

4. **UI only** (API calls will fail unless you proxy):

   ```bash
   npm run dev
   ```

   The Vite config proxies `/api` to `http://127.0.0.1:3000`. Run `npx vercel dev` in another terminal on port 3000, or deploy and set `vite.config.ts` proxy target to your preview URL.

## Deploy on Vercel

1. Push this folder to GitHub and import the repo in Vercel, **or** `npx vercel` from this directory.
2. Add environment variables: one of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY` (optional `NASA_API_KEY`, `COSMO_LLM_PROVIDER`, `TINYFISH_*`).

## TinyFish (optional)

If you have a TinyFish HTTP integration, set `TINYFISH_API_URL` and `TINYFISH_API_KEY`. The template posts to `{TINYFISH_API_URL}/run` with `{ goal, urls }` — **adjust** `api/_lib/spaceData.ts` → `maybeTinyFish` to match the real API.

## Accessibility

- Skip link, `aria-live` chat log, labeled controls
- **Audio-first mode** in the header hides map/images; explanations stay in text (Cosmo is prompted to describe visuals in words)

## License

Hackathon / educational use — adjust as needed for your team.
