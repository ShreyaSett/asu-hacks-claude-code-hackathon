import type { CosmoResponse } from "./types";

const API = "/api/cosmo";

export async function sendCosmoMessage(payload: {
  message: string;
  childName?: string;
  age?: number;
}): Promise<CosmoResponse> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText);
  }
  return data as CosmoResponse;
}

export async function requestParentSummary(transcript: string): Promise<string> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "parent_summary", transcript }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText);
  }
  return (data as CosmoResponse).reply;
}
