import { C } from '../../game/pixelArt/palette'
import { drawPixelText, pixelTextWidth } from '../draw'
import { nextRandom } from '../random'
import { BRICK_TIPS } from '../tips'
import type { DrawOptions, GameDef, GameEvent, GameInput } from '../types'

// Bit Breaker: bounce a ball off a paddle to clear out rows of old files.
// Three lives. CORE files (and later .BAK files) take two hits. A rare
// power-up widens the paddle for a while.

export const WIDTH = 160
export const HEIGHT = 180
export const BALL_R = 1.5
export const PADDLE_Y = 168
export const PADDLE_H = 4
export const PADDLE_W = 28
export const WIDE_W = 44
export const WIDE_MS = 10_000
export const PADDLE_SPEED = 0.16
export const BALL_SPEED = 0.11
export const POWER_CHANCE = 0.06
export const POWER_FALL = 0.05
export const LIVES = 3

const COLS = 5
const BRICK_W = 30
const BRICK_H = 9
const GAP = 2
const TOP = 18

export type Brick = { x: number; y: number; w: number; h: number; hp: number; maxHp: number; label: string }
export type Ball = { x: number; y: number; vx: number; vy: number }

export type BrickState = {
  /** Centre of the paddle. */
  paddleX: number
  wideMs: number
  ball: Ball
  /** The ball sits on the paddle until launched. */
  stuck: boolean
  bricks: Brick[]
  power: { x: number; y: number } | null
  lives: number
  level: number
  score: number
  seed: number
  over: boolean
  events: GameEvent[]
}

const ROWS: readonly { label: string; hpFrom: number }[] = [
  // hpFrom: the level from which this row takes two hits.
  { label: 'CORE', hpFrom: 1 },
  { label: '.BAK', hpFrom: 2 },
  { label: '.TMP', hpFrom: 4 },
  { label: '.LOG', hpFrom: 99 },
  { label: '.LOG', hpFrom: 99 },
]

/** The bricks for a level: 4 rows on level 1, 5 after that. */
export function layout(level: number): Brick[] {
  const rows = level === 1 ? 4 : 5
  const out: Brick[] = []
  for (let r = 0; r < rows; r++) {
    const { label, hpFrom } = ROWS[r]
    const hp = level >= hpFrom ? 2 : 1
    for (let c = 0; c < COLS; c++) {
      out.push({ x: 1 + c * (BRICK_W + GAP), y: TOP + r * (BRICK_H + GAP), w: BRICK_W, h: BRICK_H, hp, maxHp: hp, label })
    }
  }
  return out
}

export function ballSpeed(level: number): number {
  return BALL_SPEED * Math.min(1.5, 1 + 0.1 * (level - 1))
}

export function paddleWidth(s: Pick<BrickState, 'wideMs'>): number {
  return s.wideMs > 0 ? WIDE_W : PADDLE_W
}

function restingBall(paddleX: number): Ball {
  return { x: paddleX, y: PADDLE_Y - BALL_R - 0.5, vx: 0, vy: 0 }
}

export function createBricks(seed: number): BrickState {
  const paddleX = WIDTH / 2
  return {
    paddleX,
    wideMs: 0,
    ball: restingBall(paddleX),
    stuck: true,
    bricks: layout(1),
    power: null,
    lives: LIVES,
    level: 1,
    score: 0,
    seed,
    over: false,
    events: [],
  }
}

function clampPaddle(x: number, w: number): number {
  return Math.min(WIDTH - w / 2, Math.max(w / 2, x))
}

/** Launch the ball from the paddle, a little to the left or right. */
export function launch(s: BrickState): BrickState {
  const [r, seed] = nextRandom(s.seed)
  const speed = ballSpeed(s.level)
  const vx = speed * (r < 0.5 ? -0.45 : 0.45)
  return { ...s, seed, stuck: false, ball: { ...s.ball, vx, vy: -Math.sqrt(speed * speed - vx * vx) } }
}

/** Does the ball's box overlap this rectangle? */
function touches(b: Ball, x: number, y: number, w: number, h: number): boolean {
  return b.x + BALL_R > x && b.x - BALL_R < x + w && b.y + BALL_R > y && b.y - BALL_R < y + h
}

