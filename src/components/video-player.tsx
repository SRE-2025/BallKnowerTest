"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Thumbnail-first YouTube player that NEVER shows a blank/black box.
//
// A titled poster card is always rendered as the base layer. The YouTube
// thumbnail image is layered on top and only becomes visible once it actually
// loads; if it's blocked, hung, or errors, the poster shows through. Clicking
// loads the real embed; a "YouTube ↗" link is always available as a fallback
// path to the source (useful when the embed is blocked).
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
  const [imgLoaded, setImgLoaded] = React.useState(false);

  const thumb = thumbnailUrl ?? (youTubeId ? `https://i.ytimg.com/vi/${youTubeId}/hqdefault.jpg` : undefined);
  const watch = watchUrl ?? (youTubeId ? `https://www.youtube.com/watch?v=${youTubeId}` : undefined);

  // Always-visible base poster (no network needed) + optional thumbnail overlay.
  const Poster = (
    <>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary to-accent p-3 text-center">
        <span className="line-clamp-3 text-xs font-medium text-foreground">{title}</span>
      </div>
      {thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={title}
          onLoad={() => setImgLoaded(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            imgLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      <PlayBadge />
    </>
  );

  // No embeddable id (e.g. NHL.com): the whole poster links to the source.
  if (!youTubeId) {
    return (
      <a
        href={watch}
        target="_blank"
        rel="noreferrer"
        className={cn("group relative block aspect-video w-full overflow-hidden rounded-md bg-secondary", className)}
      >
        {Poster}
      </a>
    );
  }

  const src = `https://www.youtube.com/embed/${youTubeId}?autoplay=1${startSec ? `&start=${Math.floor(startSec)}` : ""}`;

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-md bg-secondary", className)}>
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
          {Poster}
        </button>
      )}
      {watch && (
        <a
          href={watch}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-1 right-1 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-black"
        >
          YouTube ↗
        </a>
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
