import type { ImportMethod } from "@/lib/types";
import type { SourceConnector } from "./types";
import { rssConnector } from "./rss-connector";
import { manualConnector } from "./manual-connector";

// Registry of ingestion connectors keyed by import method. New connectors
// (YOUTUBE, API, CLOUD_FOLDER) register here without touching the pipeline.
const connectors: Partial<Record<ImportMethod, SourceConnector>> = {
  RSS: rssConnector,
  MANUAL_UPLOAD: manualConnector,
  MANUAL_URL: manualConnector,
};

export function getConnector(method: ImportMethod): SourceConnector | null {
  return connectors[method] ?? null;
}

export type { SourceConnector, IngestedVideo } from "./types";
