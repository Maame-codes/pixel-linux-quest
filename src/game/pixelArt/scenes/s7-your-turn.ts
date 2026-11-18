import type { PixelCanvas } from '../canvas'
import { C } from '../palette'
import { DOLLAR, woodFloor } from '../props'
import { type PixelScene, SceneBuilder, SCENE_H as H, SCENE_W as W } from '../scene'

// The big map board on the wall: x 2..125, y 1..45.
const MAP = { x: 4, y: 3, w: 120, h: 40 }

type Island = { x: number; y: number; w: number; h: number; ground: string; edge: string }

/** A rounded island: a lumpy oval of ground with a sandy shore. */
function island(cv: PixelCanvas, i: Island): void {
  const rx = i.w / 2
  const ry = i.h / 2
  for (let y = 0; y < i.h; y++) {
    for (let x = 0; x < i.w; x++) {
      const dx = (x + 0.5 - rx) / rx
      const dy = (y + 0.5 - ry) / ry
      // A gentle wobble so no two shores are the same.
      const wobble = 0.07 * Math.sin((x + i.x) * 1.3) * Math.cos((y + i.y) * 1.1)
      const d = dx * dx + dy * dy + wobble
      if (d <= 0.68) cv.pix(i.x + x, i.y + y, i.ground)
      else if (d <= 1) cv.pix(i.x + x, i.y + y, i.edge)
    }
  }
}

