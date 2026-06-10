import type { Platform } from "@/lib/types";
import type { PostingProvider, PostRequest, PostResult } from "./types";
import { createYouTubeProvider } from "./youtube";

// Mock provider: simulates a successful post and returns a plausible URL. Used
// for any platform not yet wired, or when real credentials are absent — keeps
// the posting workflow demonstrable end-to-end.
function mockProvider(platform: Platform): PostingProvider {
  return {
    platform,
    async post(req: PostRequest): Promise<PostResult> {
      const slug = req.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
      const host = platform.toLowerCase().replace(/_/g, "");
      return { ok: true, postedUrl: `https://${host}.example/${slug}-${Date.now().toString(36)}` };
    },
  };
}

// Selects a provider per platform. YouTube uses the real provider when a token
// is configured; everything else (and YouTube without a token) uses the mock.
export function getPostingProvider(platform: Platform): PostingProvider {
  if (platform === "YOUTUBE_SHORTS") {
    const token = process.env.YOUTUBE_ACCESS_TOKEN;
    if (token) return createYouTubeProvider(token);
  }
  return mockProvider(platform);
}

export type { PostingProvider, PostRequest, PostResult } from "./types";
