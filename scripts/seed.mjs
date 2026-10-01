// scripts/seed.mjs
// Creates the bandera schema + table and seeds a few demo rollouts.
// Run: node scripts/seed.mjs  (requires DATABASE_URL in env or .env.local)

import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.trim().match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* no .env.local */
  }
}

loadEnv();

const sql = neon(process.env.DATABASE_URL);

const ROLLOUTS = [
  [0.72, 0.8, 0.02, 0.081, 0.0001, "advance"],
  [0.72, 0.6, 0.02, -0.12, 0.0001, "kill"],
  [0.72, 0.74, 0.02, 0.018, 0.12, "hold"],
];

async function main() {
  await sql`CREATE SCHEMA IF NOT EXISTS bandera`;
  await sql`DROP TABLE IF EXISTS bandera.rollouts`;

  await sql`
    CREATE TABLE bandera.rollouts (
      id serial PRIMARY KEY,
      baseline_mean numeric NOT NULL,
      variant_mean numeric NOT NULL,
      margin numeric NOT NULL,
      delta numeric NOT NULL,
      p_value numeric NOT NULL,
      decision text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;

  for (const [baselineMean, variantMean, margin, delta, pValue, decision] of ROLLOUTS) {
    await sql`INSERT INTO bandera.rollouts (baseline_mean, variant_mean, margin, delta, p_value, decision) VALUES (${baselineMean}, ${variantMean}, ${margin}, ${delta}, ${pValue}, ${decision})`;
  }

  const [{ c }] = await sql`SELECT count(*)::int AS c FROM bandera.rollouts`;
  console.log(`Seeded bandera schema: ${c} rollouts`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
