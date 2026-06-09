# Phase 2 Plan — Real Ingestion & Transcription

Goal: replace mock content with **one** real source end-to-end, persisted in
Postgres, transcribed, and turned into candidate clips — without changing the
Phase 1 UI.

## Why one source first

Ingestion is where integrations get messy (auth, rate limits, formats). Proving
the full pipeline on a single, controllable source de-risks the rest. Start with
**manual upload** or an **approved API/RSS feed** the BallKnower team has cleared.

## Workstreams

### 1. Stand up the database
- [ ] Provision PostgreSQL (local Docker + hosted for staging).
- [ ] `prisma migrate dev` from the existing `schema.prisma`.
- [ ] Write `prisma/seed.ts` from the current `src/mocks/*` data.
- [ ] Add `prismaRepository` implementing the `Repository` interface.
- [ ] Flip `DATA_SOURCE=database`; delete nothing in the UI.

### 2. Source admin (write path)
- [ ] Make Source + SourceSettings pages create/edit/persist (Admin only).
- [ ] Server actions or route handlers for mutations.
- [ ] Activity log entries on changes.

### 3. Ingestion (pick ONE first)
- [ ] **Manual upload:** signed S3 upload → `Video` row (`IMPORTED`).
- [ ] *or* **RSS/API:** scheduled fetch → dedupe → `Video` rows.
- [ ] Extract metadata + thumbnail.

### 4. Transcription
- [ ] Integrate Deepgram or AssemblyAI.
- [ ] Store `Transcript` + timed `TranscriptSegment`s.
- [ ] Status: `TRANSCRIBING` → `TRANSCRIBED`.

### 5. Candidate clip detection (heuristic first)
- [ ] Keyword/loudness/segment heuristics → `CandidateClip` rows with category +
      `detectedReason`. (Claude ranking is Phase 3.)

### 6. Background jobs
- [ ] Introduce Inngest or BullMQ for import → transcribe → detect.
- [ ] Surface job status in the UI.

## Definition of done

- A real uploaded/fetched video appears on the **Videos** page from Postgres.
- It has a stored transcript with segments.
- It produces candidate clips visible on the **Candidate Clips** page.
- The Phase 1 pages render this real data with **no component changes** — only
  the repository implementation differs.
