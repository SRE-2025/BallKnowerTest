// CLI: run the ingest pipeline for a source.
//   npm run pipeline -- <sourceId> '{"feedUrl":"https://..."}'
import { runIngestPipeline } from "../src/lib/pipeline/ingest-pipeline";

async function main() {
  const [sourceId, configJson] = process.argv.slice(2);
  if (!sourceId) {
    console.error('Usage: npm run pipeline -- <sourceId> \'{"feedUrl":"..."}\'');
    process.exit(1);
  }
  const config = configJson ? JSON.parse(configJson) : {};
  console.log(`Running pipeline for source ${sourceId}...`);
  const result = await runIngestPipeline(sourceId, config);
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
