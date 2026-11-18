import type { PixelCanvas, SpriteRows } from '../canvas'
import { C } from '../palette'
import { type PixelScene, SceneBuilder, SCENE_H as H, SCENE_W as W } from '../scene'
import { PIP, PIP_LEGEND } from '../sprites'

// The Break Room: a little arcade with one glowing cabinet per game, a snack
// machine, a plant, and Pip relaxing on a beanbag.

export type CabinetSpot = { x: number; y: number; w: number; h: number }

const CAB_W = 20
const CAB_Y = 10
const CAB_H = 42

/** Where each cabinet stands, left to right (for click areas over the art). */
export const CABINETS: readonly CabinetSpot[] = [6, 30, 54].map((x) => ({ x, y: CAB_Y, w: CAB_W, h: CAB_H }))

type CabinetLook = { body: string; shade: string; marquee: string }

const LOOKS: readonly CabinetLook[] = [
  { body: C.sky, shade: C.blue, marquee: C.lime },
  { body: C.orange, shade: C.orangeShade, marquee: C.yellow },
  { body: C.green, shade: C.teal, marquee: C.cyan },
]

/** Arcade cabinet: marquee, screen at (x+3, y+9) 14x11, control deck below. */
function cabinet(cv: PixelCanvas, spot: CabinetSpot, look: CabinetLook): void {
  const { x, y, w, h } = spot
  cv.rect(x, y, w, h, C.deep)
  cv.rect(x + 1, y + 1, w - 2, h - 1, look.body)
  cv.rect(x + w - 3, y + 1, 2, h - 1, look.shade)
  // Marquee.
  cv.rect(x + 2, y + 2, w - 4, 5, C.deep).rect(x + 3, y + 3, w - 6, 3, look.marquee)
  // Screen bezel.
  cv.rect(x + 2, y + 8, w - 4, 13, C.deep)
  // Control deck sticking out, joystick and buttons.
  cv.rect(x - 1, y + 23, w + 2, 4, C.deep).rect(x, y + 23, w, 3, look.shade)
  cv.rect(x + 4, y + 20, 1, 3, C.deep).rect(x + 3, y + 19, 3, 2, C.red)
  cv.pix(x + 11, y + 24, C.yellow).pix(x + 14, y + 24, C.cyan)
  // Coin door.
  cv.rect(x + 7, y + 31, 6, 7, C.deep).rect(x + 8, y + 32, 4, 5, look.shade).pix(x + 10, y + 34, C.yellow)
}

const SNAKE_ART: SpriteRows = ['..........', '.LLLLL....', '.L...L....', '.L...LLLH.', '.L.......P', '.LLL......']
const BUG_ART: SpriteRows = ['..YYY.....', '.YYYYYYYY.', '.YY.RR.YY.', '.YYRRRRYY.', '.YY.RR.YY.', '.YYYYYYYY.']
const BRICK_ART: SpriteRows = ['OOO.SSS.LL', 'OOO.SSS.LL', 'YY.OOO.SSS', 'YY.OOO.SSS', '..........', '....WWW..B']

function screens(s: SceneBuilder): void {
  const on = s.layer('screens', 'slow')
  const off = s.layer('screensAlt', 'blinkLate')
  const arts = [SNAKE_ART, BUG_ART, BRICK_ART]
  const legend = { L: C.lime, H: C.cyan, P: C.yellow, Y: C.yellow, R: C.red, O: C.orange, S: C.sky, W: C.white, B: C.white }
  CABINETS.forEach((spot, i) => {
    const sx = spot.x + 3
    const sy = spot.y + 9
    s.base.rect(sx, sy, 14, 11, C.bg)
    on.rect(sx, sy, 14, 11, C.panel2).sprite(sx + 2, sy + 3, arts[i], legend)
    off.rect(sx, sy, 14, 11, C.blue).sprite(sx + 2, sy + 2, arts[i], legend)
    // A soft glow on the floor in front of each cabinet.
    s.base.rect(spot.x + 2, 52, spot.w - 4, 1, C.glow2)
  })
}

