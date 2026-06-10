"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Thumbnail-first YouTube player. Shows the thumbnail image immediately with a
// play button; loads the actual iframe only on click. If the thumbnail image
// fails to load (e.g. network can't reach i.ytimg.com), it degrades to a labeled
// card with a play button instead of a broken image — so a "video" is always
// visible, never a blank/placeholder.
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
  const [imgError, setImgError] = React.useState(false);

  const thumb = thumbnailUrl ?? (youTubeId ? `https://i.ytimg.com/vi/${youTubeId}/hqdefault.jpg` : undefined);

  const Thumb =
    thumb && !imgError ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumb}
        alt={title}
        onError={() => setImgError(true)}
        className="h-full w-full object-cover transition group-hover:opacity-90"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-accent p-3 text-center">
        <span className="line-clamp-3 text-xs font-medium text-foreground">{title}</span>
      </div>
    );

  // No embeddable id (e.g. NHL.com): thumbnail links out to the source.
  if (!youTubeId) {
    return (
      <a
        href={watchUrl}
        target="_blank"
        rel="noreferrer"
        className={cn("group relative block aspect-video w-full overflow-hidden rounded-md bg-black", className)}
      >
        {Thumb}
        <PlayBadge />
      </a>
    );
  }

  const src = `https://www.youtube.com/embed/${youTubeId}?autoplay=1${startSec ? `&start=${Math.floor(startSec)}` : ""}`;
  const watch = watchUrl ?? `https://www.youtube.com/watch?v=${youTubeId}`;

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
          {Thumb}
          <PlayBadge />
        </button>
      )}
      {/* Always-available path to the real video, even if the embed is blocked. */}
      <a
        href={watch}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-1 right-1 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-black"
      >
        YouTube ↗
      </a>
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
