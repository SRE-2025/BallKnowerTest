import type { Repository } from "./types";
import { mockRepository } from "./mock-repository";

// Selects the active data source. Phase 1 only ships "mock". In Phase 2 a
// "database" branch returns a Prisma-backed Repository here — no UI changes.
export function getRepository(): Repository {
  const source = process.env.DATA_SOURCE ?? "mock";
  switch (source) {
    case "mock":
      return mockRepository;
    // case "database":
    //   return prismaRepository; // added in Phase 2
    default:
      return mockRepository;
  }
}

export type { Repository } from "./types";
