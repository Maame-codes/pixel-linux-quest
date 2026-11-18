import type { PixelCanvas, SpriteRows } from './canvas'
import { drawText } from './font'
import { C } from './palette'

/** A wall calendar 19x16 showing a year, hung from a nail 2px above. */
export function calendar(cv: PixelCanvas, x: number, y: number, year: string): void {
  cv.pix(x + 9, y - 2, C.grey)
  cv.rect(x, y, 19, 16, C.deep)
  cv.rect(x + 1, y + 1, 17, 14, C.white)
  cv.rect(x + 1, y + 1, 17, 3, C.red)
  drawText(cv, x + 2, y + 5, year, C.deep)
  for (const yy of [y + 11, y + 13]) {
    for (let xx = x + 3; xx < x + 17; xx += 2) cv.pix(xx, yy, C.grey)
  }
  cv.pix(x + 13, y + 13, C.red)
}

export const DOLLAR: SpriteRows = ['..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..']

/** Width of a price tag showing `dollars` dollar signs. */
export function priceTagWidth(dollars: number): number {
  return dollars * 6 + 3
}

/** A price tag 11px tall with big dollar signs, hung on a string going up `stringLen` px. */
export function priceTag(cv: PixelCanvas, x: number, y: number, dollars: number, stringLen = 3): void {
  const w = priceTagWidth(dollars)
  for (let i = 1; i <= stringLen; i++) cv.pix(x + 3, y - i, C.soft)
  cv.rect(x, y, w, 11, C.deep)
  cv.rect(x + 1, y + 1, w - 2, 9, C.white)
  for (let i = 0; i < dollars; i++) cv.sprite(x + 2 + i * 6, y + 2, DOLLAR, { '#': C.red })
}

/** A wooden desk with its top at y and legs down to the floor line (y 50). */
export function desk(cv: PixelCanvas, x: number, w: number, y = 37): void {
  cv.rect(x, y, w, 2, C.wood).rect(x, y + 2, w, 1, C.woodDark)
  cv.rect(x + 2, y + 3, 2, 50 - y - 3, C.woodDark).rect(x + w - 4, y + 3, 2, 50 - y - 3, C.woodDark)
}

/** A small stool, 8 wide, seat at y 42. */
export function stool(cv: PixelCanvas, x: number): void {
  cv.rect(x, 42, 8, 2, C.woodDark).rect(x + 1, 44, 1, 6, C.woodDark).rect(x + 6, 44, 1, 6, C.woodDark)
}

/** Wooden floorboards from y 50 to the bottom. */
export function woodFloor(
  cv: PixelCanvas,
  width: number,
  height: number,
  board: string = C.wood,
  line: string = C.woodDark,
): void {
  cv.rect(0, 50, width, height - 50, board)
  cv.rect(0, 50, width, 1, line)
  for (let row = 0, y = 54; y < height; row++, y += 5) {
    cv.rect(0, y, width, 1, line)
    for (let x = (row * 13) % 24; x < width; x += 24) cv.rect(x, y + 1, 1, 4, line)
  }
}

/** An old CRT monitor 18x15: coloured case, dark screen, little stand. Screen is at (x+3, y+2) 12x8. */
export function crt(cv: PixelCanvas, x: number, y: number, body: string, shade: string): void {
  cv.rect(x, y, 18, 13, C.deep)
  cv.rect(x + 1, y + 1, 16, 11, body)
  cv.rect(x + 16, y + 1, 1, 11, shade).rect(x + 1, y + 11, 16, 1, shade)
  cv.rect(x + 2, y + 1, 14, 10, C.deep)
  cv.rect(x + 3, y + 2, 12, 8, C.bg)
  cv.rect(x + 6, y + 13, 6, 1, C.deep).rect(x + 4, y + 14, 10, 1, C.deep)
}

/** A flat keyboard 12 wide on a desk whose top is at y. */
export function keyboard(cv: PixelCanvas, x: number, y: number, body: string): void {
  cv.rect(x, y - 2, 12, 2, C.deep).rect(x + 1, y - 2, 10, 1, body)
  for (let i = 1; i < 11; i += 2) cv.pix(x + i, y - 1, C.slate)
}
