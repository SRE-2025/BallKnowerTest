import type { SourceConnector, SourceConnectorInput, IngestedVideo } from "./types";

// Accepts a manually-provided video (uploaded file or pasted URL).
// Config: { title, mediaUrl?, externalUrl?, durationSec?, thumbnailUrl? }.
export const manualConnector: SourceConnector = {
  method: "MANUAL_UPLOAD",
  async fetchNew({ config }: SourceConnectorInput): Promise<IngestedVideo[]> {
    if (!config.title) return [];
    return [
      {
        externalId: String(config.externalId ?? config.mediaUrl ?? config.title),
        title: String(config.title),
        externalUrl: config.externalUrl ? String(config.externalUrl) : undefined,
        thumbnailUrl: config.thumbnailUrl ? String(config.thumbnailUrl) : undefined,
        durationSec: Number(config.durationSec ?? 0),
        publishedAt: new Date().toISOString(),
        mediaUrl: config.mediaUrl ? String(config.mediaUrl) : undefined,
      },
    ];
  },
};
