export type CosmoVisuals = {
  apod: {
    title: string;
    url: string;
    hdurl?: string;
    explanation: string;
    media_type: string;
    date: string;
  } | null;
  iss: {
    latitude: number;
    longitude: number;
    approxLocation?: string;
  } | null;
  mars: {
    url: string;
    rover?: string;
    earthDate?: string;
  } | null;
};

export type CosmoResponse = {
  reply: string;
  meta: {
    intent: string;
    query?: string;
    llmProvider?: "anthropic" | "openai" | "gemini" | "mock";
    hasIss?: boolean;
    hasApod?: boolean;
    hasCrew?: boolean;
    hasMars?: boolean;
    tinyFishUsed?: boolean;
  };
  visuals: CosmoVisuals;
};

export type ChatMessage = {
  id: string;
  role: "user" | "cosmo";
  text: string;
};
