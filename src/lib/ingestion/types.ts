import type { ImportMethod } from "@/lib/types";

// A normalized video as pulled from any source, before it is persisted.
export interface IngestedVideo {
  externalId: string; // stable id from the source, used for dedupe
  title: string;
  externalUrl?: string;
  thumbnailUrl?: string;
  durationSec: number;
  publishedAt?: string;
  mediaUrl?: string; // direct media url for transcription/rendering, when available
}

export interface SourceConnectorInput {
  sourceId: string;
  importMethod: ImportMethod;
  // Connector-specific config (feed url, channel id, folder, payload...).
  config: Record<string, unknown>;
}

// Every ingestion method implements this. Phase 2 ships RSS + manual; YouTube,
// API and cloud-folder connectors slot in behind the same interface later.
export interface SourceConnector {
  readonly method: ImportMethod;
  fetchNew(input: SourceConnectorInput): Promise<IngestedVideo[]>;
}
