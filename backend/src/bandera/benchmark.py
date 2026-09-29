"""Benchmark — mirrors lib/bandera/benchmark.py."""

from __future__ import annotations

from .rollout import simulate_rollout


def benchmark(cfg: dict) -> list[dict]:
    return [simulate_rollout(cfg, e) for e in cfg["experiments"]]
