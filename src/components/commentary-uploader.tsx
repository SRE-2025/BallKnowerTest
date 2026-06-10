"use client";

import * as React from "react";
import type { FilmingPromptStatus } from "@/lib/types";

// Phase 4: per-slot commentary uploader. Posts the filmed clip to /api/uploads
// and reflects the resulting status. Assigns the upload to its filming-prompt
// slot (the `filmingPromptId`).
export function CommentaryUploader({
  filmingPromptId,
  initialStatus,
}: {
  filmingPromptId: string;
  initialStatus: FilmingPromptStatus;
}) {
  const [status, setStatus] = React.useState<FilmingPromptStatus | "UPLOADING">(initialStatus);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("UPLOADING");
    const body = new FormData();
    body.append("file", file);
    body.append("filmingPromptId", filmingPromptId);
    try {
      const res = await fetch("/api/uploads", { method: "POST", body });
      setStatus(res.ok ? "UPLOADED" : initialStatus);
    } catch {
      setStatus(initialStatus);
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="video/*" hidden onChange={onFile} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={status === "UPLOADING"}
        className="rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-accent disabled:opacity-50"
      >
        {status === "UPLOADING" ? "Uploading…" : status === "UPLOADED" ? "Replace clip" : "Upload clip"}
      </button>
    </>
  );
}
