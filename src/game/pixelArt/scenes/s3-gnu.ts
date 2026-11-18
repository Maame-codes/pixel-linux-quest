import { drawText, textWidth } from '../font'
import { C } from '../palette'
import { calendar } from '../props'
import { type PixelScene, SceneBuilder, SCENE_H as H, SCENE_W as W } from '../scene'
import { PERSON_STAND, PERSON_THINK, personLegend } from '../sprites'
import { drawPuzzle, kernelSlot, PIECE_H, PIECE_W } from './puzzle'
import { drawWorkshop } from './workshop'

export const PUZZLE_X = 46
export const PUZZLE_Y = 13

// Scene 3, 1983: a workshop where a big jigsaw of free tools is almost
// finished. One piece is missing, and its label says KERNEL.
export function sceneGnu(): PixelScene {
  const s = new SceneBuilder()
  const cv = s.base

  drawWorkshop(cv, W, H)
  calendar(cv, 104, 4, '1983')

  // Tins on a small shelf under the calendar.
  cv.rect(102, 26, 22, 2, C.woodDark)
  cv.rect(104, 21, 5, 5, C.sky).rect(104, 21, 5, 1, C.soft)
  cv.rect(111, 22, 4, 4, C.lime).rect(111, 22, 4, 1, C.white)
  cv.rect(117, 20, 5, 6, C.orange).rect(117, 20, 5, 1, C.yellow)

  drawPuzzle(cv, PUZZLE_X, PUZZLE_Y, { missingKernel: true })

  // The KERNEL label above the empty slot, with an arrow pointing in.
  const slot = kernelSlot(PUZZLE_X, PUZZLE_Y)
  const label = 'KERNEL'
  const cardW = textWidth(label) + 6
  const cardX = slot.x + Math.floor((PIECE_W - 1) / 2) - Math.floor(cardW / 2)
  cv.rect(cardX, 0, cardW, 9, C.deep).rect(cardX + 1, 0, cardW - 2, 8, C.yellow)
  drawText(cv, cardX + 3, 2, label, C.deep)

  // Two people working it out.
  cv.sprite(24, 30, PERSON_THINK, personLegend({ hair: C.hairBrown, skin: C.skinMid, top: C.orange, trousers: C.panel2 }))
  cv.sprite(
    102,
    30,
    PERSON_STAND,
    personLegend({ hair: C.hairBlond, skin: C.skinLight, top: C.sky, trousers: C.bg }),
    true,
  )

  // Animated: the empty slot's outline marches, the arrow bobs, a "?" pops up.
  const dashA = s.layer('slotDashA', 'blink')
  const dashB = s.layer('slotDashB', 'blinkLate')
  const w = PIECE_W - 1
  const h = PIECE_H - 1
  let i = 0
  const edge: [number, number][] = []
  for (let x = 0; x < w; x++) edge.push([x, 0])
  for (let y = 1; y < h; y++) edge.push([w - 1, y])
  for (let x = w - 2; x >= 0; x--) edge.push([x, h - 1])
  for (let y = h - 2; y > 0; y--) edge.push([0, y])
  for (const [x, y] of edge) {
    ;(i % 2 === 0 ? dashA : dashB).pix(slot.x + x, slot.y + y, C.yellow)
    i++
  }
  const arrowX = slot.x + Math.floor((PIECE_W - 1) / 2) - 1
  s.layer('arrowUp', 'blink').sprite(arrowX, 9, ['###', '.#.'], { '#': C.yellow })
  s.layer('arrowDown', 'blinkLate').sprite(arrowX, 10, ['###', '.#.'], { '#': C.yellow })
  s.layer('thinking', 'slow').sprite(32, 23, ['##.', '..#', '.#.', '...', '.#.'], { '#': C.white })

  s.pip(84, 55, true)

  return s.build(
    '1983 workshop: a big jigsaw puzzle of free tools on a workbench, with one piece missing and labelled KERNEL, two people thinking and Pip waddling by',
  )
}
