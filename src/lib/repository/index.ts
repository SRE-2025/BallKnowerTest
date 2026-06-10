import type { Repository } from "./types";
import { mockRepository } from "./mock-repository";

// Selects the active data source from DATA_SOURCE. "mock" (default, Phase 1) or
// "database" (Phase 2+, Prisma/Postgres). The UI never imports a concrete impl.
export function getRepository(): Repository {
  const source = process.env.DATA_SOURCE ?? "mock";
  switch (source) {
    case "database": {
      // Lazy require so mock mode never pulls in the Prisma client.
      const { prismaRepository } = require("./prisma-repository") as typeof import("./prisma-repository");
      return prismaRepository;
    }
    case "mock":
    default:
      return mockRepository;
  }
}

export type { Repository } from "./types";
