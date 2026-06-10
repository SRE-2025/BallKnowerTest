# Quickstart

Two ways to run BallKnower. Start with Path A to see it instantly; use Path B
when you want the full produce → render → approve → post → analytics pipeline.

Requirements: **Node 18.18+ (or 20+)**. Path B also needs **Docker** (for
Postgres) and optionally **ffmpeg** (for real video drafts).

---

## Path A — Instant demo (no database, no keys)

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The whole UI works on mock data: dashboard,
source library, candidate clips, show builder (review / reorder / edit / approve),
filming prompts, approvals, analytics, and the role switcher (top-right).

That's it — nothing else to configure.

---

## Path B — Full pipeline (real database, one command)

```bash
npm run setup
```

This single command:
1. creates `.env` (sets `DATA_SOURCE=database` + the Docker `DATABASE_URL`),
2. installs dependencies,
3. starts PostgreSQL in Docker,
4. creates the schema and seeds mock data.

Then start the app:

```bash
npm run dev
```

### Drive the money pipeline

From the **Show Packages** page click **Generate with AI producer**, open the
package, then use the **Pipeline** panel: **Render draft → Approve for posting →
Post / schedule**. (Switch the role chip top-right to **Admin** or **Approver**
to unlock approve/post.)

Or run it headless:

```bash
# ingest a real source (optional — seed data already has clips)
npm run pipeline -- src_pitchside '{"feedUrl":"https://example.com/feed.xml"}'

npm run generate -- TOP_7_PLAYS     # AI producer builds + ranks a package
# -> note the package id it prints, e.g. cmq8...
npm run render   -- <packageId>     # 9:16 draft (writes an edit plan if ffmpeg is absent)
# approve it in the UI (Approver/Admin) — or it stays gated, by design
npm run post     -- <packageId>     # posts to the scheduled platforms
npm run analytics                   # imports per-post metrics -> feeds future ranking
```

Rendered drafts and uploaded clips are served at `/renders/...` and
`/uploads/...` while `npm run dev` is running.

### Reset / stop

```bash
npm run db:reset    # wipe + re-seed the database
npm run db:down     # stop Postgres
```

---

## Turning on the real (paid) integrations

Everything above runs on **free fallbacks**. To switch a fallback to its real
provider, add the key to `.env` and restart `npm run dev`:

| Add to `.env` | Turns on |
|---|---|
| `ANTHROPIC_API_KEY` | Real Claude AI producer (`claude-opus-4-8`) instead of the deterministic one |
| `TRANSCRIPTION_API_KEY` (+ `TRANSCRIPTION_PROVIDER=deepgram`) | Real transcription during ingestion |
| `YOUTUBE_ACCESS_TOKEN` | Real YouTube Shorts posting instead of the mock |
| install `ffmpeg` on your machine | Real 9:16 video drafts instead of an edit-plan file |

Nothing else needs editing — the providers detect the keys automatically.

---

## Notes before you publish for real

- **You own the licensing call** on which sources are cleared. Attribution and
  watermark notes are tracked per source; the platform never auto-posts without
  an explicit human approval step.
- Real **clip compositing** (cutting actual source footage into the draft) needs
  downloadable media stored during ingestion; the renderer currently composites
  captions/lower-thirds over placeholders. That's the one remaining piece between
  "draft" and "publish-ready video".
