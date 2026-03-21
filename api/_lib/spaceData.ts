export type IssNow = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

export type PeopleInSpace = {
  number: number;
  people: { name: string; craft: string }[];
};

export type ApodData = {
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: string;
  copyright?: string;
  date: string;
};

export type LiveSpaceBundle = {
  iss?: IssNow & { approxLocation?: string };
  crew?: PeopleInSpace;
  apod?: ApodData;
  mars?: { latestPhotoUrl?: string; rover?: string; earthDate?: string };
  tinyFishNote?: string;
  errors?: string[];
};

async function safeJson<T>(url: string, label: string, errors: string[]): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      errors.push(`${label}: HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    errors.push(`${label}: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

export async function fetchIssNow(): Promise<IssNow | null> {
  const errors: string[] = [];
  const data = await safeJson<{ message: string; iss_position: { latitude: string; longitude: string }; timestamp: number }>(
    "http://api.open-notify.org/iss-now.json",
    "ISS position",
    errors
  );
  if (!data?.iss_position) return null;
  return {
    latitude: parseFloat(data.iss_position.latitude),
    longitude: parseFloat(data.iss_position.longitude),
    timestamp: data.timestamp,
  };
}

export async function fetchPeopleInSpace(): Promise<PeopleInSpace | null> {
  const errors: string[] = [];
  const data = await safeJson<{ number: number; people: { name: string; craft: string }[] }>(
    "http://api.open-notify.org/astros.json",
    "People in space",
    errors
  );
  if (!data) return null;
  return { number: data.number, people: data.people ?? [] };
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | undefined> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=3`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "CosmoSpaceCompanion/1.0 (hackathon; contact: local)",
      },
    });
    if (!res.ok) return undefined;
    const j = (await res.json()) as { address?: Record<string, string> };
    const a = j.address;
    if (!a) return undefined;
    return (
      a.country ||
      a.state ||
      a.region ||
      a.county ||
      a.municipality ||
      a.city ||
      undefined
    );
  } catch {
    return undefined;
  }
}

export async function fetchApod(nasaKey: string): Promise<ApodData | null> {
  const errors: string[] = [];
  const key = nasaKey || "DEMO_KEY";
  const data = await safeJson<ApodData>(
    `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(key)}`,
    "NASA APOD",
    errors
  );
  return data;
}

export async function fetchLatestMarsPhoto(nasaKey: string): Promise<{ url: string; rover: string; earthDate: string } | null> {
  const key = nasaKey || "DEMO_KEY";
  const rovers = ["perseverance", "curiosity"] as const;
  const errors: string[] = [];

  for (const rover of rovers) {
    const data = await safeJson<{
      photos: { img_src: string; earth_date: string }[];
    }>(
      `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/latest_photos?api_key=${encodeURIComponent(key)}`,
      `Mars ${rover}`,
      errors
    );
    const photo = data?.photos?.[0];
    if (photo) {
      return { url: photo.img_src, rover, earthDate: photo.earth_date };
    }
  }
  return null;
}

export type FetchFocus = "iss" | "crew" | "apod" | "mars" | "general";

export async function gatherLiveData(
  focus: FetchFocus[],
  nasaKey: string
): Promise<LiveSpaceBundle> {
  const errors: string[] = [];
  const bundle: LiveSpaceBundle = { errors: errors.length ? errors : undefined };

  const wantIss = focus.includes("iss") || focus.includes("crew") || focus.includes("general");
  const wantCrew = focus.includes("crew") || focus.includes("general");
  const wantApod = focus.includes("apod") || focus.includes("general");
  const wantMars = focus.includes("mars");

  if (wantIss) {
    const iss = await fetchIssNow();
    if (iss) {
      const approxLocation = await reverseGeocode(iss.latitude, iss.longitude);
      bundle.iss = { ...iss, approxLocation };
    }
  }

  if (wantCrew) {
    const crew = await fetchPeopleInSpace();
    if (crew) bundle.crew = crew;
  }

  if (wantApod) {
    const apod = await fetchApod(nasaKey);
    if (apod) bundle.apod = apod;
  }

  if (wantMars) {
    const mars = await fetchLatestMarsPhoto(nasaKey);
    if (mars) {
      bundle.mars = {
        latestPhotoUrl: mars.url,
        rover: mars.rover,
        earthDate: mars.earthDate,
      };
    }
  }

  if (errors.length) bundle.errors = errors;
  return bundle;
}

/** Optional: if you wire TinyFish, set TINYFISH_API_URL + TINYFISH_API_KEY in Vercel env */
export async function maybeTinyFish(
  goal: string,
  urls: string[]
): Promise<string | null> {
  const base = process.env.TINYFISH_API_URL;
  const key = process.env.TINYFISH_API_KEY;
  if (!base || !key) return null;

  try {
    const res = await fetch(base.replace(/\/$/, "") + "/run", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ goal, urls }),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 12000);
  } catch {
    return null;
  }
}
