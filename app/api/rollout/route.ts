import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";
import { generateScores } from "@/lib/bandera/simulation";
import { welchTTest } from "@/lib/bandera/statistics";
import { decide } from "@/lib/bandera/rollout";

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export async function POST(request: Request) {
  let body: { baselineMean?: unknown; variantMean?: unknown; spread?: unknown; margin?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  const baselineMean = num(body.baselineMean, 0.72);
  const variantMean = num(body.variantMean, 0.8);
  const spread = num(body.spread, 0.12);
  const margin = num(body.margin, 0.02);

  try {
    const baseline = generateScores(12345, baselineMean, spread, 24);
    const variant = generateScores(12346, variantMean, spread, 24);
    const t = welchTTest(baseline, variant, 0.05);
    const decision = decide(t.ciLow, t.ciHigh, margin);

    const db = getSql();
    await db`INSERT INTO bandera.rollouts (baseline_mean, variant_mean, margin, delta, p_value, decision) VALUES (${t.baselineMean}, ${t.variantMean}, ${margin}, ${t.delta}, ${t.pValue}, ${decision})`;

    return NextResponse.json({ ...t, decision });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error simulando el rollout" },
      { status: 500 },
    );
  }
}
