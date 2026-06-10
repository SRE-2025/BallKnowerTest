import type { Platform } from "@/lib/types";

export interface PostRequest {
  platform: Platform;
  title: string;
  description: string;
  hashtags: string[];
  videoUrl: string; // local/S3 url of the rendered draft
  scheduledFor?: Date;
}

export interface PostResult {
  ok: boolean;
  postedUrl?: string;
  error?: string;
}

// Every platform integration implements this. Phase 7 ships YouTube (real
// request shape, credential-gated) + a mock provider used everywhere a
// platform isn't wired or credentials are absent.
export interface PostingProvider {
  readonly platform: Platform;
  post(req: PostRequest): Promise<PostResult>;
}
