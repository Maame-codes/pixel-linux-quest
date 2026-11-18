import { C } from '../palette'
import { calendar } from '../props'
import { type PixelScene, SceneBuilder, SCENE_W as W } from '../scene'
import { PERSON_SIT, PERSON_STAND, personLegend } from '../sprites'

// Scene 1, 1969: a computer lab with a wall of cabinets, tape reels and a
// teletype. Pixel for pixel the same as design-reference/intro-scene-1969.svg.
export function sceneUnix(): PixelScene {
  const s = new SceneBuilder()
  const cv = s.base

  // Wall, baseboard and a checker floor.
  cv.rect(0, 0, W, 50, C.panel)
  for (let x = 0; x < W; x += 16) cv.rect(x, 0, 1, 47, C.wallLine)
  cv.rect(0, 46, W, 4, C.bg)
  for (let ty = 0, y = 50; y < 72; ty++, y += 6) {
    for (let tx = 0, x = 0; x < W; tx++, x += 8) {
      cv.rect(x, y, 8, 6, (tx + ty) % 2 === 0 ? C.slate : C.floorDark)
    }
  }
  cv.rect(0, 50, W, 1, C.grey)

  // Night window with stars and a moon.
  cv.rect(3, 6, 23, 20, C.deep).rect(5, 8, 19, 16, C.night)
  cv.rect(14, 8, 1, 16, C.deep).rect(5, 15, 19, 1, C.deep)
  for (const [x, y] of [[7, 10], [11, 12], [17, 9], [21, 11], [8, 19], [19, 21]]) cv.pix(x, y, C.white)
  cv.rect(18, 17, 3, 3, C.yellow).pix(20, 17, C.night)
  cv.rect(3, 26, 23, 2, C.slate)

  calendar(cv, 28, 9, '1969')

  // Three computer cabinets.
  for (const x of [53, 67, 81]) {
    cv.rect(x, 12, 15, 36, C.deep)
    cv.rect(x + 1, 13, 13, 34, C.grey)
    cv.rect(x + 1, 13, 13, 1, C.white)
    cv.rect(x + 13, 14, 1, 33, C.slate)
  }
  cv.rect(53, 47, 43, 1, C.deep)

  // Cabinet 1: a panel of lights and some vents.
  cv.rect(55, 16, 10, 12, C.bg)
  cv.rect(55, 31, 10, 1, C.deep)
  for (let y = 18; y < 28; y += 2) for (let x = 56; x < 64; x += 2) cv.pix(x, y, C.panel)
  for (let y = 34; y < 44; y += 2) cv.rect(56, y, 8, 1, C.slate)

  // Cabinet 2: two tape reels and status lamps.
  cv.rect(69, 15, 11, 21, C.bg)
  const REEL = ['..####..', '.#oooo#.', '#oo##oo#', '#o#hh#o#', '#o#hh#o#', '#oo##oo#', '.#oooo#.', '..####..']
  for (const ry of [16, 26]) cv.sprite(70, ry, REEL, { '#': C.slate, o: C.panel, h: C.soft })
  cv.rect(70, 39, 2, 2, C.orange).rect(74, 39, 2, 2, C.yellow).rect(78, 39, 1, 2, C.lime)

  // Cabinet 3: an oscilloscope and a row of switches.
  cv.rect(83, 16, 10, 9, C.deep).rect(84, 17, 8, 7, C.teal)
  ;[20, 19, 18, 19, 20, 21, 22, 21].forEach((y, i) => cv.pix(84 + i, y, C.lime))
  for (let i = 0; i < 5; i++) cv.rect(84 + i * 2, 29, 1, 2, i % 2 ? C.white : C.deep)
  for (let y = 34; y < 44; y += 2) cv.rect(84, y, 8, 1, C.slate)

  // Desk with a teletype printing on paper.
  cv.rect(102, 37, 25, 2, C.wood).rect(102, 39, 25, 1, C.woodDark)
  cv.rect(104, 40, 2, 10, C.woodDark).rect(123, 40, 2, 10, C.woodDark)
  cv.rect(108, 26, 18, 11, C.deep).rect(109, 27, 16, 9, C.beige).rect(109, 33, 16, 3, C.beigeDark)
  for (let x = 110; x < 124; x += 2) cv.pix(x, 34, C.slate)
  cv.rect(112, 15, 10, 12, C.white).rect(112, 15, 10, 1, C.soft)
  for (const [y, w] of [[17, 7], [19, 8], [21, 5], [23, 3]]) cv.rect(113, y, w, 1, C.slate)

  // Stool and the two programmers.
  cv.rect(95, 42, 8, 2, C.woodDark).rect(96, 44, 1, 6, C.woodDark).rect(101, 44, 1, 6, C.woodDark)
  cv.sprite(43, 30, PERSON_STAND, personLegend({ hair: C.hairDark, skin: C.skinLight, top: C.blue, trousers: C.bg }))
  cv.sprite(
    94,
    26,
    PERSON_SIT,
    personLegend({ hair: C.hairDark, skin: C.skinLight, top: C.green, trousers: C.panel2, beard: C.hairBrown }),
  )

  // Animated layers.
  const stars = s.layer('stars', 'slow')
  stars.pix(17, 9, C.night).pix(8, 19, C.night).pix(11, 12, C.grey)

  const lightsA = s.layer('lightsA', 'blink')
  const lightsB = s.layer('lightsB', 'blinkLate')
  const LAMPS = [C.orange, C.yellow, C.lime, C.cyan]
  let i = 0
  for (let y = 18; y < 28; y += 2) {
    for (let x = 56; x < 64; x += 2) {
      ;((i * 7) % 3 === 0 ? lightsA : lightsB).pix(x, y, LAMPS[i % 4])
      i++
    }
  }

  const reelA = s.layer('reelA', 'blink')
  const reelB = s.layer('reelB', 'blinkLate')
  for (const ry of [16, 26]) {
    reelA.rect(73, ry + 1, 2, 1, C.soft).rect(73, ry + 6, 2, 1, C.soft)
    reelB.rect(71, ry + 3, 1, 2, C.soft).rect(76, ry + 3, 1, 2, C.soft)
  }

  const scope = s.layer('scopeB', 'slow')
  scope.rect(84, 17, 8, 7, C.teal)
  ;[22, 21, 20, 19, 18, 19, 20, 21].forEach((y, j) => scope.pix(84 + j, y, C.lime))

  s.layer('cursor', 'blink').pix(117, 23, C.deep)

  s.pip(6, 55)

  return s.build(
    '1969 computer lab: two programmers at a wall of tape-reel computers and a teletype, with Pip watching',
  )
}
