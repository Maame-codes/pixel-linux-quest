import type { PixelCanvas } from '../canvas'
import { C } from '../palette'

// The GNU workshop shared by scenes 3 and 5: wall, pegboard of tools,
// workbench and a concrete floor.
export const BENCH_TOP = 44

export function drawWorkshop(cv: PixelCanvas, w: number, h: number, withPegboard = true): void {
  // Wall and baseboard.
  cv.rect(0, 0, w, 50, C.panel)
  for (let x = 0; x < w; x += 16) cv.rect(x, 0, 1, 47, C.wallLine)
  cv.rect(0, 46, w, 4, C.bg)

  // Concrete floor with a few speckles.
  cv.rect(0, 50, w, h - 50, C.slate)
  cv.rect(0, 50, w, 1, C.grey)
  for (let i = 0; i < 40; i++) {
    const n = (i * 2654435761) >>> 0
    cv.pix(n % w, 52 + ((n >>> 8) % (h - 53)), C.concrete)
  }

  if (withPegboard) drawPegboard(cv)

  // Workbench across the room.
  cv.rect(38, BENCH_TOP, 88, 2, C.wood).rect(38, BENCH_TOP + 2, 88, 1, C.woodDark)
  cv.rect(40, BENCH_TOP + 3, 2, 50 - BENCH_TOP - 3, C.woodDark)
  cv.rect(122, BENCH_TOP + 3, 2, 50 - BENCH_TOP - 3, C.woodDark)

  // Toolbox on the floor.
  cv.rect(40, 54, 18, 9, C.deep).rect(41, 55, 16, 7, C.red).rect(41, 58, 16, 1, C.deep)
  cv.rect(45, 52, 8, 2, C.deep).rect(47, 53, 4, 1, C.slate).rect(48, 59, 2, 2, C.yellow)
}

/** Pegboard with a hammer, wrench, saw and screwdriver hanging on it. */
function drawPegboard(cv: PixelCanvas): void {
  cv.rect(3, 4, 34, 23, C.deep).rect(4, 5, 32, 21, C.beigeDark)
  for (let y = 7; y < 25; y += 3) for (let x = 6; x < 35; x += 3) cv.pix(x, y, C.pegHole)
  // hammer
  cv.rect(7, 8, 7, 3, C.grey).rect(7, 8, 7, 1, C.soft).rect(10, 11, 2, 11, C.wood)
  // wrench
  cv.rect(17, 8, 4, 2, C.grey).rect(18, 9, 2, 1, C.beigeDark).rect(18, 10, 2, 11, C.grey).rect(17, 21, 4, 2, C.grey)
  // saw
  cv.rect(24, 9, 3, 6, C.orange).rect(25, 11, 1, 2, C.beigeDark).rect(24, 15, 10, 4, C.soft)
  for (let x = 25; x < 34; x += 2) cv.pix(x, 19, C.soft)
  // screwdriver
  cv.rect(31, 7, 3, 5, C.red).rect(32, 12, 1, 6, C.grey)
}
