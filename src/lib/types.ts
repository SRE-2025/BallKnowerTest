// =============================================================================
// Domain types for the mock data layer.
//
// These mirror prisma/schema.prisma so that when Phase 2 swaps the mock
// repository for a real Prisma-backed one, the UI keeps the same shapes.
// =============================================================================

export type Role = "ADMIN" | "EDITOR" | "APPROVER" | "VIEWER";

export type SourceType =
  | "HIGHLIGHT_FEED"
  | "TALKING_HEAD_SHOW"
  | "YOUTUBE_CHANNEL"
  | "RSS_FEED"
  | "PARTNER_FEED"
  | "UPLOADED_VIDEO"
  | "MANUAL_URL"
  | "API_SOURCE"
  | "CLOUD_STORAGE";

export type ImportMethod =
  | "MANUAL_UPLOAD"
  | "MANUAL_URL"
  | "RSS"
  | "API"
  | "CLOUD_FOLDER"
  | "YOUTUBE";

export type Platform =
  | "TIKTOK"
  | "INSTAGRAM_REELS"
  | "YOUTUBE_SHORTS"
  | "FACEBOOK_REELS"
  | "X";

export type VideoStatus =
  | "IMPORTED"
  | "TRANSCRIBING"
  | "TRANSCRIBED"
  | "ANALYZED"
  | "ARCHIVED";

export type ClipCategory =
  | "TOP_PLAY"
  | "DEBATE"
  | "HOT_TAKE"
  | "FUNNY"
  | "BREAKING_NEWS"
  | "INTERVIEW_QUOTE"
  | "VIRAL"
  | "CONTROVERSY"
  | "ANALYSIS"
  | "OTHER";

export type PackageFormat =
  | "TOP_7_PLAYS"
  | "BEST_TAKES"
  | "DAILY_RUNDOWN"
  | "BREAKING_NEWS"
  | "CUSTOM";

export type PackageStatus =
  | "AI_GENERATED"
  | "IN_REVIEW"
  | "NEEDS_CHANGES"
  | "READY_FOR_FILMING"
  | "READY_FOR_RENDER"
  | "DRAFT_RENDERED"
  | "APPROVED_FOR_POSTING"
  | "POSTED";

export type ClipApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "REPLACED";

export type FilmingPromptStatus = "NEEDED" | "FILMED" | "UPLOADED" | "APPROVED";

export type RenderStatus = "QUEUED" | "RENDERING" | "READY" | "FAILED";

export type PostStatus = "SCHEDULED" | "POSTING" | "POSTED" | "FAILED" | "CANCELLED";

export interface SourceSettings {
  allowedPlatforms: Platform[];
  maxClipSeconds: number;
  attributionText?: string;
  watermarkNotes?: string;
  notes?: string;
}

export interface Source {
  id: string;
  providerName: string;
  showName?: string;
  type: SourceType;
  sportLeague?: string;
  importMethod: ImportMethod;
  active: boolean;
  notes?: string;
  settings: SourceSettings;
}

export interface Video {
  id: string;
  sourceId: string;
  title: string;
  externalUrl?: string;
  thumbnailUrl?: string;
  youTubeId?: string; // when present, the clip is embeddable/playable in-app
  mediaUrl?: string; // resolved downloadable/streamable media (local path or remote URL)
  durationSec: number;
  publishedAt?: string;
  status: VideoStatus;
  hasTranscript: boolean;
}

export interface CandidateClip {
  id: string;
  videoId: string;
  sourceId: string;
  startSec: number;
  endSec: number;
  category: ClipCategory;
  transcriptExcerpt?: string;
  detectedReason?: string;
}

// The structured object Claude returns per selected clip (see Phase 3).
export interface ShowPackageClip {
  id: string;
  candidateClipId: string;
  rank: number;
  approvalStatus: ClipApprovalStatus;
  finalStartSec?: number;
  finalEndSec?: number;
  suggestedTitle?: string;
  suggestedCaption?: string;
  suggestedDescription?: string;
  suggestedHashtags: string[];
  suggestedOnScreenText?: string;
  suggestedLowerThird?: string;
  suggestedVoiceover?: string;
  suggestedTransition?: string;
  suggestedFilmingPrompt?: string;
  selectionReason?: string;
  needsReview: boolean;
  reviewFlags: string[];
}

export interface FilmingPrompt {
  id: string;
  packageId: string;
  slot: string;
  order: number;
  prompt: string;
  status: FilmingPromptStatus;
}

export interface RenderInfo {
  status: RenderStatus;
  version: number;
  notes?: string;
}

export interface PostingInfo {
  platform: Platform;
  status: PostStatus;
  scheduledFor?: string;
}

export interface ShowPackage {
  id: string;
  title: string;
  format: PackageFormat;
  status: PackageStatus;
  showDate: string;
  summary?: string;
  clips: ShowPackageClip[];
  filmingPrompts: FilmingPrompt[];
  render: RenderInfo;
  posting: PostingInfo[];
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  actor: string;
  createdAt: string;
}
