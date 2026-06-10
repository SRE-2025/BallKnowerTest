import Parser from "rss-parser";
import type { SourceConnector, SourceConnectorInput, IngestedVideo } from "./types";

// Pulls items from an RSS/Atom feed. Config: { feedUrl: string }.
export const rssConnector: SourceConnector = {
  method: "RSS",
  async fetchNew({ config }: SourceConnectorInput): Promise<IngestedVideo[]> {
    const feedUrl = String(config.feedUrl ?? "");
    if (!feedUrl) return [];

    const parser = new Parser({
      customFields: { item: [["media:content", "media", { keepArray: true }]] },
    });
    const feed = await parser.parseURL(feedUrl);

    return (feed.items ?? []).map((item, i) => {
      const enclosureUrl = item.enclosure?.url;
      return {
        externalId: item.guid ?? item.link ?? `${feedUrl}#${i}`,
        title: item.title ?? "Untitled",
        externalUrl: item.link,
        thumbnailUrl: undefined,
        // RSS rarely exposes precise duration; default and refine after probe.
        durationSec: parseDuration(item as { itunes?: { duration?: string } }),
        publishedAt: item.isoDate ?? item.pubDate,
        mediaUrl: enclosureUrl,
      } satisfies IngestedVideo;
    });
  },
};

function parseDuration(item: { itunes?: { duration?: string } }): number {
  const raw = item.itunes?.duration;
  if (!raw) return 0;
  const parts = raw.split(":").map(Number);
  if (parts.some(Number.isNaN)) return 0;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}
