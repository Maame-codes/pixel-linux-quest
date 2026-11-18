import { describe, expect, it } from 'vitest'

import type { Control, GameInput, Point } from '../types'
import {
  BUG_POINTS,
  PIP_PENALTY,
  ROUND_MS,
  createBugs,
  holeAt,
  spawnEvery,
  upTime,
  updateBugs,
  type BugState,
  type HoleKind,
} from './bugSmash'

const input = (keys: Control[] = [], taps: Point[] = []): GameInput => ({
  held: new Set(),
  pressed: new Set(keys),
  taps,
})

/** A board with one thing up in hole i, and nothing about to spawn. */
function withUp(i: number, kind: HoleKind, extra: Partial<BugState> = {}): BugState {
  const s = { ...createBugs(5), spawnAcc: -1e9, ...extra }
  const holes = [...s.holes]
  holes[i] = { kind, age: 0, life: 1000, splat: null }
  return { ...s, holes }
}

describe('Bug Smash', () => {
  it('starts with 9 empty folders and 45 seconds', () => {
    const s = createBugs(1)
    expect(s.holes).toHaveLength(9)
    expect(s.holes.every((h) => h.kind === 'empty')).toBe(true)
    expect(s.timeLeft).toBe(ROUND_MS)
  })

  it('smashing a bug with its number key scores', () => {
    const s = updateBugs(withUp(4, 'bug'), input(['5']), 16)
    expect(s.score).toBe(BUG_POINTS)
    expect(s.holes[4].kind).toBe('empty')
    expect(s.holes[4].splat?.what).toBe('bug')
    expect(s.events).toContain('score')
  })

  it('a tap on the folder smashes it too', () => {
    const s = updateBugs(withUp(0, 'bug'), input([], [{ x: 10, y: 20 }]), 16)
    expect(s.score).toBe(BUG_POINTS)
  })

  it('smashing Pip loses points, but never below zero', () => {
    const s = updateBugs(withUp(2, 'pip', { score: 50 }), input(['3']), 16)
    expect(s.score).toBe(50 - PIP_PENALTY)
    expect(s.events).toContain('oops')
    expect(updateBugs(withUp(2, 'pip'), input(['3']), 16).score).toBe(0)
  })

  it('smashing an empty folder does nothing', () => {
    const s = updateBugs({ ...createBugs(1), spawnAcc: -1e9 }, input(['1']), 16)
    expect(s.score).toBe(0)
    expect(s.events).toEqual([])
  })

  it('a bug that is not smashed hides again', () => {
    const s = updateBugs(withUp(1, 'bug'), input(), 1001)
    expect(s.holes[1].kind).toBe('empty')
    expect(s.score).toBe(0)
  })

  it('pops things out of folders over time', () => {
    let s = createBugs(9)
    for (let t = 0; t < 2000; t += 16) s = updateBugs(s, input(), 16)
    expect(s.holes.some((h) => h.kind !== 'empty')).toBe(true)
  })

  it('gets faster as the round goes on', () => {
    expect(spawnEvery({ timeLeft: 5000 })).toBeLessThan(spawnEvery({ timeLeft: ROUND_MS }))
    expect(upTime({ timeLeft: 5000 })).toBeLessThan(upTime({ timeLeft: ROUND_MS }))
  })

  it('ends after 45 seconds', () => {
    const s = updateBugs({ ...createBugs(1), timeLeft: 10 }, input(), 16)
    expect(s.over).toBe(true)
    expect(s.timeLeft).toBe(0)
    expect(s.events).toContain('over')
  })

  it('maps taps to holes row by row', () => {
    expect(holeAt(5, 5)).toBe(0)
    expect(holeAt(100, 5)).toBe(2)
    expect(holeAt(60, 60)).toBe(4)
    expect(holeAt(143, 143)).toBe(8)
    expect(holeAt(200, 5)).toBeNull()
  })
})