export function sceneBreakRoom(): PixelScene {
  const s = new SceneBuilder()
  const cv = s.base

  // Wall with a neon stripe, and a checked floor.
  cv.rect(0, 0, W, 52, C.purpleShade)
  cv.rect(0, 4, W, 1, C.purple)
  for (let x = 0; x < W; x += 12) cv.rect(x, 5, 1, 47, C.nightWoodDark)
  for (let ty = 0, y = 52; y < H; ty++, y += 5) {
    for (let tx = 0, x = 0; x < W; tx++, x += 8) cv.rect(x, y, 8, 5, (tx + ty) % 2 === 0 ? C.panel : C.panel2)
  }
  cv.rect(0, 52, W, 1, C.slate)

  // A neon sign: a little joystick shape.
  const sign = s.layer('sign', 'blink')
  cv.rect(84, 7, 14, 1, C.purple)
  sign.rect(87, 8, 8, 1, C.cyan).rect(90, 9, 2, 3, C.cyan).rect(88, 12, 6, 2, C.cyan).pix(90, 7, C.red).pix(91, 7, C.red)

  LOOKS.forEach((look, i) => cabinet(cv, CABINETS[i], look))
  screens(s)

  // Snack machine.
  cv.rect(78, 16, 18, 36, C.deep).rect(79, 17, 16, 35, C.slate).rect(93, 17, 2, 35, C.panel)
  cv.rect(80, 18, 11, 24, C.deep).rect(81, 19, 9, 22, C.glow2)
  const snacks = [C.red, C.yellow, C.lime, C.orange, C.cyan, C.white]
  for (let row = 0; row < 4; row++) {
    cv.rect(81, 23 + row * 5, 9, 1, C.grey)
    for (let k = 0; k < 3; k++) cv.rect(82 + k * 3, 20 + row * 5, 2, 3, snacks[(row * 2 + k) % snacks.length])
  }
  cv.rect(92, 22, 2, 1, C.lime).rect(92, 25, 2, 6, C.panel2).rect(81, 44, 9, 4, C.deep)

  // Plant in a pot.
  cv.rect(100, 44, 8, 8, C.deep).rect(101, 45, 6, 6, C.orange).rect(101, 45, 6, 1, C.orangeShade)
  const leaf = { G: C.green, L: C.lime }
  cv.sprite(98, 30, ['...G..G.', '..GG.GG.', 'G.GLGG..', 'GGGLG..G', '.GGLGGGG', '..GLGG..', '...GL...', '..GGG...', '...G....', '...G....', '..GLG...', '...G....', '...G....', '...G....'], leaf)

  // Pip relaxing on a beanbag, eyes closing now and then, with floating z's.
  cv.sprite(108, 42, ['....RRRRRRR....', '..RRRRRRRRRRR..', '.RRRRRRRRRRRRRR', 'RRRRRRRRRRRRRRR', 'RRRRDRRRRRRRRRR', 'RRRDDRRRRRRRDDR', '.RRRRRRRRRRRRR.', '..DDDDDDDDDDD..', '...............', '...............'], { R: C.red, D: C.purple })
  cv.sprite(108, 31, PIP, PIP_LEGEND)
  // Eyes shut (a sleepy blink): cover the white eye pixels with a closed line.
  s.layer('eyes', 'slow').rect(113, 34, 2, 3, C.deep).rect(117, 34, 2, 3, C.deep).rect(113, 35, 2, 1, C.grey).rect(117, 35, 2, 1, C.grey)
  // A tiny milk carton beside the beanbag.
  cv.rect(123, 46, 4, 6, C.deep).rect(124, 47, 2, 4, C.white).pix(124, 48, C.sky)
  const z: SpriteRows = ['###', '..#', '.#.', '#..', '###']
  const zz = [s.layer('z0', 'frame0'), s.layer('z1', 'frame1'), s.layer('z2', 'frame2')]
  zz.forEach((layer, i) => layer.sprite(120 + i, 27 - i * 5, z, { '#': C.white }))

  return s.build(
    'The Break Room: three glowing arcade cabinets, a snack machine, a plant, and Pip dozing on a red beanbag.',
  )
}

/** Room scenes keyed by id, drawn with the same renderer as the intro. */
export const ROOM_SCENES: Readonly<Record<string, () => PixelScene>> = {
  'break-room': sceneBreakRoom,
}
