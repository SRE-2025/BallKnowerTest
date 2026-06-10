import type { HighlightDiscoverer, MediaResolver, HighlightRef, ResolvedMedia } from "./types";
import { createYouTubeDiscoverer } from "./youtube-discoverer";
import { seedDiscoverer } from "./seed-discoverer";
import { ytdlpResolver } from "./ytdlp-resolver";
import { directResolver } from "./direct-resolver";

// Discovery: real YouTube Data API when YOUTUBE_API_KEY is set, else the seed
// discoverer (curated current highlights). Always returns something.
export function getDiscoverer(): HighlightDiscoverer {
  const key = process.env.YOUTUBE_API_KEY;
  return key ? createYouTubeDiscoverer(key) : seedDiscoverer;
}

const RESOLVERS: MediaResolver[] = [ytdlpResolver, directResolver];

// Resolution: pick the first resolver that can handle the ref. Downloading is
// rights-gated inside ytdlpResolver.
export async function resolveMedia(ref: HighlightRef): Promise<ResolvedMedia> {
  const resolver = RESOLVERS.find((r) => r.canResolve(ref));
  if (!resolver) throw new Error("No resolver can handle this highlight reference.");
  return resolver.resolve(ref);
}

export * from "./types";
export { LEAGUE_CHANNELS, leagueByKey } from "./league-channels";
