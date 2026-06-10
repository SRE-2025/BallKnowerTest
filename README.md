# BallKnower

**An automated, creator-led daily sports content production platform.**

BallKnower pulls in sports content, lets an AI producer (Claude) rank the best
moments and write all the copy, then hands a near-finished **show package** to a
human team for review, filming, and final approval before anything is posted.

> **The platform does the work, but you stay in control.**
> Nothing posts automatically. Filming, editorial changes, and final approval
> are always human.

> 🚀 **Just want to run it?** See [`QUICKSTART.md`](QUICKSTART.md).
> `npm install && npm run dev` for the instant demo, or `npm run setup` for the
> full database-backed pipeline.

---

## 🚦 Current status — all 8 phases implemented

The app **runs with zero external services** by default (`DATA_SOURCE=mock`):
the UI is a fully clickable producer dashboard on mock data. Every real
integration (Postgres, Claude, transcription, FFmpeg, posting, analytics) is
wired behind a provider interface with a **working fallback**, so the whole
pipeline runs with or without credentials. Flip `DATA_SOURCE=database` and add
keys to light up the real paths — see
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

| Phase | What it adds | Default fallback |
|-------|--------------|------------------|
| 1 Dashboard | Sources, videos, clips, show builder, filming, approvals, roles | mock data |
| 2 Ingestion | RSS/manual connectors → transcription → candidate-clip detection | mock transcriber |
| 3 AI producer | Claude (`claude-opus-4-8`) ranks clips + writes all copy as structured JSON | deterministic producer |
| 4 Filming uploads | Per-slot commentary upload → storage → DB | local disk |
| 5 Rendering | FFmpeg 9:16 draft from an edit plan | writes edit-plan JSON |
| 6 Approval | Approval records, status gates, change requests | — |
| 7 Posting | YouTube Shorts provider + scheduling/retries | mock provider |
| 8 Analytics | Per-post metrics + performance dashboards feeding producer hints | modeled metrics |

---

## 🧱 Tech stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** TailwindCSS with shadcn-style UI primitives
- **Data (Phase 1):** in-memory mock data behind a `Repository` interface
- **Schema (authored now):** Prisma + PostgreSQL — see `prisma/schema.prisma`
- **Planned:** Claude API (AI producer), S3 storage, FFmpeg rendering,
  Deepgram/AssemblyAI transcription, NextAuth, BullMQ/Inngest jobs

The key architectural seam is `src/lib/repository/`. The UI only ever talks to
the `Repository` interface, so Phase 2 can drop in a Prisma-backed implementation
**without touching any page**.

---

## 🏁 Getting started

**Requirements:** Node.js 18.18+ (or 20+), npm.

```bash
# 1. install dependencies
npm install

# 2. (optional) create a local env file — Phase 1 needs nothing in it
cp .env.example .env

# 3. run the dev server
npm run dev
```

Open <http://localhost:3000>.

> Phase 1 runs entirely on mock data (`DATA_SOURCE=mock`). You do **not** need
> PostgreSQL, an Anthropic key, or any other service to run it.

### Useful scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run typecheck` | TypeScript check, no emit |
| `npm run lint` | Next.js lint |
| `npm run prisma:format` | Format the Prisma schema |
| `npm run prisma:generate` | Generate the Prisma client (no DB needed) |
| `npm run prisma:migrate` | Create/apply DB schema (database mode) |
| `npm run prisma:seed` | Load mock data into Postgres |
| `npm run pipeline -- <srcId> '{json}'` | Ingest → transcribe → detect for a source |
| `npm run generate -- TOP_7_PLAYS` | Run the AI producer to build a package |
| `npm run render -- <packageId>` | Render a 9:16 draft |
| `npm run post -- <packageId>` | Post an approved package |
| `npm run analytics` | Import per-post analytics |

---

## 🗂️ Repo structure

```
BallKnowerTest/
├── prisma/
│   └── schema.prisma          # Full platform data model (authored, not yet migrated)
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx           # Daily Dashboard
│   │   ├── sources/           # Source library + settings
│   │   ├── videos/            # Imported videos
│   │   ├── clips/             # Candidate clips
│   │   ├── packages/          # Show packages + interactive Show Builder
│   │   ├── filming/           # Filming prompts
│   │   └── approvals/         # Approval gates
│   ├── components/            # UI primitives + layout chrome
│   ├── lib/
│   │   ├── types.ts           # Domain types mirroring the Prisma schema
│   │   ├── repository/        # Data-access seam (mock today, Prisma later)
│   │   └── role-context.tsx   # Mock role switcher + capability map
│   └── mocks/                 # Seed/mock data (sources, videos, clips, packages)
├── docs/                      # Architecture, phase plans, checklist, issues
├── .env.example
└── README.md
```

---

## 🌱 Mock / seed data

All mock data lives in `src/mocks/` and is plain TypeScript — edit it freely to
explore the UI:

- `sources.ts` — content sources + usage settings
- `videos.ts` — imported source videos
- `clips.ts` — auto-detected candidate clips
- `packages.ts` — the daily show packages (Top 7, Best Takes, Breaking News)
- `activity.ts` — activity log + mock users

When Phase 2 lands, this same data becomes a Prisma seed script.

---

## 🔭 Where this is going

The full phased plan is in [`docs/`](docs/):

- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design + the 8-phase roadmap
- [`PHASE1_CHECKLIST.md`](docs/PHASE1_CHECKLIST.md) — what Phase 1 delivers
- [`PHASE2_PLAN.md`](docs/PHASE2_PLAN.md) — real ingestion + transcription
- [`SUGGESTED_ISSUES.md`](docs/SUGGESTED_ISSUES.md) — ready-to-create GitHub issues

## 🌿 Branching

- `main` — stable
- `develop` — active development
- `feature/*` — individual features

---

## ⚖️ Sources & licensing

The platform treats source **provenance** as first-class (provider, attribution
text, watermark notes, allowed platforms) so usage rules stay visible on every
clip. Deciding which sources are cleared for use is a business/legal
responsibility owned by the BallKnower team — Phase 1 ships **no scrapers or
automated ingestion**.
