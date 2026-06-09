# Architecture

## Guiding principles

1. **Build in phases.** Validate the workflow on mock data before paying for
   integrations.
2. **The platform does the work; humans stay in control.** Filming, editorial
   changes, and final approval are never automated.
3. **Every AI decision is explainable and editable.** Claude always returns a
   selection reason; every suggested field is an editable input in the UI.
4. **Provenance is first-class.** Source, attribution, and watermark notes
   travel with every clip.
5. **Swap implementations, not interfaces.** The UI depends on a `Repository`
   interface, never a concrete data source.

## High-level system

```
            ┌─────────────────────────────────────────────────────┐
            │                    Next.js App                       │
            │  App Router pages (server) ──► Repository interface  │
            │        │                              │              │
            │   Client islands                 ┌────┴─────┐        │
            │  (role switch,                   │  mock    │ P1     │
            │   show builder)                  │  prisma  │ P2+    │
            └─────────────────────────────────────────────────────┘
                                                   │
                         ┌─────────────────────────┼───────────────────────┐
                      Postgres                  Claude API              S3 + FFmpeg
                      (P2)                       (P3)                    (P2 / P5)
```

### The Repository seam

`src/lib/repository/` is the single place data comes from.

- `types.ts` — the `Repository` interface the UI consumes.
- `mock-repository.ts` — Phase 1 implementation returning in-memory data.
- `index.ts` — `getRepository()` selects an implementation from `DATA_SOURCE`.

Phase 2 adds `prisma-repository.ts` and a `case "database"` branch. No page
changes.

### Data model

The full platform schema is authored now in `prisma/schema.prisma` and mirrored
as TypeScript in `src/lib/types.ts`. Core entities:

- **Users / Roles** — Admin, Editor, Approver, Viewer.
- **Sources / SourceSettings** — provider, type, import method, allowed
  platforms, max clip length, attribution, watermark notes.
- **Videos / Transcripts / TranscriptSegments** — ingested content + timed text.
- **CandidateClips / AiAnalysis** — detected moments + Claude's ranking/reasoning.
- **ShowPackage / ShowPackageClip** — the daily deliverable + per-clip AI copy.
- **FilmingPrompt / CommentaryUpload** — what to film + the user's uploads.
- **RenderJob / RenderVersion / Approval** — rendering + the human approval trail.
- **SocialAccount / SocialPost / Analytics** — posting + performance.
- **ActivityLog / Setting** — auditing + configuration.

### The AI producer contract (Phase 3)

Claude will return **structured JSON** per selected clip. `ShowPackageClip` in
the schema and `ShowPackageClip` in `types.ts` already model that contract:
rank, category, selection reason, suggested title/caption/description/hashtags,
on-screen text, lower third, voiceover, transition, filming prompt, review
flags, and `needsReview`. Claude must never invent clips, timestamps, quotes, or
sources.

## Roadmap

| Phase | Theme | Status |
|-------|-------|--------|
| 1 | Foundation & mock producer dashboard | ✅ this repo |
| 2 | Real ingestion + transcription (one source first) | planned |
| 3 | Real Claude AI producer (structured JSON) | planned |
| 4 | User filming uploads + slot assignment | planned |
| 5 | Automated FFmpeg rendering (9:16, captions, lower thirds) | planned |
| 6 | Review, versioning & approval records | planned |
| 7 | Posting & scheduling (YouTube Shorts first) | planned |
| 8 | Analytics & optimization feedback loop | planned |

## Recommended choices for later phases

- **Transcription:** Deepgram or AssemblyAI (good price/quality on sports audio).
- **Background jobs:** Inngest (serverless-friendly) or BullMQ + Upstash Redis.
- **Auth:** NextAuth (Auth.js) with the role model already in the schema.
- **Storage:** any S3-compatible bucket (AWS S3, Cloudflare R2, Backblaze B2).
- **Rendering:** FFmpeg in a worker; consider Remotion if we want React-defined
  compositions.
- **Deployment:** Vercel for the app; a separate worker host for FFmpeg/jobs.
