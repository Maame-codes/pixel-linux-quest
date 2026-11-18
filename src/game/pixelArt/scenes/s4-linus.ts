import { C } from '../palette'
import { calendar, woodFloor } from '../props'
import { type PixelScene, SceneBuilder, SCENE_H as H, SCENE_W as W } from '../scene'
import { PERSON_BACK_SIT, personLegend } from '../sprites'

// Window glass, where the snow falls.
const WIN = { x: 7, y: 6, w: 44, h: 30 }

// Scene 4, 1991: a student's room in Helsinki late at night. They sit with
// their back to us at a beige PC, while snow falls outside the window.
export function sceneLinus(): PixelScene {
  const s = new SceneBuilder()
  const cv = s.base

  // Dark room: wall, baseboard, night-time floorboards.
  cv.rect(0, 0, W, 50, C.night)
  for (let x = 4; x < W; x += 12) cv.rect(x, 0, 1, 46, C.bg)
  cv.rect(0, 46, W, 4, C.deep)
  woodFloor(cv, W, H, C.nightWood, C.nightWoodDark)

  // The window: night sky, a moon, snowy rooftops with lit windows.
  cv.rect(WIN.x - 2, WIN.y - 2, WIN.w + 4, WIN.h + 4, C.deep)
  cv.rect(WIN.x, WIN.y, WIN.w, WIN.h, C.deep)
  cv.rect(WIN.x, WIN.y + 8, WIN.w, WIN.h - 8, C.night).rect(WIN.x, WIN.y + 16, WIN.w, WIN.h - 16, C.panel2)
  cv.rect(40, 9, 4, 4, C.soft).rect(40, 9, 1, 1, C.deep).rect(43, 12, 1, 1, C.deep)
  const roofs: [number, number, number][] = [
    [7, 25, 9],
    [16, 21, 8],
    [24, 27, 10],
    [34, 23, 7],
    [41, 26, 10],
  ]
  for (const [x, y, w] of roofs) {
    cv.rect(x, y, w, WIN.y + WIN.h - y, C.deep)
    cv.rect(x, y, w, 1, C.white)
  }
  cv.rect(19, 18, 2, 3, C.deep).rect(19, 17, 2, 1, C.white) // chimney
  for (const [x, y] of [[9, 28], [12, 31], [18, 24], [21, 28], [27, 30], [36, 26], [44, 29], [47, 31]]) {
    cv.rect(x, y, 2, 2, C.yellow)
  }
  cv.rect(WIN.x, WIN.y + WIN.h - 2, WIN.w, 2, C.white) // snow on the ledge
  // Frame bars.
  cv.rect(WIN.x + 21, WIN.y, 2, WIN.h, C.woodDark).rect(WIN.x, WIN.y + 9, WIN.w, 2, C.woodDark)
  cv.rect(WIN.x - 3, WIN.y + WIN.h + 2, WIN.w + 6, 2, C.woodDark)

  // Radiator under the window.
  cv.rect(14, 39, 30, 7, C.deep)
  for (let x = 15; x < 43; x += 3) cv.rect(x, 40, 2, 6, C.slate)

  // Glow from the screen on the wall behind the desk.
  cv.rect(70, 6, 42, 30, C.glow).rect(74, 9, 34, 24, C.glow2)

  calendar(cv, 106, 3, '1991')

  // Desk.
  cv.rect(62, 38, 64, 2, C.woodDark).rect(62, 40, 64, 1, C.nightWoodDark)
  cv.rect(64, 41, 2, 9, C.nightWoodDark).rect(122, 41, 2, 9, C.nightWoodDark)

  // Beige PC: monitor on top of a flat desktop case.
  cv.rect(77, 30, 30, 8, C.deep).rect(78, 31, 28, 6, C.beige).rect(78, 35, 28, 2, C.beigeDark)
  cv.rect(96, 32, 8, 1, C.deep).rect(81, 32, 3, 2, C.lime)
  cv.rect(80, 11, 24, 19, C.deep).rect(81, 12, 22, 17, C.beige)
  cv.rect(101, 13, 1, 16, C.beigeDark).rect(81, 27, 22, 2, C.beigeDark)
  cv.rect(83, 14, 17, 12, C.deep).rect(84, 15, 15, 10, C.bg)
  // Code on the screen.
  cv.rect(85, 16, 6, 1, C.lime).rect(87, 18, 8, 1, C.cyan).rect(87, 20, 5, 1, C.lime)

  // Keyboard and a mug.
  cv.rect(70, 36, 10, 2, C.deep).rect(71, 36, 8, 1, C.beigeDark)
  cv.rect(112, 32, 6, 6, C.deep).rect(113, 33, 4, 4, C.red).rect(118, 34, 1, 2, C.deep)

  // The student, from behind.
  cv.sprite(
    85,
    26,
    PERSON_BACK_SIT,
    personLegend({ hair: C.hairBlond, skin: C.skinLight, top: C.panel2, chair: C.deep }),
  )

  // Animated: snow in three frames, more code being typed, a blinking cursor,
  // steam from the mug and a flickering window across the street.
  const FLAKES: [number, number][] = [
    [9, 2], [15, 7], [20, 1], [26, 9], [31, 4], [37, 11], [43, 6], [48, 1],
    [11, 15], [18, 20], [29, 17], [39, 21], [46, 16], [24, 26], [34, 13], [13, 24],
  ]
  for (let f = 0; f < 3; f++) {
    const layer = s.layer(`snow${f}`, f === 0 ? 'frame0' : f === 1 ? 'frame1' : 'frame2')
    for (const [fx, fy] of FLAKES) {
      const x = WIN.x + ((fx - WIN.x + f) % WIN.w)
      const y = WIN.y + ((fy + f * 3) % (WIN.h - 2))
      if (x >= WIN.x + 21 && x < WIN.x + 23) continue
      layer.pix(x, y, C.white)
    }
  }
  s.layer('code1', 'frame1').rect(87, 22, 7, 1, C.cyan)
  s.layer('code2', 'frame2').rect(87, 22, 7, 1, C.cyan).rect(85, 24, 4, 1, C.lime)
  s.layer('cursor', 'blink').rect(96, 20, 2, 1, C.white)
  s.layer('steamA', 'blink').pix(114, 30, C.grey).pix(115, 28, C.grey)
  s.layer('steamB', 'blinkLate').pix(115, 30, C.grey).pix(114, 28, C.grey)
  s.layer('streetLight', 'slow').rect(27, 30, 2, 2, C.deep)

  s.pip(44, 55)

  return s.build(
    '1991, Helsinki at night: a student seen from behind typing at a beige PC, snow falling past the window, and Pip waddling across the floor',
  )
}
