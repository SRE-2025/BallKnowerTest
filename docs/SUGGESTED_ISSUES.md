# Suggested GitHub Issues

Copy these into GitHub Issues when you're ready. Grouped by phase. Phase 1
issues are checked because this repo already delivers them.

## Phase 1 — Foundation & Mock Dashboard ✅
- [x] Set up initial Next.js project (App Router + TS + Tailwind)
- [x] Author full Prisma schema + domain types
- [x] Create repository abstraction (mock impl)
- [x] Add mock seed data (sources, videos, clips, packages)
- [x] Build Source Library page
- [x] Build Source Settings page
- [x] Build Videos page
- [x] Build Candidate Clips page
- [x] Build Daily Dashboard page
- [x] Build Show Packages list + Show Builder review page
- [x] Build Top 7 Plays mock workflow
- [x] Build talking-head (Best Takes) mock workflow
- [x] Build Filming Prompts UI
- [x] Build approval status workflow + role switcher
- [x] Add README + setup documentation

## Phase 2 — Real Ingestion & Transcription
- [ ] Provision PostgreSQL + run first Prisma migration
- [ ] Write Prisma seed from existing mock data
- [ ] Implement `prismaRepository` behind the Repository interface
- [ ] Source create/edit/persist (Admin write path)
- [ ] First ingestion method (manual upload OR approved RSS/API)
- [ ] Metadata + thumbnail extraction
- [ ] Transcription integration (Deepgram/AssemblyAI) + segment storage
- [ ] Heuristic candidate-clip detection
- [ ] Background job runner (Inngest/BullMQ) + status surfacing

## Phase 3 — Claude AI Producer
- [ ] Anthropic SDK integration + structured JSON output schema
- [ ] Prompt system for ranking + selection
- [ ] Top 7 ranking from candidate clips
- [ ] Talking-head selection
- [ ] Script / caption / title / hashtag / description generation
- [ ] Filming prompt generation
- [ ] Source-aware selection + review flags

## Phase 4 — Filming Uploads
- [ ] Upload interface + slot assignment
- [ ] Preview + replace upload
- [ ] Completion checklist gating render

## Phase 5 — Automated Rendering
- [ ] FFmpeg worker, 9:16 output
- [ ] Captions, lower thirds, source attribution, logo bug, hook text, end card
- [ ] Audio normalization
- [ ] Render job + version tracking

## Phase 6 — Review & Approval
- [ ] Draft review page + versioning
- [ ] Change requests + regeneration
- [ ] Approval records + activity log
- [ ] Approved-for-posting state

## Phase 7 — Posting & Scheduling
- [ ] YouTube Shorts posting first
- [ ] TikTok / Instagram Reels / Facebook Reels / X
- [ ] Scheduling, status tracking, error handling + retries

## Phase 8 — Analytics & Optimization
- [ ] Analytics import per post
- [ ] Performance dashboards (source / clip / hook / caption)
- [ ] Feedback loop into future Claude ranking
