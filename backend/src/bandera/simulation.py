"""Deterministic simulation — mirrors lib/bandera/simulation.py."""

from __future__ import annotations


def _lcg(seed: int):
    state = seed & 0xFFFFFFFF

    def next_() -> float:
        nonlocal state
        state = (state * 1664525 + 1013904223) & 0xFFFFFFFF
        return state / 4294967296

    return next_


def generate_scores(seed: int, mean: float, spread: float, n: int) -> list[float]:
    rand = _lcg(seed)
    return [mean + (rand() - 0.5) * spread for _ in range(n)]
