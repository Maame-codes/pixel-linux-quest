import { describe, expect, it } from 'vitest'

import type { Control, GameInput, Point } from '../types'
import {
  BALL_R,
  HEIGHT,
  LIVES,
  PADDLE_W,
  PADDLE_Y,
  WIDE_MS,
  WIDE_W,
  createBricks,
  layout,
  moveBall,
  paddleWidth,
  updateBricks,
  type Brick,
  type BrickState,
} from './bitBreaker'

const input = (held: Control[] = [], pressed: Control[] = [], taps: Point[] = []): GameInput => ({
  held: new Set(held),
  pressed: new Set(pressed),
  taps,
})

const brick = (x: number, y: number, hp = 1, label = '.LOG'): Brick => ({ x, y, w: 30, h: 9, hp, maxHp: hp, label })

/** A ball in flight at a known spot. */
function flying(extra: Partial<BrickState>): BrickState {
  return { ...createBricks(3), stuck: false, ...extra }
}

describe('Bit Breaker', () => {
  it('starts with three lives, file bricks and the ball on the paddle', () => {
    const s = createBricks(1)
    expect(s.lives).toBe(LIVES)
    expect(s.stuck).toBe(true)
    expect(s.bricks).toHaveLength(20)
    expect(new Set(s.bricks.map((b) => b.label))).toEqual(new Set(['CORE', '.BAK', '.TMP', '.LOG']))
  })

  it('some bricks take two hits', () => {
    expect(layout(1).filter((b) => b.maxHp === 2).every((b) => b.label === 'CORE')).toBe(true)
    expect(layout(2).filter((b) => b.maxHp === 2).length).toBeGreaterThan(layout(1).filter((b) => b.maxHp === 2).length)
  })

  it('Space launches the ball upwards', () => {
    const s = updateBricks(createBricks(1), input([], ['action']), 16)
    expect(s.stuck).toBe(false)
    expect(s.ball.vy).toBeLessThan(0)
  })

  it('the paddle slides with the arrow keys and stays on screen', () => {
    const s = createBricks(1)
    expect(updateBricks(s, input(['left']), 100).paddleX).toBeLessThan(s.paddleX)
    expect(updateBricks(s, input(['right']), 10_000).paddleX).toBe(160 - PADDLE_W / 2)
  })

  it('bounces off the side walls and the top', () => {
    const s = moveBall(flying({ ball: { x: 1, y: 100, vx: -0.1, vy: -0.1 }, bricks: [] }), 4)
    expect(s.ball.vx).toBeGreaterThan(0)
    const top = moveBall(flying({ ball: { x: 80, y: 1, vx: 0, vy: -0.1 }, bricks: [] }), 4)
    expect(top.ball.vy).toBeGreaterThan(0)
  })

  it('bounces off the paddle, angled by where it lands', () => {
    const s = flying({ paddleX: 80, ball: { x: 90, y: PADDLE_Y - BALL_R, vx: 0, vy: 0.1 }, bricks: [] })
    const next = moveBall(s, 4)
    expect(next.ball.vy).toBeLessThan(0)
    expect(next.ball.vx).toBeGreaterThan(0)
    expect(next.events).toContain('bounce')
  })

  it('breaking a brick scores and bounces the ball', () => {
    const s = flying({ ball: { x: 15, y: 30, vx: 0, vy: -0.1 }, bricks: [brick(0, 20), brick(100, 20)] })
    const next = moveBall(s, 4)
    expect(next.bricks).toHaveLength(1)
    expect(next.score).toBe(10)
    expect(next.ball.vy).toBeGreaterThan(0)
  })

  it('a two-hit brick cracks first, then breaks for double points', () => {
    let s = flying({ ball: { x: 15, y: 30, vx: 0, vy: -0.1 }, bricks: [brick(0, 20, 2, 'CORE'), brick(100, 20)] })
    s = moveBall(s, 4)
    expect(s.bricks[0].hp).toBe(1)
    expect(s.score).toBe(0)
    s = moveBall({ ...s, ball: { x: 15, y: 30, vx: 0, vy: -0.1 } }, 4)
    expect(s.bricks).toHaveLength(1)
    expect(s.score).toBe(20)
  })

  it('losing the ball costs a life, and the last one ends the game', () => {
    const s = updateBricks(flying({ ball: { x: 80, y: HEIGHT + 5, vx: 0, vy: 0.1 } }), input(), 16)
    expect(s.lives).toBe(LIVES - 1)
    expect(s.stuck).toBe(true)
    expect(s.events).toContain('lose')
    const last = updateBricks(flying({ lives: 1, ball: { x: 80, y: HEIGHT + 5, vx: 0, vy: 0.1 } }), input(), 16)
    expect(last.over).toBe(true)
    expect(last.events).toContain('over')
  })

  it('clearing every brick moves on to the next level', () => {
    const s = updateBricks(flying({ ball: { x: 15, y: 30, vx: 0, vy: -0.1 }, bricks: [brick(0, 20)] }), input(), 16)
    expect(s.level).toBe(2)
    expect(s.bricks.length).toBeGreaterThan(0)
    expect(s.events).toContain('level')
  })

  it('catching the power-up widens the paddle for a while', () => {
    const s = updateBricks(flying({ paddleX: 80, power: { x: 80, y: PADDLE_Y - 2 }, ball: { x: 80, y: 80, vx: 0, vy: -0.1 }, bricks: [brick(0, 20)] }), input(), 16)
    expect(paddleWidth(s)).toBe(WIDE_W)
    expect(s.events).toContain('bonus')
    const later = updateBricks({ ...s, wideMs: 10 }, input(), 16)
    expect(paddleWidth(later)).toBe(PADDLE_W)
    expect(WIDE_MS).toBeGreaterThan(0)
  })
})
