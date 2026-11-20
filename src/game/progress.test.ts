import { beforeEach, describe, expect, it } from 'vitest'

import {
  badges,
  defaultProgress,
  earnedXp,
  isLevelUnlocked,
  isWorldUnlocked,
  loadProgress,
  nextPlayableLevel,
  saveProgress,
  secretBadges,
  worldStatus,
  type Progress,
} from './progress'

const W1 = ['w1-l1-what-is-linux', 'w1-l2-distro-families', 'w1-l3-how-it-boots']

function withCompleted(ids: string[]): Progress {
  const completed: Record<string, true> = {}
  for (const id of ids) completed[id] = true
  return { version: 1, completed, introSeen: false, secrets: {}, bonusXp: 0 }
}

describe('unlock rules', () => {
  it('starts with only World 1 unlocked', () => {
    const p = defaultProgress()
    expect(isWorldUnlocked(p, 1)).toBe(true)
    expect(isWorldUnlocked(p, 2)).toBe(false)
  })

  it('unlocks World 2 only after World 1 is cleared', () => {
    expect(isWorldUnlocked(withCompleted(['w1-l1-what-is-linux']), 2)).toBe(false)
    expect(isWorldUnlocked(withCompleted(W1), 2)).toBe(true)
  })

  it('keeps worlds with no levels (3–6) locked', () => {
    expect(isWorldUnlocked(withCompleted(W1), 3)).toBe(false)
    expect(worldStatus(withCompleted(W1), 3)).toBe('locked')
  })

  it('unlocks levels within a world in order', () => {
    const p = defaultProgress()
    expect(isLevelUnlocked(p, 'w1-l1-what-is-linux')).toBe(true)
    expect(isLevelUnlocked(p, 'w1-l2-distro-families')).toBe(false)
    expect(isLevelUnlocked(withCompleted(['w1-l1-what-is-linux']), 'w1-l2-distro-families')).toBe(
      true,
    )
  })
})

describe('xp, status and badges', () => {
  it('sums XP for completed levels only', () => {
    expect(earnedXp(defaultProgress())).toBe(0)
    expect(earnedXp(withCompleted(['w1-l1-what-is-linux']))).toBe(40)
  })

  it('reports world status as current then done', () => {
    expect(worldStatus(defaultProgress(), 1)).toBe('current')
    expect(worldStatus(withCompleted(W1), 1)).toBe('done')
  })

  it('awards a world badge once every level is cleared', () => {
    const before = badges(defaultProgress()).find((b) => b.world === 1)
    const after = badges(withCompleted(W1)).find((b) => b.world === 1)
    expect(before?.earned).toBe(false)
    expect(after?.earned).toBe(true)
  })

  it('points to the first level when nothing is done', () => {
    expect(nextPlayableLevel(defaultProgress())).toBe('w1-l1-what-is-linux')
  })
})

describe('persistence', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips through localStorage', () => {
    const p = withCompleted(['w1-l1-what-is-linux'])
    saveProgress(p)
    expect(loadProgress().completed['w1-l1-what-is-linux']).toBe(true)
  })

  it('falls back to defaults on corrupt data', () => {
    localStorage.setItem('plq.progress', '{ not json')
    expect(loadProgress()).toEqual(defaultProgress())
  })
})

describe('secret badges', () => {
  beforeEach(() => localStorage.clear())

  it('Chaos Penguin is hidden until earned, then saved', () => {
    const p = withCompleted([])
    expect(secretBadges(p)).toEqual([expect.objectContaining({ id: 'chaos-penguin', earned: false })])
    saveProgress({ ...p, secrets: { 'chaos-penguin': true } })
    expect(secretBadges(loadProgress())[0].earned).toBe(true)
  })

  it('loads older saved progress that has no secrets yet', () => {
    localStorage.setItem('plq.progress', JSON.stringify({ version: 1, completed: { 'w1-l1-what-is-linux': true }, introSeen: true }))
    const p = loadProgress()
    expect(p.secrets).toEqual({})
    expect(p.completed['w1-l1-what-is-linux']).toBe(true)
  })
})
