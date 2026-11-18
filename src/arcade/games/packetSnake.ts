import { C } from '../../game/pixelArt/palette'
import { randomInt, nextRandom } from '../random'
import { SNAKE_TIPS } from '../tips'
import type { Control, DrawOptions, GameDef, GameEvent, GameInput } from '../types'

// Packet Snake: a network cable slithers around a grid eating data packets.
// Pure logic first (state, update), drawing after.

export const COLS = 20
export const ROWS = 15
export const CELL = 8

export type Dir = 'up' | 'down' | 'left' | 'right'
export type Cell = { x: number; y: number }

export type SnakeState = {
  /** Head first. */
  snake: Cell[]
  dir: Dir
  /** Turns pressed but not yet taken, so quick double turns work. */
  queued: Dir[]
  food: Cell
  golden: { cell: Cell; msLeft: number } | null
  score: number
  eaten: number
  /** Time between moves. Gets shorter as you eat. */
  stepMs: number
  acc: number
  over: boolean
  seed: number
  events: GameEvent[]
}

export const START_STEP_MS = 180
export const MIN_STEP_MS = 80
export const SPEED_EVERY = 3
export const SPEED_STEP_MS = 10
export const PACKET_POINTS = 10
export const GOLDEN_POINTS = 50
export const GOLDEN_MS = 5000
export const GOLDEN_CHANCE = 0.25

const DELTA: Record<Dir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}
const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }
const DIRS: readonly Dir[] = ['up', 'down', 'left', 'right']

const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y

/** Pick a random cell that nothing is standing on. */
export function freeCell(state: Pick<SnakeState, 'snake' | 'food' | 'golden'>, seed: number, skipFood: boolean): [Cell, number] {
  const taken = (c: Cell) =>
    state.snake.some((s) => same(s, c)) ||
    (!skipFood && same(state.food, c)) ||
    (state.golden !== null && same(state.golden.cell, c))
  const free: Cell[] = []
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!taken({ x, y })) free.push({ x, y })
  if (free.length === 0) return [state.snake[0], seed]
  const [i, next] = randomInt(seed, free.length)
  return [free[i], next]
}

export function createSnake(seed: number): SnakeState {
  const y = Math.floor(ROWS / 2)
  const snake = [{ x: 6, y }, { x: 5, y }, { x: 4, y }]
  const base = { snake, food: { x: -1, y: -1 }, golden: null }
  const [food, s2] = freeCell(base, seed, true)
  return {
    snake,
    dir: 'right',
    queued: [],
    food,
    golden: null,
    score: 0,
    eaten: 0,
    stepMs: START_STEP_MS,
    acc: 0,
    over: false,
    seed: s2,
    events: [],
  }
}

/** Queue the direction keys pressed this frame, ignoring reversals. */
function queueTurns(state: SnakeState, pressed: ReadonlySet<Control>): Dir[] {
  const queued = [...state.queued]
  for (const d of DIRS) {
    if (!pressed.has(d)) continue
    const last = queued[queued.length - 1] ?? state.dir
    if (d !== last && d !== OPPOSITE[last] && queued.length < 2) queued.push(d)
  }
  return queued
}

/** Move one cell. */
export function step(state: SnakeState): SnakeState {
  const [turn, ...rest] = state.queued
  const dir = turn ?? state.dir
  const head = state.snake[0]
  const next = { x: head.x + DELTA[dir].x, y: head.y + DELTA[dir].y }
  const events: GameEvent[] = [...state.events]

  const eatsFood = same(next, state.food)
  const eatsGolden = state.golden !== null && same(next, state.golden.cell)
  const grows = eatsFood || eatsGolden

  // The tail moves out of the way unless the snake is growing.
  const body = grows ? state.snake : state.snake.slice(0, -1)
  const hitsWall = next.x < 0 || next.y < 0 || next.x >= COLS || next.y >= ROWS
  if (hitsWall || body.some((c) => same(c, next))) {
    return { ...state, dir, queued: rest, over: true, events: [...events, 'over'] }
  }

  let s: SnakeState = { ...state, dir, queued: rest, snake: [next, ...body], events }
  if (eatsGolden) {
    s = { ...s, golden: null, score: s.score + GOLDEN_POINTS, events: [...s.events, 'bonus'] }
  }
  if (eatsFood) {
    const eaten = s.eaten + 1
    const stepMs = eaten % SPEED_EVERY === 0 ? Math.max(MIN_STEP_MS, s.stepMs - SPEED_STEP_MS) : s.stepMs
    const [food, seedA] = freeCell(s, s.seed, true)
    s = { ...s, food, seed: seedA, eaten, stepMs, score: s.score + PACKET_POINTS, events: [...s.events, 'score'] }
    // Now and then a golden packet appears for a few seconds.
    const [roll, seedB] = nextRandom(s.seed)
    s = { ...s, seed: seedB }
    if (s.golden === null && roll < GOLDEN_CHANCE) {
      const [cell, seedC] = freeCell(s, s.seed, false)
      s = { ...s, golden: { cell, msLeft: GOLDEN_MS }, seed: seedC }
    }
  }
  return s
}

