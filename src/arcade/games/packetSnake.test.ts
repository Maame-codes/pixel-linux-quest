import { describe, expect, it } from 'vitest'

import type { Control, GameInput } from '../types'
import {
  COLS,
  GOLDEN_MS,
  GOLDEN_POINTS,
  MIN_STEP_MS,
  PACKET_POINTS,
  START_STEP_MS,
  createSnake,
  step,
  updateSnake,
  type SnakeState,
} from './packetSnake'

const press = (...controls: Control[]): GameInput => ({ held: new Set(), pressed: new Set(controls), taps: [] })
const none = press()

/** A snake at a known spot, heading right, with food out of the way. */
function at(snake: { x: number; y: number }[], extra: Partial<SnakeState> = {}): SnakeState {
  return { ...createSnake(1), snake, dir: 'right', food: { x: 0, y: 0 }, golden: null, ...extra }
}

describe('Packet Snake', () => {
  it('starts with a 3-long cable and a packet on a free cell', () => {
    const s = createSnake(123)
    expect(s.snake).toHaveLength(3)
    expect(s.snake.some((c) => c.x === s.food.x && c.y === s.food.y)).toBe(false)
    expect(s.score).toBe(0)
  })

  it('moves one cell per step time', () => {
    const s = at([{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }])
    const moved = updateSnake(s, none, START_STEP_MS)
    expect(moved.snake[0]).toEqual({ x: 6, y: 5 })
    expect(moved.snake).toHaveLength(3)
    expect(updateSnake(s, none, START_STEP_MS - 1).snake[0]).toEqual({ x: 5, y: 5 })
  })

  it('turns, but not straight back on itself', () => {
    const s = at([{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }])
    expect(updateSnake(s, press('down'), START_STEP_MS).snake[0]).toEqual({ x: 5, y: 6 })
    expect(updateSnake(s, press('left'), START_STEP_MS).snake[0]).toEqual({ x: 6, y: 5 })
  })

  it('eating a packet scores and grows the cable', () => {
    const s = at([{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], { food: { x: 6, y: 5 } })
    const next = step(s)
    expect(next.score).toBe(PACKET_POINTS)
    expect(next.snake).toHaveLength(4)
    expect(next.events).toContain('score')
    expect(next.snake.some((c) => c.x === next.food.x && c.y === next.food.y)).toBe(false)
  })

  it('speeds up gently every few packets, down to a limit', () => {
    let s = at([{ x: 1, y: 1 }, { x: 0, y: 1 }], { eaten: 2 })
    s = step({ ...s, food: { x: 2, y: 1 } })
    expect(s.stepMs).toBeLessThan(START_STEP_MS)
    const fast = step({ ...at([{ x: 1, y: 1 }, { x: 0, y: 1 }]), eaten: 2, stepMs: MIN_STEP_MS, food: { x: 2, y: 1 } })
    expect(fast.stepMs).toBe(MIN_STEP_MS)
  })

  it('a golden packet is worth bonus points', () => {
    const s = at([{ x: 5, y: 5 }, { x: 4, y: 5 }], { golden: { cell: { x: 6, y: 5 }, msLeft: 3000 } })
    const next = step(s)
    expect(next.score).toBe(GOLDEN_POINTS)
    expect(next.golden).toBeNull()
    expect(next.events).toContain('bonus')
  })

  it('a golden packet disappears after a few seconds', () => {
    const s = at([{ x: 5, y: 5 }], { golden: { cell: { x: 9, y: 9 }, msLeft: GOLDEN_MS }, stepMs: 99999 })
    expect(updateSnake(s, none, GOLDEN_MS - 100).golden).not.toBeNull()
    expect(updateSnake(updateSnake(s, none, GOLDEN_MS - 100), none, 200).golden).toBeNull()
  })

  it('hitting the wall ends the game', () => {
    const s = at([{ x: COLS - 1, y: 3 }, { x: COLS - 2, y: 3 }])
    const next = step(s)
    expect(next.over).toBe(true)
    expect(next.events).toContain('over')
  })

  it('hitting itself ends the game', () => {
    // A loop: heading up into its own body.
    const s = at(
      [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 4, y: 5 }, { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }],
      { dir: 'up' },
    )
    expect(step(s).over).toBe(true)
  })

  it('moving into the cell the tail is leaving is fine', () => {
    const s = at([{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 4, y: 5 }], { dir: 'left' })
    expect(step(s).over).toBe(false)
  })

  it('stops changing once the game is over', () => {
    const s = { ...at([{ x: 5, y: 5 }]), over: true }
    expect(updateSnake(s, press('up'), 1000).snake).toEqual(s.snake)
  })
})
