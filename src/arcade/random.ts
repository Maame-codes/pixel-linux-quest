// A tiny seeded random number generator (mulberry32). Game state carries the
// seed, so update() stays pure and tests can replay exactly the same game.

/** Returns [a number in 0..1, the next seed]. */
export function nextRandom(seed: number): [number, number] {
  const s = (seed + 0x6d2b79f5) >>> 0
  let t = s
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s]
}

/** Returns [an integer in 0..n-1, the next seed]. */
export function randomInt(seed: number, n: number): [number, number] {
  const [r, next] = nextRandom(seed)
  return [Math.floor(r * n), next]
}

/** A fresh seed for a new game. */
export function newSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}
