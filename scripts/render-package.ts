// CLI: render a draft for a package.  npm run render -- <packageId>
import { renderPackage } from "../src/lib/rendering/render-package";

async function main() {
  const packageId = process.argv[2];
  if (!packageId) {
    console.error("Usage: npm run render -- <packageId>");
    process.exit(1);
  }
  const out = await renderPackage(packageId);
  console.log(JSON.stringify(out, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
