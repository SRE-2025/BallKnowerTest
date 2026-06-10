import type { MediaResolver, HighlightRef, ResolvedMedia } from "./types";

// Resolves a direct media URL (e.g. a partner/broadcast feed or a league media
// API that returns an MP4/HLS link). Validates reachability and passes the URL
// through for the renderer/poster to consume. No download required — the rights
// to use a partner feed come with the partnership.
export const directResolver: MediaResolver = {
  name: "direct-url",
  canResolve(ref: HighlightRef) {
    return ref.provider === "url" && !!ref.url;
  },
  async resolve(ref: HighlightRef): Promise<ResolvedMedia> {
    const url = ref.url!;
    try {
      const head = await fetch(url, { method: "HEAD" });
      const type = head.headers.get("content-type") ?? undefined;
      const len = head.headers.get("content-length");
      return {
        mediaUrl: url,
        format: type,
        bytes: len ? Number(len) : undefined,
        via: "direct-url",
      };
    } catch {
      // Some feeds reject HEAD; still return the URL for the consumer to fetch.
      return { mediaUrl: url, via: "direct-url" };
    }
  },
};