/** Move the ball a short time h, bouncing off walls, the paddle and bricks. */
export function moveBall(s: BrickState, h: number): BrickState {
  let ball = { ...s.ball, x: s.ball.x + s.ball.vx * h, y: s.ball.y + s.ball.vy * h }
  const events = [...s.events]
  let { bricks, score, power, seed } = s

  // Walls.
  if (ball.x < BALL_R) ball = { ...ball, x: BALL_R, vx: Math.abs(ball.vx) }
  if (ball.x > WIDTH - BALL_R) ball = { ...ball, x: WIDTH - BALL_R, vx: -Math.abs(ball.vx) }
  if (ball.y < BALL_R) ball = { ...ball, y: BALL_R, vy: Math.abs(ball.vy) }

  // Paddle: where it hits sets the angle, like a real paddle game.
  const w = paddleWidth(s)
  if (ball.vy > 0 && touches(ball, s.paddleX - w / 2, PADDLE_Y, w, PADDLE_H)) {
    const speed = Math.hypot(ball.vx, ball.vy)
    const offset = Math.max(-1, Math.min(1, (ball.x - s.paddleX) / (w / 2)))
    const vx = speed * offset * 0.75
    ball = { ...ball, y: PADDLE_Y - BALL_R, vx, vy: -Math.sqrt(speed * speed - vx * vx) }
    events.push('bounce')
  }

  // Bricks: bounce off the side the ball went in deepest on.
  const hitIndex = bricks.findIndex((b) => touches(ball, b.x, b.y, b.w, b.h))
  if (hitIndex >= 0) {
    const b = bricks[hitIndex]
    const overlapX = Math.min(b.x + b.w - (ball.x - BALL_R), ball.x + BALL_R - b.x)
    const overlapY = Math.min(b.y + b.h - (ball.y - BALL_R), ball.y + BALL_R - b.y)
    ball = overlapX < overlapY ? { ...ball, vx: -ball.vx } : { ...ball, vy: -ball.vy }
    if (b.hp > 1) {
      bricks = bricks.map((x, i) => (i === hitIndex ? { ...x, hp: x.hp - 1 } : x))
      events.push('hit')
    } else {
      bricks = bricks.filter((_, i) => i !== hitIndex)
      score += 10 * b.maxHp
      events.push('score')
      const [roll, next] = nextRandom(seed)
      seed = next
      if (!power && s.wideMs <= 0 && roll < POWER_CHANCE) power = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
    }
  }
  return { ...s, ball, bricks, score, power, seed, events }
}

export function updateBricks(state: BrickState, input: GameInput, dt: number): BrickState {
  if (state.over) return state.events.length ? { ...state, events: [] } : state
  let s: BrickState = { ...state, events: [], wideMs: Math.max(0, state.wideMs - dt) }

  // Paddle: arrow keys or buttons slide it; a tap moves it to that spot.
  let dx = 0
  if (input.held.has('left')) dx -= PADDLE_SPEED * dt
  if (input.held.has('right')) dx += PADDLE_SPEED * dt
  let paddleX = s.paddleX + dx
  const lastTap = input.taps[input.taps.length - 1]
  if (lastTap) paddleX = lastTap.x
  s = { ...s, paddleX: clampPaddle(paddleX, paddleWidth(s)) }

  if (s.stuck) {
    s = { ...s, ball: restingBall(s.paddleX) }
    if (input.pressed.has('action') || input.pressed.has('up') || lastTap) s = launch(s)
    return s
  }

  // Small steps so the ball never skips through a brick.
  let left = dt
  while (left > 0 && !s.stuck) {
    const h = Math.min(4, left)
    left -= h
    s = moveBall(s, h)

    if (s.ball.y - BALL_R > HEIGHT) {
      const lives = s.lives - 1
      if (lives <= 0) return { ...s, lives: 0, over: true, events: [...s.events, 'over'] }
      s = { ...s, lives, stuck: true, wideMs: 0, power: null, ball: restingBall(s.paddleX), events: [...s.events, 'lose'] }
    }
    if (s.bricks.length === 0) {
      const level = s.level + 1
      s = { ...s, level, bricks: layout(level), stuck: true, power: null, ball: restingBall(s.paddleX), events: [...s.events, 'level'] }
    }
  }

  // The power-up drops; catch it with the paddle.
  if (s.power) {
    const y = s.power.y + POWER_FALL * dt
    const w = paddleWidth(s)
    const caught = y + 3 >= PADDLE_Y && y - 3 <= PADDLE_Y + PADDLE_H && Math.abs(s.power.x - s.paddleX) <= w / 2 + 3
    if (caught) s = { ...s, power: null, wideMs: WIDE_MS, score: s.score + 25, events: [...s.events, 'bonus'] }
    else s = { ...s, power: y > HEIGHT ? null : { ...s.power, y } }
  }
  return s
}

