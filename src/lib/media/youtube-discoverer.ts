import type { HighlightDiscoverer, DiscoverOptions, DiscoveredHighlight } from "./types";

// Discovery via the official YouTube Data API v3 (search.list + videos.list).
// Requires YOUTUBE_API_KEY. This is the legitimate "pull from YouTube/the
// league" path — it returns metadata + video ids for highlights, including from
// official league channels.
export function createYouTubeDiscoverer(apiKey: string): HighlightDiscoverer {
  return {
    name: "youtube-data-api",
    async discover(opts: DiscoverOptions): Promise<DiscoveredHighlight[]> {
      const max = Math.min(opts.maxResults ?? 10, 25);
      const channels = opts.channelIds && opts.channelIds.length ? opts.channelIds : [undefined];
      const out: DiscoveredHighlight[] = [];

      for (const channelId of channels) {
        const params = new URLSearchParams({
          key: apiKey,
          part: "snippet",
          type: "video",
          order: "date",
          maxResults: String(max),
          videoEmbeddable: "true",
        });
        if (opts.query) params.set("q", opts.query);
        if (channelId) params.set("channelId", channelId);
        if (opts.publishedAfter) params.set("publishedAfter", opts.publishedAfter.toISOString());

        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
        if (!res.ok) throw new Error(`YouTube search failed: ${res.status} ${await res.text()}`);
        const data = (await res.json()) as YouTubeSearchResponse;

        for (const item of data.items ?? []) {
          if (!item.id?.videoId) continue;
          out.push({
            externalId: item.id.videoId,
            youTubeId: item.id.videoId,
            title: item.snippet?.title ?? "Untitled",
            watchUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            thumbnailUrl:
              item.snippet?.thumbnails?.high?.url ?? `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
            channel: item.snippet?.channelTitle,
            publishedAt: item.snippet?.publishedAt,
            sport: opts.sport,
            sourceName: item.snippet?.channelTitle ?? "YouTube",
          });
        }
      }

      // Enrich durations in one batch (videos.list).
      await enrichDurations(apiKey, out);
      return out;
    },
  };
}

async function enrichDurations(apiKey: string, items: DiscoveredHighlight[]) {
  const ids = items.map((i) => i.youTubeId).filter(Boolean) as string[];
  if (ids.length === 0) return;
  const params = new URLSearchParams({ key: apiKey, part: "contentDetails", id: ids.join(",") });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
  if (!res.ok) return;
  const data = (await res.json()) as YouTubeVideosResponse;
  const byId = new Map((data.items ?? []).map((v) => [v.id, v.contentDetails?.duration]));
  for (const item of items) {
    const iso = item.youTubeId ? byId.get(item.youTubeId) : undefined;
    if (iso) item.durationSec = parseIsoDuration(iso);
  }
}

// Parses ISO 8601 duration (PT#M#S) to seconds.
function parseIsoDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const [, h, mn, s] = m;
  return (Number(h ?? 0) * 3600) + (Number(mn ?? 0) * 60) + Number(s ?? 0);
}

interface YouTubeSearchResponse {
  items?: {
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      channelTitle?: string;
      publishedAt?: string;
      thumbnails?: { high?: { url?: string } };
    };
  }[];
}
interface YouTubeVideosResponse {
  items?: { id: string; contentDetails?: { duration?: string } }[];
}
