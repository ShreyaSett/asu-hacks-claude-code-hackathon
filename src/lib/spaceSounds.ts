let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  return ctx;
}

export async function ensureAudio(): Promise<AudioContext | null> {
  const c = getCtx();
  if (c?.state === "suspended") await c.resume().catch(() => {});
  return c;
}

export async function playTypingBlip(): Promise<void> {
  const c = await ensureAudio();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  g.gain.value = 0.0001;
  g.gain.exponentialRampToValueAtTime(0.08, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.06);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.07);
}

export async function playReplyWhoosh(): Promise<void> {
  const c = await ensureAudio();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 800;
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(660, c.currentTime + 0.18);
  g.gain.value = 0.0001;
  g.gain.exponentialRampToValueAtTime(0.12, c.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25);
  osc.connect(filter).connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.26);
}

let ambienceOsc: OscillatorNode | null = null;

export async function setAmbienceOn(on: boolean): Promise<void> {
  const c = await ensureAudio();
  if (!c) return;
  if (on) {
    if (ambienceOsc) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    osc.type = "sine";
    osc.frequency.value = 55;
    g.gain.value = 0.018;
    osc.connect(filter).connect(g).connect(c.destination);
    osc.start();
    ambienceOsc = osc;
  } else {
    try {
      ambienceOsc?.stop();
      ambienceOsc?.disconnect();
    } catch {
      /* ignore */
    }
    ambienceOsc = null;
  }
}
