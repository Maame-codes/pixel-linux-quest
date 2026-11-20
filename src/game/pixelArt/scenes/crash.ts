import type { PixelCanvas, SpriteRows } from '../canvas'
import { drawText } from '../font'
import { C } from '../palette'
import { type PixelScene, SceneBuilder, SCENE_H as H, SCENE_W as W } from '../scene'

// The Break It sandbox's crash screens: SYSTEM DESTROYED (rm -rf) and
// SYSTEM FROZEN (fork bomb). Same 128x72 pixel method as the intro scenes.

const FOLDER: SpriteRows = ['KKK......', 'KTTK.....', 'KFFFFFFFK', 'KFFFFFFFK', 'KFFFFFFFK', 'KFFFFFFFK', 'KKKKKKKKK']
const FOLDER_TIPPED: SpriteRows = ['.KKKKK.', 'KFFFFFK', 'KFFFFFK', 'KFFFFFK', 'KFFFFFK', 'KFFFFTK', 'KFFFFTK', 'KFFFFKK', '.KKKKK.']
const PAGE: SpriteRows = ['KKKKK.', 'KWWWKK', 'KWSSWK', 'KWWWWK', 'KWSSWK', 'KKKKKK']
const SMOKE: SpriteRows = ['.##.', '####', '####', '.##.']
const ICICLE: SpriteRows = ['###', '###', '.#.', '.#.']

const BLUE_FOLDER = { K: C.deep, T: C.blue, F: C.sky }
const YELLOW_FOLDER = { K: C.deep, T: C.orange, F: C.yellow }
const PAPER = { K: C.deep, W: C.white, S: C.grey }

/** A big old monitor on a desk. The screen inside is at (x+4, y+3), 36x22. */
function monitor(cv: PixelCanvas, x: number, y: number, screen: string): void {
  cv.rect(x, y, 44, 30, C.deep)
  cv.rect(x + 1, y + 1, 42, 28, C.beige)
  cv.rect(x + 41, y + 1, 2, 28, C.beigeDark).rect(x + 1, y + 27, 42, 2, C.beigeDark)
  cv.rect(x + 3, y + 2, 38, 24, C.deep)
  cv.rect(x + 4, y + 3, 36, 22, screen)
  cv.rect(x + 16, y + 30, 12, 2, C.deep).rect(x + 12, y + 32, 20, 2, C.deep)
  cv.pix(x + 37, y + 28, C.lime)
}

/** Desk top at y 44, legs down to the floor at y 56. */
function desk(cv: PixelCanvas, top: string, shade: string): void {
  cv.rect(8, 44, 72, 3, top).rect(8, 47, 72, 1, shade)
  cv.rect(11, 48, 3, 8, shade).rect(74, 48, 3, 8, shade)
}

const CRACK: readonly (readonly [number, number])[] = [
  [49, 13], [48, 14], [48, 15], [47, 16], [46, 17], [47, 18], [48, 19], [49, 20], [50, 21],
  [49, 22], [51, 22], [52, 23], [50, 24], [53, 24], [54, 25], [45, 18], [44, 19],
]

