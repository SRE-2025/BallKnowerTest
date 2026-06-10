import { promises as fs } from "fs";
import path from "path";

// Storage abstraction for uploads and renders. Phase 4/5 ship a local-disk
// provider; an S3-compatible provider slots in behind the same interface when
// S3_* env vars are configured (see .env.example).

export interface StoredObject {
  key: string;
  url: string;
}

export interface StorageProvider {
  readonly name: string;
  put(key: string, data: Buffer, contentType?: string): Promise<StoredObject>;
}

// Local provider writes under public/ so Next serves the files directly
// (commentary clips + rendered drafts are playable at /uploads/* and /renders/*).
const LOCAL_DIR = path.join(process.cwd(), "public", "uploads");

const localStorage: StorageProvider = {
  name: "local",
  async put(key, data) {
    const dest = path.join(LOCAL_DIR, key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, data);
    return { key, url: `/uploads/${key}` };
  },
};

export function getStorage(): StorageProvider {
  // When S3 is configured, an s3 provider would be returned here. Phase 4 uses
  // local disk so uploads work with zero cloud setup.
  return localStorage;
}
