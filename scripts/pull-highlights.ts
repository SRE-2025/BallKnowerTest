// CLI: pull highlights from YouTube / a league channel into a source.
//   npm run highlights -- <sourceId> <league> [since] [resolve]
//   e.g. npm run highlights -- src_highlight_wire nba lastnight resolve
import { ingestHighlights } from "../src/lib/media/ingest-highlights";

async function main() {
  const [sourceId, league, since, resolveFlag] = process.argv.slice(2);
  if (!sourceId) {
    console.error("Usage: npm run highlights -- <sourceId> [league] [since] [resolve]");
    process.exit(1);
  }
  const result = await ingestHighlights({
    sourceId,
    league,
    since,
    resolve: resolveFlag === "resolve",
  });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