export function sceneDestroyed(): PixelScene {
  const s = new SceneBuilder()
  const cv = s.base

  // Dark room with an alarm-red glow near the floor.
  cv.rect(0, 0, W, H, C.bg)
  for (let y = 0; y < 56; y += 6) cv.rect(0, y, W, 1, C.wallLine)
  cv.rect(0, 50, W, 6, C.purpleShade)
  cv.rect(0, 56, W, H - 56, C.panel).rect(0, 56, W, 1, C.slate)
  for (let x = 4; x < W; x += 16) cv.rect(x, 60, 8, 1, C.wallLine).rect(x + 8, 66, 8, 1, C.wallLine)

  desk(cv, C.wood, C.woodDark)
  monitor(cv, 22, 10, C.deep)

  // Broken screen: glitch bars, an error, and a crack.
  const bars: readonly (readonly [number, number, number, string])[] = [
    [26, 14, 20, C.red],
    [40, 16, 22, C.purple],
    [26, 30, 14, C.red],
    [46, 33, 16, C.orange],
    [50, 26, 12, C.purple],
  ]
  for (const [gx, gy, gw, col] of bars) cv.rect(gx, gy, gw, 1, col)
  drawText(cv, 29, 21, 'ERR0R', C.red)
  for (const [cx, cy] of CRACK) cv.pix(cx, cy, C.white)

  // Smoke drifting up from the case, in three frames.
  const smoke = [s.layer('smoke0', 'frame0'), s.layer('smoke1', 'frame1'), s.layer('smoke2', 'frame2')]
  smoke.forEach((layer, i) => {
    layer.sprite(52 - i, 6 - i * 2, SMOKE, { '#': C.slate })
    layer.sprite(58 + i, 3 - i, SMOKE, { '#': C.grey })
    layer.sprite(46 + i * 2, 1 + (i % 2), SMOKE, { '#': C.slate })
  })
  // Sparks along the crack.
  s.layer('sparkA', 'blink').pix(47, 15, C.yellow).pix(51, 21, C.yellow).pix(50, 12, C.yellow)
  s.layer('sparkB', 'blinkLate').pix(45, 17, C.yellow).pix(53, 25, C.orange).pix(48, 11, C.orange)

  // Folders and files spilled on the floor, one still falling.
  cv.sprite(6, 61, FOLDER, BLUE_FOLDER).sprite(20, 62, FOLDER_TIPPED, YELLOW_FOLDER)
  cv.sprite(34, 62, PAGE, PAPER).sprite(44, 63, FOLDER, YELLOW_FOLDER).sprite(58, 60, PAGE, PAPER)
  cv.sprite(68, 62, FOLDER_TIPPED, BLUE_FOLDER).sprite(112, 63, FOLDER, BLUE_FOLDER).sprite(2, 50, PAGE, PAPER)
  const fall = [s.layer('fall0', 'frame0'), s.layer('fall1', 'frame1'), s.layer('fall2', 'frame2')]
  fall[0].sprite(84, 30, FOLDER, YELLOW_FOLDER)
  fall[1].sprite(85, 38, FOLDER_TIPPED, YELLOW_FOLDER)
  fall[2].sprite(86, 48, FOLDER, YELLOW_FOLDER)

  // Pip panicking: a big "!" and flying sweat drops.
  s.pip(100, 41)
  cv.rect(107, 28, 2, 7, C.yellow).rect(107, 36, 2, 2, C.yellow)
  s.layer('sweatA', 'blink').pix(98, 42, C.cyan).pix(97, 41, C.cyan).pix(117, 43, C.cyan)
  s.layer('sweatB', 'blinkLate').pix(96, 39, C.cyan).pix(118, 40, C.cyan).pix(119, 39, C.cyan)

  return s.build(
    'A wrecked computer: the screen is cracked and smoking, folders lie spilled across the floor, and Pip panics.',
  )
}

