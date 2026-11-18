import type { SpriteRows } from '../../game/pixelArt/canvas'
import { C } from '../../game/pixelArt/palette'
import { PIP, PIP_LEGEND } from '../../game/pixelArt/sprites'
import { drawPixelText, drawSprite } from '../draw'
import { nextRandom, randomInt } from '../random'
import { BUG_TIPS } from '../tips'
import type { Control, DrawOptions, GameDef, GameEvent, GameInput } from '../types'

// Bug Smash: bugs pop out of a 3x3 grid of folders. Smash them before they
// hide, but leave Pip alone. A round lasts 45 seconds and speeds up.

export const GRID = 3
export const HOLE_PX = 48
export const ROUND_MS = 45_000
export const BUG_POINTS = 10
export const PIP_PENALTY = 20
export const PIP_CHANCE = 0.18
/** How long the smash star stays on screen. */
export const SPLAT_MS = 250

export type HoleKind = 'empty' | 'bug' | 'pip'

export type Hole = {
  kind: HoleKind
  /** Time since it popped up. */
  age: number
  /** How long it stays up before hiding. */
  life: number
  /** A smash just happened here: what was hit, and for how much longer to show it. */
  splat: { what: 'bug' | 'pip'; msLeft: number } | null
}

export type BugState = {
  holes: Hole[]
  timeLeft: number
  score: number
  smashed: number
  spawnAcc: number
  seed: number
  over: boolean
  events: GameEvent[]
}

const EMPTY: Hole = { kind: 'empty', age: 0, life: 0, splat: null }

/** 0 at the start of the round, 1 at the end. */
export function roundProgress(s: Pick<BugState, 'timeLeft'>): number {
  return Math.min(1, Math.max(0, 1 - s.timeLeft / ROUND_MS))
}

/** Time between pop-ups: 900ms at the start, 420ms at the end. */
export function spawnEvery(s: Pick<BugState, 'timeLeft'>): number {
  return 900 - 480 * roundProgress(s)
}

/** How long something stays up: 1400ms at the start, 650ms at the end. */
export function upTime(s: Pick<BugState, 'timeLeft'>): number {
  return 1400 - 750 * roundProgress(s)
}

export function createBugs(seed: number): BugState {
  return {
    holes: Array.from({ length: GRID * GRID }, () => ({ ...EMPTY })),
    timeLeft: ROUND_MS,
    score: 0,
    smashed: 0,
    spawnAcc: 600,
    seed,
    over: false,
    events: [],
  }
}

/** Which hole a tap lands on (row by row, 0 to 8), or null if outside. */
export function holeAt(x: number, y: number): number | null {
  const col = Math.floor(x / HOLE_PX)
  const row = Math.floor(y / HOLE_PX)
  if (col < 0 || row < 0 || col >= GRID || row >= GRID) return null
  return row * GRID + col
}

