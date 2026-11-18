import { C } from '../palette'
import { type PixelScene, SceneBuilder, SCENE_H as H, SCENE_W as W } from '../scene'
import { PERSON_STAND, personLegend } from '../sprites'

const LED = [C.lime, C.cyan, C.lime, C.orange, C.lime, C.cyan, C.yellow]

// Scene 6, today: a data centre. Server racks full of blinking lights, a
// wall screen showing the cloud, a phone on a stand, and a supercomputer.
export function sceneToday(): PixelScene {
  const s = new SceneBuilder()
  const cv = s.base

  // Cool dark room with a raised tile floor.
  cv.rect(0, 0, W, 50, C.bg)
  for (let x = 0; x < W; x += 16) cv.rect(x, 0, 1, 47, C.night)
  cv.rect(0, 46, W, 4, C.deep)
  for (let ty = 0, y = 50; y < H; ty++, y += 6) {
    for (let tx = 0, x = 0; x < W; tx++, x += 8) {
      cv.rect(x, y, 8, 6, (tx + ty) % 2 === 0 ? C.slate : C.floorDark)
      cv.pix(x + 2, y + 2, C.panel).pix(x + 5, y + 2, C.panel).pix(x + 2, y + 4, C.panel).pix(x + 5, y + 4, C.panel)
    }
  }
  cv.rect(0, 50, W, 1, C.grey)

  // Three server racks.
  const lightsA = s.layer('rackA', 'blink')
  const lightsB = s.layer('rackB', 'blinkLate')
  const lightsC = s.layer('rackC', 'slow')
  let n = 0
  for (const rx of [3, 18, 33]) {
    cv.rect(rx, 6, 14, 42, C.deep).rect(rx + 1, 7, 12, 40, C.panel)
    cv.rect(rx + 1, 7, 12, 1, C.slate)
    for (let y = 9; y < 45; y += 4) {
      cv.rect(rx + 2, y, 10, 3, C.bg).rect(rx + 2, y, 10, 1, C.slate)
      cv.rect(rx + 8, y + 1, 3, 1, C.panel)
      const target = n % 3 === 0 ? lightsA : n % 3 === 1 ? lightsB : lightsC
      target.pix(rx + 3, y + 1, LED[n % LED.length])
      ;(n % 2 === 0 ? lightsB : lightsA).pix(rx + 5, y + 1, LED[(n + 3) % LED.length])
      cv.pix(rx + 3, y + 1, C.green)
      n++
    }
  }

  // Wall screen showing the cloud, with data going up and down.
  cv.rect(52, 4, 34, 20, C.deep).rect(53, 5, 32, 18, C.blue)
  cv.sprite(58, 8, [
    '.........####.........',
    '.......########.......',
    '...###.#########......',
    '..##############.###..',
    '.###################..',
    '######################',
    '######################',
    '.####################.',
  ], { '#': C.white })
  cv.rect(53, 21, 32, 2, C.panel2)

  // A phone on a little stand.
  cv.rect(58, 44, 20, 2, C.slate).rect(62, 46, 12, 4, C.panel).rect(58, 44, 20, 1, C.grey)
  cv.rect(61, 25, 13, 20, C.deep).rect(62, 26, 11, 18, C.panel)
  cv.pix(61, 25, C.bg).pix(73, 25, C.bg).rect(65, 27, 5, 1, C.deep)
  cv.rect(63, 29, 9, 12, C.sky).rect(63, 29, 9, 1, C.panel2)
  const APPS = [C.yellow, C.lime, C.orange, C.white, C.cyan, C.red, C.lime, C.yellow, C.orange]
  APPS.forEach((c, i) => cv.rect(64 + (i % 3) * 3, 31 + Math.floor(i / 3) * 3, 2, 2, c))
  cv.rect(66, 42, 3, 1, C.slate)

  // A technician checking on the big machine.
  cv.sprite(78, 28, PERSON_STAND, personLegend({ hair: C.grey, skin: C.skinDeep, top: C.lime, trousers: C.panel2 }))

  // The supercomputer: a wide row of cabinets with a light band.
  cv.rect(91, 10, 36, 38, C.deep)
  for (let i = 0; i < 4; i++) {
    const x = 92 + i * 9
    cv.rect(x, 11, 8, 36, C.panel2).rect(x, 11, 8, 1, C.blue)
    cv.rect(x + 1, 18, 6, 26, C.bg)
    for (let y = 20; y < 43; y += 3) cv.rect(x + 2, y, 4, 1, C.panel)
  }
  cv.rect(92, 13, 35, 3, C.teal)
  cv.rect(95, 6, 2, 4, C.slate).rect(105, 7, 2, 3, C.slate).rect(117, 5, 2, 5, C.slate)
  cv.rect(95, 5, 24, 1, C.slate)

  // Animated: the supercomputer's light band runs, data flows to the cloud,
  // and a message pops up on the phone.
  for (let f = 0; f < 3; f++) {
    const band = s.layer(`band${f}`, f === 0 ? 'frame0' : f === 1 ? 'frame1' : 'frame2')
    for (let x = 92 + f * 2; x < 127; x += 6) band.rect(x, 13, 2, 3, C.cyan)
    for (let i = 0; i < 4; i++) {
      const x = 92 + i * 9
      for (let y = 20 + f; y < 43; y += 3) band.rect(x + 2, y, 2, 1, (i + f) % 2 ? C.sky : C.cyan)
    }
  }
  const up = s.layer('dataUp', 'blink')
  const down = s.layer('dataDown', 'blinkLate')
  const UP = ['..#..', '.###.', '#####', '..#..']
  const DOWN = [...UP].reverse()
  for (const x of [56, 70]) {
    up.sprite(x, 17, UP, { '#': C.lime })
    down.sprite(x + 7, 17, DOWN, { '#': C.cyan })
  }
  s.layer('phoneMessage', 'slow').rect(63, 29, 9, 3, C.white).rect(64, 30, 5, 1, C.slate)

  s.pip(10, 55)

  return s.build(
    'Today: a data centre with server racks full of blinking lights, a wall screen showing the cloud, a phone on a stand, a supercomputer and Pip waddling past',
  )
}