// Scene 7: your turn. Pip stands on a crate at a glowing terminal, in front
// of a big map of the six worlds.
export function sceneYourTurn(): PixelScene {
  const s = new SceneBuilder()
  const cv = s.base

  // Wall, floor.
  cv.rect(0, 0, W, 50, C.panel)
  woodFloor(cv, W, H)

  // Map board: sea with little waves.
  cv.rect(MAP.x - 2, MAP.y - 2, MAP.w + 4, MAP.h + 4, C.woodDark).rect(MAP.x - 1, MAP.y - 1, MAP.w + 2, MAP.h + 2, C.deep)
  cv.rect(MAP.x, MAP.y, MAP.w, MAP.h, C.blue)
  for (let i = 0; i < 26; i++) {
    const n = (i * 2654435761) >>> 0
    cv.rect(MAP.x + 2 + (n % (MAP.w - 6)), MAP.y + 2 + ((n >>> 9) % (MAP.h - 4)), 3, 1, C.sky)
  }

  // The six worlds, in order, joined by a dotted path.
  const worlds: Island[] = [
    { x: 6, y: 24, w: 24, h: 17, ground: C.green, edge: C.yellow }, // Penguin Island
    { x: 27, y: 4, w: 21, h: 17, ground: C.slate, edge: C.yellow }, // Command Caves
    { x: 43, y: 22, w: 21, h: 15, ground: C.green, edge: C.yellow }, // File Forest
    { x: 63, y: 3, w: 23, h: 17, ground: C.grey, edge: C.yellow }, // Process Peaks
    { x: 99, y: 22, w: 23, h: 16, ground: C.soft, edge: C.white }, // Text Tundra
    { x: 99, y: 3, w: 22, h: 17, ground: C.green, edge: C.yellow }, // Script Castle
  ]
  const centres = worlds.map((w) => [w.x + Math.floor(w.w / 2), w.y + Math.floor(w.h / 2)])
  for (let k = 0; k < centres.length - 1; k++) {
    const [x0, y0] = centres[k]
    const [x1, y1] = centres[k + 1]
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
    for (let t = 0; t <= steps; t += 3) {
      cv.pix(Math.round(x0 + ((x1 - x0) * t) / steps), Math.round(y0 + ((y1 - y0) * t) / steps), C.yellow)
    }
  }
  worlds.forEach((w) => island(cv, w))

  // Penguin Island: a little igloo.
  cv.rect(12, 29, 7, 4, C.white).rect(13, 28, 5, 1, C.white).rect(15, 31, 2, 2, C.panel)
  // Command Caves: rocks with a cave mouth.
  cv.rect(32, 9, 11, 7, C.panel).rect(34, 8, 6, 1, C.panel).rect(36, 12, 3, 4, C.deep)
  // File Forest: trees.
  for (const tx of [48, 53, 57]) cv.rect(tx, 27, 3, 4, C.lime).rect(tx + 1, 26, 1, 1, C.lime).rect(tx + 1, 31, 1, 2, C.woodDark)
  // Process Peaks: mountains with snowy tips.
  cv.sprite(67, 7, [
    '.....#...........',
    '....###.....#....',
    '...#####...###...',
    '..#######.#####..',
    '.###############.',
  ], { '#': C.panel })
  cv.rect(72, 7, 1, 1, C.white).rect(71, 8, 3, 1, C.white).rect(79, 8, 1, 1, C.white).rect(78, 9, 3, 1, C.white)
  // Text Tundra: snow drifts and a pine.
  cv.rect(103, 28, 6, 2, C.white).rect(111, 30, 6, 2, C.white).rect(113, 26, 1, 3, C.green).rect(112, 27, 3, 1, C.green)
  // Script Castle: towers and a gate.
  cv.rect(104, 9, 12, 7, C.grey).rect(104, 7, 3, 2, C.grey).rect(113, 7, 3, 2, C.grey).rect(108, 8, 4, 1, C.grey)
  cv.rect(104, 7, 1, 1, C.green).rect(106, 7, 1, 1, C.green).rect(113, 7, 1, 1, C.green).rect(115, 7, 1, 1, C.green)
  cv.rect(109, 12, 2, 4, C.deep).rect(105, 10, 1, 2, C.deep).rect(114, 10, 1, 2, C.deep)

  // The terminal: a tall cabinet with a glowing screen.
  cv.rect(64, 21, 33, 2, C.teal) // glow on the map behind it
  cv.rect(63, 23, 35, 42, C.deep).rect(64, 24, 33, 40, C.panel2)
  cv.rect(64, 24, 33, 1, C.blue).rect(95, 25, 1, 39, C.bg)
  cv.rect(66, 26, 29, 20, C.deep).rect(67, 27, 27, 18, C.bg)
  // Text on the screen and the prompt.
  cv.rect(69, 29, 12, 1, C.grey).rect(69, 31, 18, 1, C.grey).rect(69, 33, 9, 1, C.grey)
  cv.sprite(69, 36, DOLLAR, { '#': C.lime })
  // Keyboard ledge and vents.
  cv.rect(61, 47, 37, 4, C.deep).rect(62, 47, 35, 2, C.slate)
  for (let x = 64; x < 95; x += 3) cv.rect(x, 49, 2, 1, C.panel)
  for (let y = 54; y < 62; y += 2) cv.rect(70, y, 21, 1, C.bg)

  // Pip's crate.
  cv.rect(42, 52, 20, 13, C.deep).rect(43, 53, 18, 11, C.wood)
  cv.rect(43, 53, 18, 1, C.yellow).rect(43, 58, 18, 1, C.woodDark).rect(51, 53, 2, 11, C.woodDark)

  // Animated: the screen glows, the cursor blinks, the start flag waves and
  // the sea sparkles.
  const glow = s.layer('glow', 'slow')
  glow.rect(62, 22, 37, 1, C.cyan).rect(62, 22, 1, 25, C.cyan).rect(98, 22, 1, 25, C.cyan)
  glow.rect(67, 27, 27, 1, C.teal)
  s.layer('cursor', 'blink').rect(76, 41, 4, 2, C.lime)

  const flagA = s.layer('flagA', 'blink')
  const flagB = s.layer('flagB', 'blinkLate')
  for (const f of [flagA, flagB]) f.rect(22, 21, 1, 8, C.white)
  flagA.rect(23, 21, 5, 3, C.orange)
  flagB.rect(23, 22, 5, 3, C.orange).pix(27, 21, C.orange)

  const seaA = s.layer('seaA', 'blink')
  const seaB = s.layer('seaB', 'blinkLate')
  for (const [x, y] of [[40, 40], [90, 6], [57, 15], [96, 38], [26, 4]]) seaA.pix(x, y, C.white)
  for (const [x, y] of [[33, 30], [86, 18], [6, 10], [120, 40], [62, 6]]) seaB.pix(x, y, C.white)

  s.pip(44, 37)

  return s.build(
    'Your turn: Pip stands on a crate at a glowing terminal, in front of a big map of the six worlds',
  )
}
