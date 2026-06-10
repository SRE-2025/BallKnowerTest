// CLI: post any approved packages whose scheduled time is due.
// Run on a cron/interval (e.g. every 5 min):  npm run scheduler
import { postDuePackages } from "../src/lib/posting/scheduler";

async function main() {
  const out = await postDuePackages();
  console.log(JSON.stringify(out, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