export function updateSnake(state: SnakeState, input: GameInput, dt: number): SnakeState {
  if (state.over) return state.events.length ? { ...state, events: [] } : state
  let s: SnakeState = { ...state, events: [], queued: queueTurns(state, input.pressed) }
  if (s.golden) {
    const msLeft = s.golden.msLeft - dt
    s = { ...s, golden: msLeft > 0 ? { ...s.golden, msLeft } : null }
  }
  s = { ...s, acc: s.acc + dt }
  while (s.acc >= s.stepMs && !s.over) {
    s = step({ ...s, acc: s.acc - s.stepMs })
  }
  return s
}

// ---- Drawing -------------------------------------------------------------

const W = COLS * CELL
const H = ROWS * CELL

function drawSnake(ctx: CanvasRenderingContext2D, s: SnakeState): void {
  // Cable: each segment filled, with a bridge to the next so it is one line.
  s.snake.forEach((c, i) => {
    const px = c.x * CELL
    const py = c.y * CELL
    ctx.fillStyle = i % 2 === 0 ? C.sky : C.blue
    ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2)
    const next = s.snake[i + 1]
    if (next) {
      const bx = Math.min(c.x, next.x) * CELL
      const by = Math.min(c.y, next.y) * CELL
      if (next.x !== c.x) ctx.fillRect(bx + CELL - 1, py + 2, 2, CELL - 4)
      else ctx.fillRect(px + 2, by + CELL - 1, CELL - 4, 2)
    }
    // Stripe along the cable.
    ctx.fillStyle = C.cyan
    ctx.fillRect(px + 3, py + 3, 2, 2)
  })
  // Head: a network plug, with gold pins facing forward.
  const h = s.snake[0]
  const hx = h.x * CELL
  const hy = h.y * CELL
  ctx.fillStyle = s.over ? C.red : C.grey
  ctx.fillRect(hx, hy, CELL, CELL)
  ctx.fillStyle = C.deep
  ctx.fillRect(hx + 2, hy + 2, CELL - 4, CELL - 4)
  ctx.fillStyle = C.yellow
  const d = DELTA[s.dir]
  for (let k = 0; k < 3; k++) {
    if (d.x !== 0) ctx.fillRect(hx + (d.x > 0 ? CELL - 2 : 1), hy + 2 + k * 2, 1, 1)
    else ctx.fillRect(hx + 2 + k * 2, hy + (d.y > 0 ? CELL - 2 : 1), 1, 1)
  }
}

function drawPacket(ctx: CanvasRenderingContext2D, c: Cell, fill: string, mark: string): void {
  const px = c.x * CELL
  const py = c.y * CELL
  ctx.fillStyle = C.deep
  ctx.fillRect(px, py + 1, CELL, CELL - 2)
  ctx.fillStyle = fill
  ctx.fillRect(px + 1, py + 2, CELL - 2, CELL - 4)
  // An envelope-style fold so it reads as a "packet".
  ctx.fillStyle = mark
  ctx.fillRect(px + 2, py + 3, 1, 1)
  ctx.fillRect(px + 3, py + 4, 2, 1)
  ctx.fillRect(px + 5, py + 3, 1, 1)
}

export function drawSnakeGame(ctx: CanvasRenderingContext2D, s: SnakeState, opts: DrawOptions): void {
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = C.panel2
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) ctx.fillRect(x * CELL + 3, y * CELL + 3, 1, 1)
  drawPacket(ctx, s.food, C.lime, C.green)
  if (s.golden) {
    drawPacket(ctx, s.golden.cell, C.yellow, C.orange)
    // A slow sparkle (2 per second), and it blinks faster near the end. Never above 3 per second.
    const fast = s.golden.msLeft < 1500
    const on = opts.reducedMotion || Math.floor(opts.time / (fast ? 170 : 250)) % 2 === 0
    if (on) {
      ctx.fillStyle = C.white
      ctx.fillRect(s.golden.cell.x * CELL + 6, s.golden.cell.y * CELL, 1, 1)
    }
  }
  drawSnake(ctx, s)
}

export const packetSnake: GameDef<SnakeState> = {
  id: 'packet-snake',
  name: 'Packet Snake',
  blurb: 'Steer a network cable and gobble data packets.',
  howTo: 'Steer the cable with the arrow keys or WASD (or swipe). Eat green packets to grow. Golden ones are worth more but vanish fast. Do not hit the walls or yourself.',
  width: W,
  height: H,
  create: createSnake,
  update: updateSnake,
  draw: drawSnakeGame,
  score: (s) => s.score,
  isOver: (s) => s.over,
  events: (s) => s.events,
  hud: (s) => [
    { label: 'SCORE', value: String(s.score) },
    { label: 'LENGTH', value: String(s.snake.length) },
  ],
  touch: [
    [{ control: 'up', label: '▲', ariaLabel: 'Up' }],
    [
      { control: 'left', label: '◀', ariaLabel: 'Left' },
      { control: 'down', label: '▼', ariaLabel: 'Down' },
      { control: 'right', label: '▶', ariaLabel: 'Right' },
    ],
  ],
  swipe: true,
  tips: SNAKE_TIPS,
}
