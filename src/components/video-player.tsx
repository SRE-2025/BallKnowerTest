"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Thumbnail-first YouTube player. Shows the thumbnail image immediately (cheap,
// reliable) with a play button; loads the actual iframe only on click. Far more
// dependable than auto-loading many iframes, and the user sees video art at once.
export function VideoPlayer({
  youTubeId,
  thumbnailUrl,
  watchUrl,
  title,
  startSec,
  className,
}: {
  youTubeId?: string;
  thumbnailUrl?: string;
  watchUrl?: string;
  title: string;
  startSec?: number;
  className?: string;
}) {
  const [playing, setPlaying] = React.useState(false);

  // No embeddable id (e.g. NHL.com): show the thumbnail and link out.
  if (!youTubeId) {
    const content = thumbnailUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={thumbnailUrl} alt={title} className="h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-secondary text-xs text-muted-foreground">
        Watch source ↗
      </div>
    );
    return (
      <a
        href={watchUrl}
        target="_blank"
        rel="noreferrer"
        className={cn("relative block aspect-video w-full overflow-hidden rounded-md bg-black", className)}
      >
        {content}
        <PlayBadge />
      </a>
    );
  }

  const thumb = thumbnailUrl ?? `https://i.ytimg.com/vi/${youTubeId}/hqdefault.jpg`;
  const src = `https://www.youtube.com/embed/${youTubeId}?autoplay=1${startSec ? `&start=${Math.floor(startSec)}` : ""}`;

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-md bg-black", className)}>
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt={title} className="h-full w-full object-cover transition group-hover:opacity-90" />
          <PlayBadge />
        </button>
      )}
    </div>
  );
}

function PlayBadge() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90 text-white shadow-lg">
        <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </span>
  );
}
