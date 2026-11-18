import type { PixelCanvas, SpriteRows } from './canvas'

// A small 5px-tall pixel font for the few words and numbers painted into
// scenes. Most glyphs are 3px wide; N is 4px so it does not read as "n".
const GLYPHS: Readonly<Record<string, SpriteRows>> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['###', '..#', '###', '#..', '###'],
  '3': ['###', '..#', '.##', '..#', '###'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '###', '..#', '###'],
  '6': ['###', '#..', '###', '#.#', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '###'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  E: ['###', '#..', '##.', '#..', '###'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  '?': ['##.', '..#', '.#.', '...', '.#.'],
  '!': ['.#.', '.#.', '.#.', '...', '.#.'],
  '>': ['#..', '.#.', '..#', '.#.', '#..'],
  ':': ['.', '#', '.', '#', '.'],
  _: ['...', '...', '...', '...', '###'],
  ' ': ['...', '...', '...', '...', '...'],
}

/** Paint text, with 1px between glyphs. Returns the x just after the last glyph's gap. */
export function drawText(cv: PixelCanvas, x: number, y: number, text: string, colour: string): number {
  let cx = x
  for (const ch of text) {
    const glyph = GLYPHS[ch]
    if (!glyph) throw new Error(`pixel font has no glyph for "${ch}"`)
    cv.sprite(cx, y, glyph, { '#': colour })
    cx += glyph[0].length + 1
  }
  return cx
}

/** Width in pixels of a string drawn with drawText (no trailing gap). */
export function textWidth(text: string): number {
  let w = 0
  for (const ch of text) w += (GLYPHS[ch]?.[0].length ?? 3) + 1
  return Math.max(0, w - 1)
}

/** The rows for one glyph, or null if the font has no such character. */
export function glyphRows(ch: string): SpriteRows | null {
  return GLYPHS[ch] ?? null
}
