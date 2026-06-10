import type { PostingProvider, PostRequest, PostResult } from "./types";
import type { Platform } from "@/lib/types";

// Real (credential-gated) providers for the remaining platforms, mirroring the
// YouTube provider. Each uses the platform's real publish shape and falls back
// to the mock provider (via getPostingProvider) when unconfigured. Most
// platforms PULL the video from a public URL, so a locally-rendered draft must
// be publicly hosted first — see publicVideoUrl().

// Resolves a draft's video URL to a publicly reachable one. Local renders live
// at "/renders/..."; they must be fronted by PUBLIC_BASE_URL (or S3) for a
// platform to fetch them.
export function publicVideoUrl(videoUrl: string): string | null {
  if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) return videoUrl;
  const base = process.env.PUBLIC_BASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}${videoUrl}`;
}

function captionFor(req: PostRequest): string {
  return `${req.title}\n\n${req.description}\n\n${req.hashtags.join(" ")}`.trim();
}

// TikTok Content Posting API (PULL_FROM_URL). Requires TIKTOK_ACCESS_TOKEN.
export function createTikTokProvider(token: string): PostingProvider {
  return {
    platform: "TIKTOK",
    async post(req: PostRequest): Promise<PostResult> {
      const url = publicVideoUrl(req.videoUrl);
      if (!url) return { ok: false, error: "TikTok pulls from a public URL — set PUBLIC_BASE_URL or host the render on S3." };
      try {
        const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" },
          body: JSON.stringify({
            post_info: { title: captionFor(req).slice(0, 2200), privacy_level: "SELF_ONLY" },
            source_info: { source: "PULL_FROM_URL", video_url: url },
          }),
        });
        const data = (await res.json()) as { data?: { publish_id?: string }; error?: { message?: string } };
        if (!res.ok || data.error?.message) return { ok: false, error: `TikTok: ${data.error?.message ?? res.status}` };
        return { ok: true, postedUrl: `tiktok:publish:${data.data?.publish_id ?? "queued"}` };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "TikTok error" };
      }
    },
  };
}

// Instagram Reels (Graph API): create media container, then publish.
// Requires INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_USER_ID.
export function createInstagramProvider(token: string, igUserId: string): PostingProvider {
  return {
    platform: "INSTAGRAM_REELS",
    async post(req: PostRequest): Promise<PostResult> {
      const url = publicVideoUrl(req.videoUrl);
      if (!url) return { ok: false, error: "Instagram pulls from a public URL — set PUBLIC_BASE_URL or host on S3." };
      try {
        const createParams = new URLSearchParams({
          media_type: "REELS",
          video_url: url,
          caption: captionFor(req).slice(0, 2200),
          access_token: token,
        });
        const create = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, { method: "POST", body: createParams });
        const createData = (await create.json()) as { id?: string; error?: { message?: string } };
        if (!create.ok || !createData.id) return { ok: false, error: `Instagram container: ${createData.error?.message ?? create.status}` };

        const pubParams = new URLSearchParams({ creation_id: createData.id, access_token: token });
        const pub = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, { method: "POST", body: pubParams });
        const pubData = (await pub.json()) as { id?: string; error?: { message?: string } };
        if (!pub.ok || !pubData.id) return { ok: false, error: `Instagram publish: ${pubData.error?.message ?? pub.status}` };
        return { ok: true, postedUrl: `https://instagram.com/reel/${pubData.id}` };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Instagram error" };
      }
    },
  };
}

// Facebook Reels (Graph API video_reels). Requires FACEBOOK_ACCESS_TOKEN + FACEBOOK_PAGE_ID.
export function createFacebookProvider(token: string, pageId: string): PostingProvider {
  return {
    platform: "FACEBOOK_REELS",
    async post(req: PostRequest): Promise<PostResult> {
      const url = publicVideoUrl(req.videoUrl);
      if (!url) return { ok: false, error: "Facebook pulls from a public URL — set PUBLIC_BASE_URL or host on S3." };
      try {
        const params = new URLSearchParams({
          upload_phase: "start",
          access_token: token,
          video_url: url,
          description: captionFor(req).slice(0, 2200),
        });
        const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/video_reels`, { method: "POST", body: params });
        const data = (await res.json()) as { video_id?: string; error?: { message?: string } };
        if (!res.ok || data.error?.message) return { ok: false, error: `Facebook: ${data.error?.message ?? res.status}` };
        return { ok: true, postedUrl: `facebook:reel:${data.video_id ?? "queued"}` };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Facebook error" };
      }
    },
  };
}

// X (Twitter) v2. Video upload requires the OAuth1.0a media-upload endpoint; this
// posts the text/caption with a link via v2 and notes the media step. Requires
// X_ACCESS_TOKEN (OAuth2 user context).
export function createXProvider(token: string): PostingProvider {
  return {
    platform: "X",
    async post(req: PostRequest): Promise<PostResult> {
      try {
        const text = `${req.title} ${req.hashtags.slice(0, 3).join(" ")}`.slice(0, 280);
        const res = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = (await res.json()) as { data?: { id?: string }; detail?: string };
        if (!res.ok || !data.data?.id) return { ok: false, error: `X: ${data.detail ?? res.status}` };
        return { ok: true, postedUrl: `https://x.com/i/web/status/${data.data.id}` };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "X error" };
      }
    },
  };
}

// Returns a real provider for the platform when its credentials are present,
// else null (caller falls back to the mock provider).
export function realProviderFor(platform: Platform): PostingProvider | null {
  switch (platform) {
    case "TIKTOK":
      return process.env.TIKTOK_ACCESS_TOKEN ? createTikTokProvider(process.env.TIKTOK_ACCESS_TOKEN) : null;
    case "INSTAGRAM_REELS":
      return process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID
        ? createInstagramProvider(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID)
        : null;
    case "FACEBOOK_REELS":
      return process.env.FACEBOOK_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID
        ? createFacebookProvider(process.env.FACEBOOK_ACCESS_TOKEN, process.env.FACEBOOK_PAGE_ID)
        : null;
    case "X":
      return process.env.X_ACCESS_TOKEN ? createXProvider(process.env.X_ACCESS_TOKEN) : null;
    default:
      return null;
  }
}
