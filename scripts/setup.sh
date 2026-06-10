#!/usr/bin/env bash
# One-command setup for BallKnower database mode.
# Brings up Postgres, installs deps, creates the schema, and seeds mock data.
set -euo pipefail

cd "$(dirname "$0")/.."

DB_URL="postgresql://ballknower:ballknower@localhost:5432/ballknower?schema=public"

echo "==> 1/6  Preparing .env"
[ -f .env ] || cp .env.example .env
node scripts/set-env.mjs "DATA_SOURCE=database" "DATABASE_URL=${DB_URL}"

echo "==> 2/6  Installing dependencies"
npm install

echo "==> 3/6  Starting PostgreSQL (Docker)"
if command -v docker >/dev/null 2>&1; then
  docker compose up -d --wait
else
  echo "    Docker not found. Start a Postgres yourself and set DATABASE_URL in .env,"
  echo "    then re-run: npm run db:push && npm run prisma:seed"
  exit 1
fi

echo "==> 4/6  Generating Prisma client"
npx prisma generate

echo "==> 5/6  Creating database schema"
npx prisma db push --skip-generate

echo "==> 6/6  Seeding mock data"
npm run prisma:seed

echo ""
echo "✅ Setup complete. Start the app with:"
echo "     npm run dev"
echo "   then open http://localhost:3000"
echo ""
echo "Optional API keys (edit .env to enable the real paths):"
echo "   ANTHROPIC_API_KEY      → real AI producer (else deterministic fallback)"
echo "   TRANSCRIPTION_API_KEY  → real Deepgram transcription"
echo "   YOUTUBE_ACCESS_TOKEN   → real YouTube posting (else mock)"
