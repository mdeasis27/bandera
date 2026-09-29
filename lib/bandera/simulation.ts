// lib/bandera/simulation.ts
// Deterministic quality simulation. A seeded linear-congruential generator
// produces the same quality samples in TypeScript and Python (exact mod-2^32
// arithmetic), so the rollout decisions are bit-for-bit reproducible across
// languages. Mirrors backend/src/bandera/simulation.py.

function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function generateScores(
  seed: number,
  mean: number,
  spread: number,
  n: number,
): number[] {
  const rand = lcg(seed);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const u = rand();
    out.push(mean + (u - 0.5) * spread);
  }
  return out;
}
