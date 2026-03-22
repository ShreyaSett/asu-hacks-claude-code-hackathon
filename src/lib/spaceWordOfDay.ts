const WORDS: { word: string; hint: string }[] = [
  { word: "Nebula", hint: "A colorful cloud of gas and dust where stars are born." },
  { word: "Orbit", hint: "The path a moon or planet takes around something bigger." },
  { word: "Rover", hint: "A robot car that drives on another world and sends photos home." },
  { word: "Light-year", hint: "How far light travels in one year — super far!" },
  { word: "Constellation", hint: "A pattern of stars people connect like dot-to-dot." },
  { word: "Gravity", hint: "The invisible pull that keeps moons near planets." },
  { word: "Asteroid", hint: "A space rock — smaller than a planet, bigger than dust." },
];

export function getSpaceWordOfDay(): { word: string; hint: string } {
  const d = new Date();
  const day = Math.floor(d.getTime() / 86400000);
  return WORDS[day % WORDS.length];
}
