import type { PixelCanvas, SpriteRows } from '../canvas'
import { C } from '../palette'

// The big jigsaw of free tools used in scenes 3 (piece missing) and 5 (complete).
// 4 columns x 3 rows of 13x10 pieces, joined with little jigsaw tabs.

export const PUZZLE_COLS = 4
export const PUZZLE_ROWS = 3
export const PIECE_W = 13
export const PIECE_H = 10
export const PUZZLE_W = PUZZLE_COLS * PIECE_W
export const PUZZLE_H = PUZZLE_ROWS * PIECE_H

/** The missing piece: top row, third column. */
export const KERNEL_COL = 2
export const KERNEL_ROW = 0

// 5x5 tool icons, one per piece (row by row). The kernel slot has its own.
const ICONS: readonly SpriteRows[] = [
  ['#....', '.#...', '..#..', '.#...', '#.###'], // shell prompt
  ['...##', '..###', '.###.', '###..', '##...'], // pencil: text editor
  ['', '', '', '', ''], // kernel slot, drawn separately
  ['.#.#.', '#####', '##.##', '#####', '.#.#.'], // gear: compiler
  ['#####', '##.##', '#.#.#', '#...#', '#####'], // envelope: mail
  ['.##..', '#..#.', '#..#.', '.###.', '....#'], // magnifier: search
  ['##...', '#####', '#...#', '#...#', '#####'], // folder: file tools
  ['#####', '#.#.#', '#####', '#.#.#', '#####'], // calculator
  ['#...#', '.#.#.', '..#..', '##.##', '##.##'], // scissors: text cutting
  ['.###.', '#...#', '#...#', '#####', '.###.'], // drum: archives
  ['..###', '..#.#', '..#.#', '##.##', '##.##'], // music note
  ['##.##', '#.#.#', '#.#.#', '#.#.#', '##.##'], // open book: manuals
]

/** The kernel piece's icon: a little chip. */
export const KERNEL_ICON: SpriteRows = ['#.#.#', '#####', '##.##', '#####', '#.#.#']

const PIECE_COLOURS = [C.lime, C.sky, C.yellow, C.orange, C.cyan, C.green]

export function pieceColour(col: number, row: number): string {
  return PIECE_COLOURS[(col + row * 3) % PIECE_COLOURS.length]
}

type PuzzleOptions = {
  /** Leave the kernel slot as an empty hole. */
  missingKernel: boolean
  /** Colour of the kernel piece when it is in place. */
  kernelColour?: string
}

/** Draw the puzzle with its top-left at (x, y). */
export function drawPuzzle(cv: PixelCanvas, x: number, y: number, opts: PuzzleOptions): void {
  const isHole = (col: number, row: number) =>
    opts.missingKernel && col === KERNEL_COL && row === KERNEL_ROW
  const colourOf = (col: number, row: number) =>
    col === KERNEL_COL && row === KERNEL_ROW ? (opts.kernelColour ?? C.white) : pieceColour(col, row)

  // Frame, then the dark gaps the pieces sit in.
  cv.rect(x - 2, y - 2, PUZZLE_W + 3, PUZZLE_H + 3, C.deep)

  for (let row = 0; row < PUZZLE_ROWS; row++) {
    for (let col = 0; col < PUZZLE_COLS; col++) {
      const px = x + col * PIECE_W
      const py = y + row * PIECE_H
      if (isHole(col, row)) {
        cv.rect(px, py, PIECE_W - 1, PIECE_H - 1, C.bg)
        continue
      }
      const colour = colourOf(col, row)
      cv.rect(px, py, PIECE_W - 1, PIECE_H - 1, colour)
      cv.rect(px, py, PIECE_W - 1, 1, C.white)
      const icon = col === KERNEL_COL && row === KERNEL_ROW ? KERNEL_ICON : ICONS[row * PUZZLE_COLS + col]
      cv.sprite(px + 4, py + 2, icon, { '#': C.deep })
    }
  }

  // Tabs: each piece pokes a 3x3 knob into its right and lower neighbours,
  // alternating so the puzzle looks interlocked.
  for (let row = 0; row < PUZZLE_ROWS; row++) {
    for (let col = 0; col < PUZZLE_COLS; col++) {
      const px = x + col * PIECE_W
      const py = y + row * PIECE_H
      if (col < PUZZLE_COLS - 1) {
        const flip = (col + row) % 2 === 1
        const fromCol = flip ? col + 1 : col
        const knobX = flip ? px + PIECE_W - 3 : px + PIECE_W - 1
        tab(cv, knobX, py + 3, 3, 3, fromCol, row)
      }
      if (row < PUZZLE_ROWS - 1) {
        const flip = (col + row) % 2 === 0
        const fromRow = flip ? row + 1 : row
        const knobY = flip ? py + PIECE_H - 3 : py + PIECE_H - 1
        tab(cv, px + 5, knobY, 3, 3, col, fromRow)
      }
    }
  }

  // A knob from the missing piece leaves an empty notch in its neighbour;
  // a neighbour's knob still sticks into the empty slot.
  function tab(c: PixelCanvas, tx: number, ty: number, w: number, h: number, fromCol: number, fromRow: number) {
    c.rect(tx, ty, w, h, isHole(fromCol, fromRow) ? C.bg : colourOf(fromCol, fromRow))
  }
}

/** Top-left pixel of the kernel slot for a puzzle drawn at (x, y). */
export function kernelSlot(x: number, y: number): { x: number; y: number } {
  return { x: x + KERNEL_COL * PIECE_W, y: y + KERNEL_ROW * PIECE_H }
}
