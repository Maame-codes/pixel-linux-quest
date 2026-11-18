// Best score per game, saved in localStorage (wrapped: storage can be blocked).

const KEY = 'plq.highScores'

function readAll(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : null
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Record<string, number> = {}
    for (const [id, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[id] = Math.floor(v)
    }
    return out
  } catch {
    return {}
  }
}

export function getHighScore(gameId: string): number {
  return readAll()[gameId] ?? 0
}

/** Record a finished round. Returns true if it is a new high score. */
export function recordScore(gameId: string, score: number): boolean {
  const all = readAll()
  if (score <= (all[gameId] ?? 0)) return false
  all[gameId] = score
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // Not saved; the round still counts on screen.
  }
  return true
}
