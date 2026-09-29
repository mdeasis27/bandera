"use client";

import Link from "next/link";
import { Alert } from "@/design-system/components/alert";
import { Card } from "@/design-system/components/card";
import { MetricCard } from "@/design-system/components/metric-card";
import { StatusBadge } from "@/design-system/components/status-badge";
import { getConfig, getResults } from "@/lib/bandera/demo";

const CFG = getConfig();
const RESULTS = getResults();

function pct(v: number) {
  return `${(v * 100).toFixed(0)}%`;
}

export default function AppPage() {
  const good = RESULTS.find((r) => r.id === "smart-routing")!;
  const bad = RESULTS.find((r) => r.id === "smart-routing-bad")!;

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
            <StatusBadge tone="info" dot className="px-3 py-1">
              Demo mode
            </StatusBadge>
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

        {/* ── ROLLOUTS ────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Rollout gate</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Cada etapa muestrea calidad de baseline y variante, corre Welch&apos;s t-test y decide:
            avanzar (no-peor), mantener (evidencia insuficiente) o matar (regresión). La variante
            buena avanza a 100%; la mala dispara el kill-switch en la primera etapa.
          </p>
          <div className="space-y-5">
            {RESULTS.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{r.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      tráfico final: {pct(r.finalTraffic)}
                    </p>
                  </div>
                  {r.killed ? (
                    <StatusBadge tone="danger" dot>kill-switch</StatusBadge>
                  ) : (
                    <StatusBadge tone="success" dot>completado</StatusBadge>
                  )}
                </div>
                <div className="overflow-x-auto rounded-[var(--radius-md)] bg-muted/20">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Etapa</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Δ</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">p-value</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">IC 95%</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Decisión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {r.stages.map((s, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5 font-mono text-xs text-foreground">{pct(s.stage)}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-foreground">
                            {s.delta >= 0 ? "+" : ""}{s.delta.toFixed(3)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                            {s.pValue < 0.001 ? "< 0.001" : s.pValue.toFixed(3)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                            [{s.ciLow.toFixed(3)}, {s.ciHigh.toFixed(3)}]
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {s.decision === "advance" ? (
                              <StatusBadge tone="success">avanza</StatusBadge>
                            ) : s.decision === "kill" ? (
                              <StatusBadge tone="danger">mata</StatusBadge>
                            ) : (
                              <StatusBadge tone="warning">mantiene</StatusBadge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        </section>

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
          <span>Bandera · AI feature flags · Demo mode</span>
          <a href="https://github.com/mdeasis27/bandera" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-mono">GitHub</a>
        </footer>
      </div>
    </div>
  );
}
