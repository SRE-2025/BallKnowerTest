// CLI: generate a show package with the AI producer.
//   npm run generate -- TOP_7_PLAYS
import { generatePackage } from "../src/lib/ai/generate-package";
import type { PackageFormat } from "../src/lib/types";

async function main() {
  const format = (process.argv[2] ?? "TOP_7_PLAYS") as PackageFormat;
  console.log(`Generating ${format}...`);
  const { packageId, usedModel } = await generatePackage({ format });
  console.log(`Created package ${packageId} (producer: ${usedModel})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
