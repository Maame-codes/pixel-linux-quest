// Shared shapes for the Break Room games. Each game keeps its logic pure:
// a state object, update(state, input, dt) and a separate draw function.

/** The buttons a game can read. Arrows and WASD map to directions. */
export type Control =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'action'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'

export type Point = { x: number; y: number }

export type GameInput = {
  /** Controls held down right now. */
  held: ReadonlySet<Control>
  /** Controls pressed since the last update. */
  pressed: ReadonlySet<Control>
  /** Taps or clicks since the last update, in canvas pixels. */
  taps: readonly Point[]
}

export const NO_INPUT: GameInput = { held: new Set(), pressed: new Set(), taps: [] }

/** Things that happened in an update, so the frame can play a beep or shake. */
export type GameEvent = 'score' | 'bonus' | 'hit' | 'bounce' | 'lose' | 'level' | 'over' | 'oops'

export type DrawOptions = {
  /** Time in ms since the game opened, for small idle animations. */
  time: number
  /** Turn off screen shake and big flashes. */
  reducedMotion: boolean
}

/** One stat shown above the game, e.g. { label: 'LIVES', value: '3' }. */
export type HudItem = { label: string; value: string }

/** An on-screen button for touch screens. */
export type TouchButton = { control: Control; label: string; ariaLabel: string }

export type GameDef<S> = {
  id: string
  name: string
  /** One line for the Break Room menu. */
  blurb: string
  /** How to play, shown before the first round. */
  howTo: string
  /** Canvas size in game pixels. It is scaled up with crisp pixels. */
  width: number
  height: number
  create: (seed: number) => S
  update: (state: S, input: GameInput, dt: number) => S
  draw: (ctx: CanvasRenderingContext2D, state: S, opts: DrawOptions) => void
  score: (state: S) => number
  isOver: (state: S) => boolean
  /** Events from the last update (for sound and shake). */
  events: (state: S) => readonly GameEvent[]
  hud: (state: S) => HudItem[]
  /** On-screen buttons for phones, in rows. */
  touch: TouchButton[][]
  /** Swipes on the canvas count as direction presses. */
  swipe?: boolean
  /** Pip's tips for the game over screen. Each must be true. */
  tips: readonly string[]
}
