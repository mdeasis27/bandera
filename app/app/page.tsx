"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert } from "@/design-system/components/alert";
import { Card } from "@/design-system/components/card";
import { MetricCard } from "@/design-system/components/metric-card";
import { StatusBadge } from "@/design-system/components/status-badge";
import { getConfig, getResults } from "@/lib/bandera/demo";
import type { TTest } from "@/lib/bandera/statistics";
import type { RolloutDecision } from "@/lib/bandera/types";

const CFG = getConfig();
const RESULTS = getResults();

interface RolloutRun extends TTest {
  decision: RolloutDecision;
}

interface RolloutHistoryItem {
  id: number;
  baseline_mean: number;
  variant_mean: number;
  margin: number;
  delta: number;
  p_value: number;
  decision: string;
  created_at: string;
}

function pct(v: number) {
  return `${(v * 100).toFixed(0)}%`;
}

const DECISION_TONE: Record<RolloutDecision, "success" | "danger" | "warning"> = {
  advance: "success",
  kill: "danger",
  hold: "warning",
};

const DECISION_LABEL: Record<RolloutDecision, string> = {
  advance: "avanza",
  kill: "kill-switch",
  hold: "mantiene",
};

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-foreground">{label}</span>
        <span className="font-mono text-sm tabular-nums text-foreground">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-foreground"
      />
    </Card>
  );
}

export default function AppPage() {
  const good = RESULTS.find((r) => r.id === "smart-routing")!;
  const bad = RESULTS.find((r) => r.id === "smart-routing-bad")!;

  const [baselineMean, setBaselineMean] = useState(0.72);
  const [variantMean, setVariantMean] = useState(0.8);
  const [spread, setSpread] = useState(0.12);
  const [margin, setMargin] = useState(0.02);
  const [result, setResult] = useState<RolloutRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RolloutHistoryItem[]>([]);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/rollout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baselineMean, variantMean, spread, margin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error simulando el rollout");
      } else {
        setResult(data);
        loadHistory();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.rollouts ?? []);
      }
    } catch {
      /* history is best-effort */
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              Inicio
            </Link>
            <div className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <svg className="h-4 w-4 text-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground leading-tight">Bandera</h1>
                <p className="text-xs text-muted-foreground">Feature flags con gradual rollout</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="success" dot className="px-3 py-1">Postgres en vivo</StatusBadge>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* ── SUMMARY BAR ─────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard
            label="Rollout completado"
            value={pct(good.finalTraffic)}
            hint="variante buena · 0 regresiones"
            tone="success"
          />
          <MetricCard
            label="Regresiones (buena)"
            value={good.regressions}
            hint="ninguna a lo largo del rollout"
            tone="success"
          />
          <MetricCard
            label="Kill-switch (mala)"
            value={`${bad.killedAt ? pct(bad.killedAt) : "—"}`}
            hint="disparado en la 1ª etapa"
            tone="danger"
          />
          <MetricCard
            label="Margen no-peor"
            value={CFG.margin}
            hint={`α = ${CFG.alpha}`}
            tone="neutral"
          />
        </div>

        {/* ── PLAYGROUND ──────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Rollout en vivo</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Configura las medias de baseline y variante, muestrea calidad con un generador
            determinista y corre Welch&apos;s t-test en el backend. Cada simulación queda
            persistida en Postgres. Consejo: baja variantMean por debajo de baseline para
            disparar el kill-switch.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Slider label="Media del baseline" value={baselineMean} min={0.5} max={0.9} step={0.01} onChange={setBaselineMean} />
            <Slider label="Media de la variante" value={variantMean} min={0.5} max={0.9} step={0.01} onChange={setVariantMean} />
            <Slider label="Dispersión (spread)" value={spread} min={0.05} max={0.3} step={0.01} onChange={setSpread} />
            <Slider label="Margen no-peor" value={margin} min={0} max={0.05} step={0.005} onChange={setMargin} />
          </div>

          <Card className="mt-4 p-4">
            <button
              onClick={run}
              disabled={loading}
              className="w-full rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-medium text-[#ffffff] hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Simulando…" : "Simular rollout"}
            </button>
          </Card>

          {error && (
            <div className="mt-4 rounded-[var(--radius-md)] border border-danger/25 bg-danger/10 p-4 text-sm text-foreground">
              {error}
            </div>
          )}

          {result && (
            <Card className="mt-4 p-5">
              <div className="flex items-center gap-3">
                <StatusBadge tone={DECISION_TONE[result.decision]} dot>
                  {DECISION_LABEL[result.decision]}
                </StatusBadge>
                <span className="text-sm text-muted-foreground">
                  decisión sobre el intervalo de confianza del efecto
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Δ (variante − base)</p>
                  <p className="font-semibold text-foreground">
                    {result.delta >= 0 ? "+" : ""}{result.delta.toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">p-value</p>
                  <p className="font-semibold text-foreground">
                    {result.pValue < 0.001 ? "< 0.001" : result.pValue.toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">IC 95%</p>
                  <p className="font-semibold text-foreground">
                    [{result.ciLow.toFixed(3)}, {result.ciHigh.toFixed(3)}]
                  </p>
                </div>
              </div>
            </Card>
          )}
        </section>

        {/* ── HISTORY ─────────────────────────── */}
        {history.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">Historial de rollouts (persistido en Postgres)</h3>
            <div className="overflow-x-auto rounded-[var(--radius-md)] shadow-[var(--shadow-card)] bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Base</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variante</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Δ</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">p-value</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Decisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="px-4 py-2.5 tabular-nums text-foreground">{Number(h.baseline_mean).toFixed(2)}</td>
                      <td className="px-4 py-2.5 tabular-nums text-foreground">{Number(h.variant_mean).toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                        {Number(h.delta) >= 0 ? "+" : ""}{Number(h.delta).toFixed(3)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                        {Number(h.p_value) < 0.001 ? "< 0.001" : Number(h.p_value).toFixed(3)}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge tone={DECISION_TONE[h.decision as RolloutDecision]}>
                          {DECISION_LABEL[h.decision as RolloutDecision]}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── NOTE ────────────────────────────── */}
        <section>
          <Alert tone="info" title="Kill-switch = decisión estadística, no monitor humano">
            El rollout no depende de que alguien mire un dashboard. Cada etapa compara la variante
            contra el baseline con un Welch t-test y decide por el intervalo de confianza: si el IC
            entero cae bajo el margen, mata; si no cae bajo el margen, avanza. El kill-switch es la
            misma matemática que `ensayo`, aplicada al tráfico.
          </Alert>
        </section>

        <footer className="pt-8 border-t border-[var(--border)] flex items-center justify-between text-xs text-muted-foreground">
          <span>Bandera · AI feature flags · Backend + Postgres</span>
          <a href="https://github.com/mdeasis27/bandera" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-mono">GitHub</a>
        </footer>
      </div>
    </div>
  );
}
