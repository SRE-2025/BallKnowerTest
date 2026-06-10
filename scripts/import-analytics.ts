// CLI: import per-post analytics for posted packages.
//   npm run analytics
import { importAnalytics } from "../src/lib/analytics/import";

async function main() {
  const out = await importAnalytics();
  console.log(JSON.stringify(out, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
