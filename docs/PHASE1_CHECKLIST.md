# Phase 1 Checklist — Foundation & Mock Producer Dashboard

Goal: a clickable MVP on mock data that proves the daily workflow before any
real integration.

## Delivered

- [x] Technical architecture documented (`docs/ARCHITECTURE.md`)
- [x] Tech stack chosen (Next.js 14 App Router + TS + Tailwind)
- [x] Repo/folder structure
- [x] `.gitignore`, `.env.example`
- [x] Full Prisma schema authored (`prisma/schema.prisma`) — not yet migrated
- [x] Domain types mirroring the schema (`src/lib/types.ts`)
- [x] Repository seam (mock today, Prisma later)
- [x] Mock data: sources, videos, candidate clips, packages, activity
- [x] Mock role switcher (Admin / Editor / Approver / Viewer) + capability map
- [x] Daily Dashboard page
- [x] Source Library page
- [x] Source Settings page
- [x] Videos page
- [x] Candidate Clips page
- [x] Show Packages list
- [x] Show Builder (review / approve / reject / **reorder** / edit AI copy)
- [x] Top 7 Plays mock package
- [x] Best Takes (talking-head) mock package
- [x] Breaking News mock package
- [x] Filming Prompts page
- [x] Mock render status
- [x] Mock posting status
- [x] Approval workflow with control gates (role-gated approve-for-posting)
- [x] README + setup + run instructions
- [x] Phase 2 implementation plan

## Explicitly NOT in Phase 1

- [ ] Real source ingestion
- [ ] Real Claude API integration
- [ ] Real transcription
- [ ] Real video rendering
- [ ] Real posting / platform APIs
- [ ] Real authentication
- [ ] A live database (schema is authored; no migrations run)

## How to validate

1. `npm install && npm run dev`
2. Walk the flow: Dashboard → open **Top 7 Plays** → reorder a clip, edit a
   caption, approve clips.
3. Switch roles (top-right). As **Viewer** the controls go read-only; as
   **Approver** the "Approve for posting" action unlocks.
4. Check **Filming Prompts** and **Approvals** to see the downstream gates.
