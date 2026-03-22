export type MoonPhaseInfo = {
  fraction: number;
  name: string;
  emoji: string;
  illumination: number;
  daysUntilFull: number;
};

/** Reference new moon (UTC). */
const REF_NEW_MOON_MS = new Date("2025-01-29T12:36:00Z").getTime();
const LUNAR_CYCLE_MS = 29.530588853 * 24 * 60 * 60 * 1000;

export function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const diff = date.getTime() - REF_NEW_MOON_MS;
  const pos = ((diff % LUNAR_CYCLE_MS) + LUNAR_CYCLE_MS) % LUNAR_CYCLE_MS;
  const fraction = pos / LUNAR_CYCLE_MS;
  const illumination = Math.round((1 - Math.cos(fraction * 2 * Math.PI)) * 50);

  let name: string;
  let emoji: string;
  if (fraction < 0.025 || fraction >= 0.975) {
    name = "New Moon";
    emoji = "🌑";
  } else if (fraction < 0.25) {
    name = "Waxing Crescent";
    emoji = "🌒";
  } else if (fraction < 0.275) {
    name = "First Quarter";
    emoji = "🌓";
  } else if (fraction < 0.5) {
    name = "Waxing Gibbous";
    emoji = "🌔";
  } else if (fraction < 0.525) {
    name = "Full Moon";
    emoji = "🌕";
  } else if (fraction < 0.75) {
    name = "Waning Gibbous";
    emoji = "🌖";
  } else if (fraction < 0.775) {
    name = "Last Quarter";
    emoji = "🌗";
  } else {
    name = "Waning Crescent";
    emoji = "🌘";
  }

  const daysUntilFull =
    fraction < 0.5
      ? Math.round((0.5 - fraction) * 29.53)
      : Math.round((1.5 - fraction) * 29.53);

  return { fraction, name, emoji, illumination, daysUntilFull };
}

export function moonTip(phase: MoonPhaseInfo): string {
  if (phase.name === "Full Moon")
    return "Tonight is a full moon! Go outside and it will be super bright — you might even see your shadow!";
  if (phase.name === "New Moon")
    return "The moon is hiding tonight. That makes it the best night to spot faint stars!";
  if (phase.daysUntilFull <= 3)
    return `Almost full moon! Just ${phase.daysUntilFull} more day${phase.daysUntilFull === 1 ? "" : "s"} until it's a perfect circle.`;
  return `The moon is ${phase.illumination}% lit. Full moon in ${phase.daysUntilFull} days!`;
}