// ---- Drawing -------------------------------------------------------------

const BRICK_COLOURS: Record<string, { fill: string; shade: string }> = {
  CORE: { fill: C.red, shade: C.purple },
  '.BAK': { fill: C.orange, shade: C.orangeShade },
  '.TMP': { fill: C.yellow, shade: C.beigeDark },
  '.LOG': { fill: C.lime, shade: C.green },
}

export function drawBrickGame(ctx: CanvasRenderingContext2D, s: BrickState, opts: DrawOptions): void {
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.fillStyle = C.night
  for (let y = 0; y < HEIGHT; y += 10) ctx.fillRect(0, y, WIDTH, 1)

  for (const b of s.bricks) {
    const col = BRICK_COLOURS[b.label] ?? BRICK_COLOURS['.LOG']
    ctx.fillStyle = C.deep
    ctx.fillRect(b.x, b.y, b.w, b.h)
    ctx.fillStyle = b.hp < b.maxHp ? col.shade : col.fill
    ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2)
    ctx.fillStyle = C.white
    if (b.hp === b.maxHp) ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, 1)
    drawPixelText(ctx, b.x + Math.floor((b.w - pixelTextWidth(b.label)) / 2), b.y + 2, b.label, C.deep)
    if (b.hp < b.maxHp) {
      // A crack shows the second hit is needed.
      ctx.fillStyle = C.deep
      ctx.fillRect(b.x + 4, b.y + 2, 1, 2)
      ctx.fillRect(b.x + 5, b.y + 4, 1, 2)
    }
  }

  if (s.power) {
    ctx.fillStyle = C.deep
    ctx.fillRect(Math.round(s.power.x) - 4, Math.round(s.power.y) - 3, 9, 7)
    ctx.fillStyle = C.cyan
    ctx.fillRect(Math.round(s.power.x) - 3, Math.round(s.power.y) - 2, 7, 5)
    drawPixelText(ctx, Math.round(s.power.x) - 1, Math.round(s.power.y) - 2, 'X', C.deep)
  }

  const w = paddleWidth(s)
  const px = Math.round(s.paddleX - w / 2)
  ctx.fillStyle = C.deep
  ctx.fillRect(px - 1, PADDLE_Y - 1, w + 2, PADDLE_H + 2)
  // The paddle glows cyan while it is wide; it fades back near the end (slowly, no flashing).
  ctx.fillStyle = s.wideMs > 0 ? C.cyan : C.grey
  ctx.fillRect(px, PADDLE_Y, w, PADDLE_H)
  ctx.fillStyle = C.white
  ctx.fillRect(px, PADDLE_Y, w, 1)
  if (s.wideMs > 0 && s.wideMs < 2000 && !opts.reducedMotion) {
    ctx.fillStyle = C.grey
    ctx.fillRect(px, PADDLE_Y + 1, Math.round(w * (1 - s.wideMs / 2000)), PADDLE_H - 1)
  }

  ctx.fillStyle = C.white
  ctx.fillRect(Math.round(s.ball.x - BALL_R), Math.round(s.ball.y - BALL_R), 3, 3)
}

export const bitBreaker: GameDef<BrickState> = {
  id: 'bit-breaker',
  name: 'Bit Breaker',
  blurb: 'Bounce a ball to clear out old files.',
  howTo: 'Move the paddle with the arrow keys or A and D, or tap where it should go. Press Space (or tap) to launch. Clear every file to reach the next level. CORE files take two hits. Catch the blue X for a wide paddle. You have three lives.',
  width: WIDTH,
  height: HEIGHT,
  create: createBricks,
  update: updateBricks,
  draw: drawBrickGame,
  score: (s) => s.score,
  isOver: (s) => s.over,
  events: (s) => s.events,
  hud: (s) => [
    { label: 'SCORE', value: String(s.score) },
    { label: 'LIVES', value: String(s.lives) },
    { label: 'LEVEL', value: String(s.level) },
  ],
  touch: [
    [
      { control: 'left', label: '◀', ariaLabel: 'Move left' },
      { control: 'action', label: 'GO', ariaLabel: 'Launch the ball' },
      { control: 'right', label: '▶', ariaLabel: 'Move right' },
    ],
  ],
  tips: BRICK_TIPS,
}