const KEY_HOLES: readonly Control[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/** Smash hole i. */
export function smash(s: BugState, i: number): BugState {
  const hole = s.holes[i]
  if (!hole || hole.kind === 'empty') return s
  const holes = [...s.holes]
  holes[i] = { ...EMPTY, splat: { what: hole.kind, msLeft: SPLAT_MS } }
  if (hole.kind === 'bug') {
    return { ...s, holes, score: s.score + BUG_POINTS, smashed: s.smashed + 1, events: [...s.events, 'score'] }
  }
  return { ...s, holes, score: Math.max(0, s.score - PIP_PENALTY), events: [...s.events, 'oops'] }
}

/** Pop a bug (or sometimes Pip) out of a random empty folder. */
export function spawn(s: BugState): BugState {
  const free = s.holes.map((h, i) => (h.kind === 'empty' && !h.splat ? i : -1)).filter((i) => i >= 0)
  if (free.length === 0) return s
  const [pick, seedA] = randomInt(s.seed, free.length)
  const [roll, seedB] = nextRandom(seedA)
  const holes = [...s.holes]
  holes[free[pick]] = { kind: roll < PIP_CHANCE ? 'pip' : 'bug', age: 0, life: upTime(s), splat: null }
  return { ...s, holes, seed: seedB }
}

export function updateBugs(state: BugState, input: GameInput, dt: number): BugState {
  if (state.over) return state.events.length ? { ...state, events: [] } : state
  let s: BugState = { ...state, events: [] }

  // Smashes first, so a hit on the last frame of a pop-up still counts.
  for (const key of KEY_HOLES) if (input.pressed.has(key)) s = smash(s, Number(key) - 1)
  for (const tap of input.taps) {
    const i = holeAt(tap.x, tap.y)
    if (i !== null) s = smash(s, i)
  }

  // Age everything; bugs and Pip that were not hit hide again.
  s = {
    ...s,
    holes: s.holes.map((h) => {
      const splat = h.splat && h.splat.msLeft - dt > 0 ? { ...h.splat, msLeft: h.splat.msLeft - dt } : null
      if (h.kind === 'empty') return { ...h, splat }
      const age = h.age + dt
      return age >= h.life ? { ...EMPTY } : { ...h, age, splat }
    }),
  }

  s = { ...s, spawnAcc: s.spawnAcc + dt }
  if (s.spawnAcc >= spawnEvery(s)) s = spawn({ ...s, spawnAcc: 0 })

  const timeLeft = Math.max(0, s.timeLeft - dt)
  if (timeLeft === 0) return { ...s, timeLeft, over: true, events: [...s.events, 'over'] }
  return { ...s, timeLeft }
}

// ---- Drawing -------------------------------------------------------------

const BUG: SpriteRows = [
  '..K....K..',
  '...K..K...',
  '..KKKKKK..',
  '.KRRKKRRK.',
  'KKRWRRWRKK',
  '.KRRRRRRK.',
  'KKRRKKRRKK',
  '.KRRRRRRK.',
  'K.KRRRRK.K',
  '...KKKK...',
]
const BUG_LEGEND = { K: C.deep, R: C.red, W: C.white }

const STAR: SpriteRows = ['...Y...', 'Y..Y..Y', '.Y.Y.Y.', '..YWY..', 'YYWWWYY', '..YWY..', '.Y.Y.Y.', 'Y..Y..Y', '...Y...']

function drawFolderBack(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = C.deep
  ctx.fillRect(x + 6, y + 18, 36, 24)
  ctx.fillStyle = C.orange
  ctx.fillRect(x + 7, y + 19, 12, 4)
  ctx.fillStyle = C.orangeShade
  ctx.fillRect(x + 7, y + 22, 34, 19)
}

function drawFolderFront(ctx: CanvasRenderingContext2D, x: number, y: number, n: number): void {
  ctx.fillStyle = C.deep
  ctx.fillRect(x + 4, y + 27, 40, 17)
  ctx.fillStyle = C.yellow
  ctx.fillRect(x + 5, y + 28, 38, 15)
  ctx.fillStyle = C.white
  ctx.fillRect(x + 5, y + 28, 38, 1)
  drawPixelText(ctx, x + 22, y + 33, String(n), C.deep)
}

export function drawBugGame(ctx: CanvasRenderingContext2D, s: BugState, opts: DrawOptions): void {
  ctx.fillStyle = C.panel2
  ctx.fillRect(0, 0, GRID * HOLE_PX, GRID * HOLE_PX)
  s.holes.forEach((h, i) => {
    const x = (i % GRID) * HOLE_PX
    const y = Math.floor(i / GRID) * HOLE_PX
    ctx.fillStyle = (i + Math.floor(i / GRID)) % 2 === 0 ? C.panel2 : C.uniLine
    ctx.fillRect(x, y, HOLE_PX, HOLE_PX)
    drawFolderBack(ctx, x, y)

    if (h.kind !== 'empty') {
      // Rise out of the folder, then sink back near the end. Instant with reduced motion.
      const rise = opts.reducedMotion ? 1 : Math.min(1, h.age / 120, (h.life - h.age) / 120)
      const top = y + 28 - Math.round(18 * Math.max(0, rise))
      if (h.kind === 'bug') drawSprite(ctx, x + 19, top, BUG, BUG_LEGEND)
      else drawSprite(ctx, x + 16, top - 5, PIP, PIP_LEGEND)
    }
    drawFolderFront(ctx, x, y, i + 1)

    if (h.splat) {
      if (h.splat.what === 'bug') drawSprite(ctx, x + 20, y + 8, STAR, { Y: C.yellow, W: C.white })
      else {
        drawPixelText(ctx, x + 22, y + 6, '!', C.orange)
        drawPixelText(ctx, x + 12, y + 14, '-20', C.orange)
      }
    }
  })
}

export const bugSmash: GameDef<BugState> = {
  id: 'bug-smash',
  name: 'Bug Smash',
  blurb: 'Smash the bugs popping out of folders. Not Pip!',
  howTo: 'Bugs pop out of the folders. Click or tap them, or press 1 to 9, before they hide. Leave Pip alone: smashing Pip loses points. You have 45 seconds.',
  width: GRID * HOLE_PX,
  height: GRID * HOLE_PX,
  create: createBugs,
  update: updateBugs,
  draw: drawBugGame,
  score: (s) => s.score,
  isOver: (s) => s.over,
  events: (s) => s.events,
  hud: (s) => [
    { label: 'SCORE', value: String(s.score) },
    { label: 'TIME', value: String(Math.ceil(s.timeLeft / 1000)) },
  ],
  touch: [],
  tips: BUG_TIPS,
}
