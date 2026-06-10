// CLI: post an approved package to its scheduled platforms.
//   npm run post -- <packageId>
import { postPackage } from "../src/lib/posting/post-package";

async function main() {
  const packageId = process.argv[2];
  if (!packageId) {
    console.error("Usage: npm run post -- <packageId>");
    process.exit(1);
  }
  const out = await postPackage(packageId);
  console.log(JSON.stringify(out, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
