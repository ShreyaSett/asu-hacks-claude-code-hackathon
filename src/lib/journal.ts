import type { ChatMessage } from "./types";

export type MissionLog = {
  id: string;
  name: string;
  savedAt: string;
  messages: ChatMessage[];
};

const KEY = "cosmo-journal-v1";

function load(): MissionLog[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as MissionLog[];
  } catch {
    return [];
  }
}

function persist(logs: MissionLog[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(logs.slice(0, 30)));
  } catch {
    /* quota */
  }
}

export function saveMission(messages: ChatMessage[], name?: string): MissionLog {
  const all = load();
  const log: MissionLog = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: name ?? `Mission ${all.length + 1}`,
    savedAt: new Date().toISOString(),
    messages,
  };
  persist([log, ...all]);
  return log;
}

export function listMissions(): MissionLog[] {
  return load();
}

export function deleteMission(id: string) {
  persist(load().filter((l) => l.id !== id));
}

export function renameMission(id: string, name: string) {
  persist(load().map((l) => (l.id === id ? { ...l, name } : l)));
}
