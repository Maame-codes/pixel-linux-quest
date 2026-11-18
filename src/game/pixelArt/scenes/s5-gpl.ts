import type { PixelCanvas } from '../canvas'
import { C } from '../palette'
import { calendar } from '../props'
import { type PixelScene, SceneBuilder, SCENE_H as H, SCENE_W as W } from '../scene'
import { PERSON_CHEER, personLegend } from '../sprites'
import { drawPuzzle, kernelSlot, PIECE_H, PIECE_W } from './puzzle'
import { PUZZLE_X, PUZZLE_Y } from './s3-gnu'
import { drawWorkshop } from './workshop'

/** A boxed distribution: plain coloured box with a simple, made-up emblem. */
function distroBox(cv: PixelCanvas, x: number, y: number, body: string, shade: string, emblem: string[]): void {
  cv.rect(x, y, 9, 10, C.deep)
  cv.rect(x + 1, y + 1, 7, 8, body).rect(x + 7, y + 1, 1, 8, shade).rect(x + 1, y + 1, 6, 1, C.white)
  cv.rect(x + 2, y + 3, 5, 5, C.white)
  cv.sprite(x + 2, y + 3, emblem, { '#': shade })
}

const EMBLEMS = {
  dot: ['.....', '.###.', '.###.', '.###.', '.....'],
  stripes: ['#####', '.....', '#####', '.....', '#####'],
  triangle: ['..#..', '..#..', '.###.', '.###.', '#####'],
  diamond: ['..#..', '.###.', '#####', '.###.', '..#..'],
  bars: ['#.#.#', '#.#.#', '#.#.#', '#.#.#', '#.#.#'],
  ring: ['.###.', '#...#', '#...#', '#...#', '.###.'],
}

// Scene 5, 1992: back in the workshop, the kernel piece clicks into the
// puzzle, and boxed distributions start to fill a shelf.
export function sceneGpl(): PixelScene {
  const s = new SceneBuilder()
  const cv = s.base

  drawWorkshop(cv, W, H, false)
  calendar(cv, 8, 6, '1992')

  // The finished puzzle, with the kernel piece in place.
  drawPuzzle(cv, PUZZLE_X, PUZZLE_Y, { missingKernel: false, kernelColour: C.white })

  // Shelves of distribution boxes.
  cv.rect(98, 14, 28, 2, C.woodDark).rect(98, 26, 28, 2, C.woodDark)
  cv.rect(99, 16, 1, 2, C.deep).rect(124, 16, 1, 2, C.deep).rect(99, 28, 1, 2, C.deep).rect(124, 28, 1, 2, C.deep)
  distroBox(cv, 99, 4, C.sky, C.blue, EMBLEMS.dot)
  distroBox(cv, 108, 4, C.lime, C.green, EMBLEMS.stripes)
  distroBox(cv, 117, 5, C.orange, C.red, EMBLEMS.triangle)
  distroBox(cv, 100, 16, C.yellow, C.orangeShade, EMBLEMS.diamond)
  distroBox(cv, 110, 16, C.cyan, C.teal, EMBLEMS.ring)

  // Cheering!
  cv.sprite(26, 30, PERSON_CHEER, personLegend({ hair: C.hairBrown, skin: C.skinMid, top: C.orange, trousers: C.panel2 }))
  cv.sprite(104, 30, PERSON_CHEER, personLegend({ hair: C.hairBlond, skin: C.skinLight, top: C.sky, trousers: C.bg }))

  // Animated: a bright rim flashes round the new piece, sparkles pop around
  // it, and a sixth box appears on the shelf.
  const slot = kernelSlot(PUZZLE_X, PUZZLE_Y)
  const rim = s.layer('kernelRim', 'slow')
  rim.rect(slot.x - 1, slot.y - 1, PIECE_W + 1, 1, C.yellow).rect(slot.x - 1, slot.y + PIECE_H - 1, PIECE_W + 1, 1, C.yellow)
  rim.rect(slot.x - 1, slot.y, 1, PIECE_H - 1, C.yellow).rect(slot.x + PIECE_W - 1, slot.y, 1, PIECE_H - 1, C.yellow)

  const SPARK = ['.#.', '###', '.#.']
  const sparkA = s.layer('sparkA', 'blink')
  const sparkB = s.layer('sparkB', 'blinkLate')
  sparkA.sprite(slot.x - 4, 2, SPARK, { '#': C.yellow }).sprite(slot.x + PIECE_W + 1, 4, SPARK, { '#': C.white })
  sparkB.sprite(slot.x + 2, 0, SPARK, { '#': C.white }).sprite(slot.x + PIECE_W - 3, 1, SPARK, { '#': C.yellow })
  sparkA.pix(slot.x - 1, 6, C.white).pix(slot.x + PIECE_W + 4, 9, C.yellow)
  sparkB.pix(slot.x - 6, 8, C.yellow).pix(slot.x + PIECE_W + 6, 2, C.white)

  const newBox = s.layer('newBox', 'slow')
  distroBox(newBox, 115, 16, C.red, C.purple, EMBLEMS.bars)
  s.layer('boxSpark', 'blinkLate').sprite(122, 13, SPARK, { '#': C.yellow })

  s.pip(70, 55)

  return s.build(
    '1992 workshop: the kernel piece clicks into the puzzle of free tools, two people cheer, distribution boxes fill a shelf, and Pip waddles below',
  )
}
