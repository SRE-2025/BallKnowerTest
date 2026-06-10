// Upserts KEY=VALUE pairs into a .env file without clobbering existing keys'
// custom values. Usage: node scripts/set-env.mjs KEY=VALUE [KEY=VALUE ...]
// Only sets a key if it is missing or currently empty/placeholder.
import { readFileSync, writeFileSync, existsSync } from "fs";

const file = ".env";
const pairs = process.argv.slice(2).map((a) => {
  const i = a.indexOf("=");
  return [a.slice(0, i), a.slice(i + 1)];
});

let lines = existsSync(file) ? readFileSync(file, "utf8").split("\n") : [];
const keyIndex = new Map();
lines.forEach((line, i) => {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
  if (m) keyIndex.set(m[1], i);
});

for (const [key, value] of pairs) {
  if (keyIndex.has(key)) {
    const i = keyIndex.get(key);
    const current = lines[i].replace(/^\s*[A-Z0-9_]+\s*=/, "").trim().replace(/^["']|["']$/g, "");
    const placeholder = current === "" || current.includes("USER:PASSWORD") || current === "mock";
    if (placeholder) lines[i] = `${key}="${value}"`;
  } else {
    lines.push(`${key}="${value}"`);
  }
}

writeFileSync(file, lines.join("\n"));
console.log(`Updated ${file}`);
