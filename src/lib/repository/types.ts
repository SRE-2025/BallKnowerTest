import type {
  Source,
  Video,
  CandidateClip,
  ShowPackage,
  ActivityLogEntry,
} from "@/lib/types";

// The data-access contract the UI depends on. Phase 1 ships a mock
// implementation; Phase 2 adds a Prisma-backed one behind the same interface,
// selected by the DATA_SOURCE env var. The UI never imports a concrete impl.
export interface Repository {
  getSources(): Promise<Source[]>;
  getSource(id: string): Promise<Source | null>;

  getVideos(): Promise<Video[]>;
  getVideo(id: string): Promise<Video | null>;

  getCandidateClips(): Promise<CandidateClip[]>;
  getCandidateClip(id: string): Promise<CandidateClip | null>;

  getPackages(): Promise<ShowPackage[]>;
  getPackage(id: string): Promise<ShowPackage | null>;

  getActivity(): Promise<ActivityLogEntry[]>;
}
