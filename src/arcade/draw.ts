import type { SpriteRows } from '../game/pixelArt/canvas'
import { glyphRows } from '../game/pixelArt/font'

// Canvas helpers so the games can use the same text-map sprites and pixel
// font as the rest of the site.

/** Draw a text-map sprite at (x, y), one canvas pixel per character. */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rows: SpriteRows,
  legend: Readonly<Record<string, string>>,
): void {
  rows.forEach((row, j) => {
    let i = 0
    while (i < row.length) {
      const colour = legend[row[i]]
      if (!colour) {
        i++
        continue
      }
      // Draw runs of the same colour as one rectangle.
      let end = i + 1
      while (end < row.length && row[end] === row[i]) end++
      ctx.fillStyle = colour
      ctx.fillRect(Math.round(x) + i, Math.round(y) + j, end - i, 1)
      i = end
    }
  })
}

/** Draw text with the 5px pixel font. Unknown characters are skipped. */
export function drawPixelText(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, colour: string): void {
  let cx = x
  for (const ch of text) {
    const rows = glyphRows(ch)
    if (!rows) {
      cx += 4
      continue
    }
    drawSprite(ctx, cx, y, rows, { '#': colour })
    cx += rows[0].length + 1
  }
}

/** Width in pixels of text drawn with drawPixelText. */
export function pixelTextWidth(text: string): number {
  let w = 0
  for (const ch of text) w += (glyphRows(ch)?.[0].length ?? 3) + 1
  return Math.max(0, w - 1)
}
