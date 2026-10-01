import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";

export async function GET() {
  try {
    const db = getSql();
    const rows = await db`SELECT id, baseline_mean, variant_mean, margin, delta, p_value, decision, created_at FROM bandera.rollouts ORDER BY id DESC LIMIT 20`;
    return NextResponse.json({ rollouts: rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error leyendo historial" },
      { status: 500 },
    );
  }
}
