import { drawText } from '../font'
import { C } from '../palette'
import { crt, desk, keyboard, priceTag, stool, woodFloor } from '../props'
import { type PixelScene, SceneBuilder, SCENE_H as H, SCENE_W as W } from '../scene'
import { PERSON_SIT, PERSON_THINK, personLegend } from '../sprites'

// Scene 2: a university computer room. Four different machines, each its own
// colour and each with a price tag, and a chalkboard showing Unix splitting
// into many versions.
export function sceneSpread(): PixelScene {
  const s = new SceneBuilder()
  const cv = s.base

  // Wall, baseboard, wooden floor.
  cv.rect(0, 0, W, 50, C.panel2)
  for (let x = 8; x < W; x += 16) cv.rect(x, 0, 1, 46, C.uniLine)
  cv.rect(0, 46, W, 4, C.bg)
  woodFloor(cv, W, H)

  // Chalkboard: UNIX branching into four coloured versions.
  cv.rect(30, 1, 68, 20, C.deep).rect(31, 2, 66, 18, C.woodDark).rect(32, 3, 64, 16, C.board)
  cv.rect(34, 20, 60, 1, C.woodDark).rect(80, 19, 4, 1, C.white)
  drawText(cv, 35, 8, 'UNIX', C.white)
  cv.rect(51, 10, 5, 1, C.soft).rect(56, 4, 1, 13, C.soft)
  const versions = [C.orange, C.sky, C.green, C.purple]
  versions.forEach((colour, i) => {
    const y = 3 + i * 4
    cv.rect(57, y + 1, 4, 1, C.soft)
    cv.rect(61, y, 7, 3, C.soft).rect(62, y + 1, 5, 1, colour)
    cv.rect(70, y + 1, 6 + ((i * 5) % 9), 1, C.grey)
    cv.rect(79 + ((i * 3) % 5), y + 1, 5, 1, C.grey)
  })

  // Wall clock.
  cv.rect(108, 4, 11, 11, C.deep).rect(109, 5, 9, 9, C.white)
  cv.rect(113, 6, 1, 4, C.deep).rect(113, 9, 3, 1, C.deep)

  // Machine 1: a tall orange cabinet with lights and vents.
  cv.rect(5, 16, 17, 32, C.deep).rect(6, 17, 15, 30, C.orange)
  cv.rect(6, 17, 15, 1, C.yellow).rect(19, 18, 1, 29, C.orangeShade)
  cv.rect(8, 20, 10, 9, C.bg)
  for (let y = 21; y < 28; y += 2) for (let x = 9; x < 17; x += 2) cv.pix(x, y, C.panel)
  for (let y = 31; y < 35; y += 2) cv.rect(8, y, 10, 1, C.orangeShade)

  // Machine 2: a sky-blue terminal on a desk, with a student typing.
  desk(cv, 33, 22)
  crt(cv, 35, 23, C.sky, C.blue)
  keyboard(cv, 36, 37, C.soft)
  cv.rect(38, 26, 5, 1, C.lime).rect(38, 28, 7, 1, C.lime)
  stool(cv, 25)
  cv.sprite(24, 26, PERSON_SIT, personLegend({ hair: C.hairBlond, skin: C.skinLight, top: C.red, trousers: C.bg }))

  // Machine 3: a green minicomputer on a wheeled cart.
  cv.rect(60, 22, 24, 23, C.deep).rect(61, 23, 22, 21, C.green)
  cv.rect(61, 23, 22, 1, C.lime).rect(82, 24, 1, 20, C.teal)
  cv.rect(63, 25, 18, 5, C.bg)
  for (let i = 0; i < 8; i++) cv.rect(64 + i * 2, 31, 1, 2, i % 3 === 0 ? C.white : C.deep)
  cv.rect(60, 45, 24, 2, C.slate).rect(62, 47, 1, 1, C.slate).rect(81, 47, 1, 1, C.slate)
  cv.rect(61, 48, 3, 2, C.deep).rect(80, 48, 3, 2, C.deep)

  // Student scratching their head between two machines that do not agree.
  cv.sprite(86, 30, PERSON_THINK, personLegend({ hair: C.bg, skin: C.skinDeep, top: C.yellow, trousers: C.panel }))

  // Machine 4: a purple workstation with a wide screen and a tower.
  desk(cv, 96, 31)
  cv.rect(98, 20, 20, 15, C.deep).rect(99, 21, 18, 13, C.purple)
  cv.rect(116, 22, 1, 12, C.purpleShade).rect(101, 23, 14, 9, C.deep).rect(102, 24, 12, 7, C.bg)
  cv.rect(104, 26, 6, 1, C.yellow).rect(104, 28, 4, 1, C.yellow)
  cv.rect(105, 35, 6, 2, C.deep)
  keyboard(cv, 101, 37, C.purple)
  cv.rect(119, 23, 7, 14, C.deep).rect(120, 24, 5, 13, C.purple).rect(121, 26, 3, 1, C.lime).rect(124, 25, 1, 11, C.purpleShade)

  // Price tags: the machines were costly.
  priceTag(cv, 6, 36, 2, 2)
  priceTag(cv, 37, 41, 2, 1)
  priceTag(cv, 62, 34, 3, 1)
  priceTag(cv, 101, 41, 3, 1)

  // Animated layers.
  const lightsA = s.layer('lightsA', 'blink')
  const lightsB = s.layer('lightsB', 'blinkLate')
  const LAMPS = [C.lime, C.yellow, C.cyan, C.orange]
  let n = 0
  for (let y = 21; y < 28; y += 2) {
    for (let x = 9; x < 17; x += 2) {
      ;(n % 3 === 0 ? lightsA : lightsB).pix(x, y, LAMPS[n % 4])
      n++
    }
  }
  for (let i = 0; i < 4; i++) (i % 2 ? lightsA : lightsB).rect(64 + i * 4, 27, 2, 1, LAMPS[i])

  s.layer('cursorBlue', 'blink').rect(46, 28, 2, 1, C.lime)
  s.layer('cursorPurple', 'blinkLate').rect(109, 28, 2, 1, C.yellow)
  s.layer('thinking', 'slow').sprite(94, 23, ['##.', '..#', '.#.', '...', '.#.'], { '#': C.white })
  const tick = s.layer('clockHand', 'slow')
  tick.rect(113, 6, 1, 4, C.white).rect(113, 9, 1, 1, C.deep).rect(114, 9, 1, 3, C.deep)

  s.pip(70, 55, true)

  return s.build(
    'A university computer room: four different coloured computers, each with a price tag, and a chalkboard showing Unix splitting into versions, with Pip waddling past',
  )
}
