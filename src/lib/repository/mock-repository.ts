import type { Repository } from "./types";
import { mockSources } from "@/mocks/sources";
import { mockVideos } from "@/mocks/videos";
import { mockCandidateClips } from "@/mocks/clips";
import { mockPackages } from "@/mocks/packages";
import { mockActivity } from "@/mocks/activity";

// Phase 1 implementation. Returns in-memory mock data. Async signatures match
// the future Prisma implementation so callers don't change in Phase 2.
export const mockRepository: Repository = {
  async getSources() {
    return mockSources;
  },
  async getSource(id) {
    return mockSources.find((s) => s.id === id) ?? null;
  },
  async getVideos() {
    return mockVideos;
  },
  async getVideo(id) {
    return mockVideos.find((v) => v.id === id) ?? null;
  },
  async getCandidateClips() {
    return mockCandidateClips;
  },
  async getCandidateClip(id) {
    return mockCandidateClips.find((c) => c.id === id) ?? null;
  },
  async getPackages() {
    return mockPackages;
  },
  async getPackage(id) {
    return mockPackages.find((p) => p.id === id) ?? null;
  },
  async getActivity() {
    return mockActivity;
  },
};
