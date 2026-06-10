import type { HighlightDiscoverer, DiscoverOptions, DiscoveredHighlight } from "./types";
import { mockVideos } from "@/mocks/videos";

// Fallback discoverer used when no YOUTUBE_API_KEY is configured. Returns the
// curated current highlights already in the app so the discovery API responds
// with real, embeddable results out of the box. Swap in the YouTube discoverer
// (add the key) to pull live results.
export const seedDiscoverer: HighlightDiscoverer = {
  name: "seed",
  async discover(opts: DiscoverOptions): Promise<DiscoveredHighlight[]> {
    // Match on any meaningful query word; if nothing matches (or only a generic
    // query was given), fall back to the full curated set so the API always
    // returns real, current highlights.
    const words = (opts.query ?? "")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !["plays", "play", "highlights", "highlight", "top", "best"].includes(w));
    const matched = words.length
      ? mockVideos.filter((v) => words.some((w) => v.title.toLowerCase().includes(w)))
      : [];
    const chosen = (matched.length ? matched : mockVideos).slice(0, opts.maxResults ?? 25);
    return chosen.map((v) => ({
        externalId: v.youTubeId ?? v.id,
        youTubeId: v.youTubeId,
        title: v.title,
        watchUrl: v.externalUrl ?? "",
        thumbnailUrl: v.thumbnailUrl,
        publishedAt: v.publishedAt,
        durationSec: v.durationSec,
        sport: opts.sport,
        sourceName: "Curated (seed)",
      }));
  },
};
