"""Rollout gate — mirrors lib/bandera/rollout.py."""

from __future__ import annotations

from .simulation import generate_scores
from .statistics import welch_ttest


def decide(ci_low: float, ci_high: float, margin: float) -> str:
    if ci_high < -margin:
        return "kill"
    if ci_low >= -margin:
        return "advance"
    return "hold"


def simulate_rollout(cfg: dict, experiment: dict) -> dict:
    results: list[dict] = []
    killed = False
    killed_at = None
    regressions = 0
    fraction = 0.0

    for i, stage in enumerate(cfg["stages"]):
        baseline = generate_scores(experiment["seed"] + i * 2, cfg["baselineMean"], cfg["spread"], cfg["sampleSize"])
        variant = generate_scores(experiment["seed"] + i * 2 + 1, experiment["variantMean"], cfg["spread"], cfg["sampleSize"])
        t = welch_ttest(baseline, variant, cfg["alpha"])
        decision = decide(t["ciLow"], t["ciHigh"], cfg["margin"])
        results.append({"stage": stage, **t, "decision": decision})

        if decision == "kill":
            killed = True
            killed_at = stage
            regressions += 1
            fraction = 0.0
            break
        if decision == "hold":
            break
        fraction = stage

    completed = not killed and fraction == cfg["stages"][-1]
    return {
        "id": experiment["id"],
        "name": experiment["name"],
        "stages": results,
        "completed": completed,
        "killed": killed,
        "killedAt": killed_at,
        "regressions": regressions,
        "finalTraffic": fraction,
    }
