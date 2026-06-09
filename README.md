# BallKnower

**An automated, creator-led daily sports content production platform.**

BallKnower pulls in sports content, lets an AI producer (Claude) rank the best
moments and write all the copy, then hands a near-finished **show package** to a
human team for review, filming, and final approval before anything is posted.

> **The platform does the work, but you stay in control.**
> Nothing posts automatically. Filming, editorial changes, and final approval
> are always human.

---

## 🚦 Current status — Phase 1 (Foundation & Mock Producer Dashboard)

Phase 1 is a **fully clickable MVP running on mock data**. It proves the daily
workflow before we connect any real integrations. There is **no database, no
Claude API, no ingestion, no rendering, and no posting** yet — those arrive in
later phases (see [`docs/PHASE2_PLAN.md`](docs/PHASE2_PLAN.md)).

What works today:

| Area | Phase 1 behavior |
|------|------------------|
| Daily Dashboard | Stats + today's AI-generated packages + activity log |
| Source Library | Mock sources with type, show, import method, active status |
| Source Settings | Per-source platforms, max clip length, attribution, watermark notes |
| Videos | Imported source videos with transcript + status |
| Candidate Clips | Auto-detected moments with category + "why detected" |
| Show Builder | Review clips, approve/reject, **reorder**, edit AI copy inline |
| Filming Prompts | Exact film list per package (hook, intro, reactions, outro) |
| Approvals | Control gates + posting targets; approve-for-posting is role-gated |
| Roles | Mock role switcher (Admin / Editor / Approver / Viewer) — top right |

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
