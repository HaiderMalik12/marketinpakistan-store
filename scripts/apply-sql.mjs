// Usage: node --env-file=.env.local scripts/apply-sql.mjs db/schema.sql [db/seed.sql]
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const sql = neon(url);

for (const file of process.argv.slice(2)) {
  // Files hold one statement per top-level `;` — split on `;` at line ends.
  const statements = readFileSync(file, "utf8")
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) await sql.query(statement);
  console.log(`${file}: ${statements.length} statements applied`);
}