export function sceneFrozen(): PixelScene {
  const s = new SceneBuilder()
  const cv = s.base

  // Icy blue room with a snowy floor.
  cv.rect(0, 0, W, H, C.panel2)
  for (let y = 0; y < 56; y += 6) cv.rect(0, y, W, 1, C.uniLine)
  cv.rect(0, 56, W, H - 56, C.soft).rect(0, 56, W, 1, C.white)
  for (let x = 3; x < W; x += 11) cv.pix(x, 60 + (x % 7), C.grey).pix(x + 5, 64 + (x % 5), C.white)

  desk(cv, C.grey, C.slate)
  monitor(cv, 22, 10, C.blue)

  // The screen is full of the fork bomb's ":" copies, frozen in place.
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 16; col++) {
      drawText(cv, 27 + col * 2, 14 + row * 6, ':', row === 1 ? C.white : C.cyan)
    }
  }
  // Frost on the corners of the case.
  const frost: readonly (readonly [number, number])[] = [
    [23, 11], [24, 11], [23, 12], [65, 11], [64, 11], [65, 12], [23, 37], [65, 37], [64, 38],
  ]
  for (const [fx, fy] of frost) cv.pix(fx, fy, C.white)

  // Icicles under the monitor and the desk.
  for (const ix of [26, 34, 41, 55, 61]) cv.sprite(ix, 40, ICICLE, { '#': C.cyan })
  for (const ix of [16, 30, 47, 63]) cv.sprite(ix, 48, ICICLE, { '#': C.white })

  // Pip shivering inside a block of ice.
  cv.rect(94, 34, 26, 22, C.cyan).rect(95, 35, 24, 20, C.sky)
  s.pip(99, 39)
  s.layer('ice', 'slow').pix(96, 36, C.white).pix(97, 37, C.white).pix(98, 38, C.white).pix(116, 50, C.white).pix(117, 51, C.white)

  // Snow falling, three frames.
  const snow = [s.layer('snow0', 'frame0'), s.layer('snow1', 'frame1'), s.layer('snow2', 'frame2')]
  snow.forEach((layer, i) => {
    for (let k = 0; k < 14; k++) layer.pix((k * 37 + i * 3) % W, (k * 13 + i * 6) % 50, C.white)
  })

  return s.build(
    'A frozen computer: its screen is stuck full of colons, icicles hang from the desk, and Pip shivers inside a block of ice.',
  )
}

const EMPTY_FOLDER: SpriteRows = [
  'KKKKK.........',
  'KTTTTK........',
  'KFFFFFFFFFFFFK',
  'KF..........FK',
  'KF..........FK',
  'KF..........FK',
  'KF..........FK',
  'KFFFFFFFFFFFFK',
  'KKKKKKKKKKKKKK',
]
const CHECK: readonly (readonly [number, number])[] = [
  [34, 19], [35, 20], [36, 21], [37, 22], [38, 21], [39, 20], [40, 19], [41, 18], [42, 17], [43, 16], [44, 15],
]

/** rm -rf / without sudo: Linux is fine, but pip's own folder is empty. */
export function sceneHomeWiped(): PixelScene {
  const s = new SceneBuilder()
  const cv = s.base

  // A calm room: the computer still works.
  cv.rect(0, 0, W, H, C.bg)
  for (let y = 0; y < 56; y += 6) cv.rect(0, y, W, 1, C.wallLine)
  cv.rect(0, 56, W, H - 56, C.panel).rect(0, 56, W, 1, C.slate)
  for (let x = 4; x < W; x += 16) cv.rect(x, 60, 8, 1, C.wallLine).rect(x + 8, 66, 8, 1, C.wallLine)

  desk(cv, C.wood, C.woodDark)
  monitor(cv, 22, 10, C.deep)

  // A big green tick on the screen: the system survived.
  for (const [cx, cy] of CHECK) cv.rect(cx, cy, 2, 2, C.lime)
  s.layer('cursor', 'blink').rect(52, 29, 3, 1, C.lime)

  // Pip's home folder, open and empty, on the floor.
  cv.sprite(84, 58, EMPTY_FOLDER, BLUE_FOLDER)
  s.layer('dust', 'slow').pix(89, 61, C.slate).pix(92, 63, C.slate).pix(94, 60, C.slate)

  // Pip, puzzled, with a question mark.
  s.pip(104, 41)
  drawText(cv, 114, 30, '?', C.yellow)

  return s.build(
    'A computer that still works, with a green tick on its screen. On the floor, Pip looks puzzled at an empty home folder.',
  )
}

/** Crash scenes keyed by id, drawn with the same renderer as the intro. */
export const CRASH_SCENES: Readonly<Record<string, () => PixelScene>> = {
  destroyed: sceneDestroyed,
  frozen: sceneFrozen,
  'home-wiped': sceneHomeWiped,
}
