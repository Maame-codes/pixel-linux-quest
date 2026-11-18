// A tiny pixel canvas. Scenes are drawn pixel by pixel on a fixed grid, then
// exported as SVG path data: one path per colour, built from 1px-high runs.

/** Rows of a sprite. Each character is looked up in a Legend. */
export type SpriteRows = readonly string[]

/** Maps sprite characters to colours. Characters not in the legend are transparent. */
export type Legend = Readonly<Record<string, string>>

/** One SVG path: every pixel of one colour. */
export type ColourPath = { fill: string; d: string }

export class PixelCanvas {
  readonly width: number
  readonly height: number
  private readonly px: (string | null)[]

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.px = new Array<string | null>(width * height).fill(null)
  }

  /** Colour at (x, y), or null if empty or off the canvas. */
  get(x: number, y: number): string | null {
    if (!this.inBounds(x, y)) return null
    return this.px[y * this.width + x]
  }

  /** Fill a rectangle. Anything off the canvas is clipped. */
  rect(x: number, y: number, w: number, h: number, colour: string): this {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        if (this.inBounds(xx, yy)) this.px[yy * this.width + xx] = colour
      }
    }
    return this
  }

  /** Set one pixel. */
  pix(x: number, y: number, colour: string): this {
    return this.rect(x, y, 1, 1, colour)
  }

  /** Stamp a text-map sprite with its top-left corner at (x, y). */
  sprite(x: number, y: number, rows: SpriteRows, legend: Legend, flip = false): this {
    rows.forEach((row, j) => {
      const chars = flip ? [...row].reverse() : [...row]
      chars.forEach((ch, i) => {
        const colour = legend[ch]
        if (colour) this.pix(x + i, y + j, colour)
      })
    })
    return this
  }

  /** Copy every filled pixel of another canvas on top of this one. */
  stamp(other: PixelCanvas): this {
    for (let y = 0; y < other.height; y++) {
      for (let x = 0; x < other.width; x++) {
        const c = other.get(x, y)
        if (c) this.pix(x, y, c)
      }
    }
    return this
  }

  /** Export as one path per colour, in order of first appearance (row by row). */
  toPaths(): ColourPath[] {
    const runs = new Map<string, string[]>()
    for (let y = 0; y < this.height; y++) {
      let x = 0
      while (x < this.width) {
        const c = this.px[y * this.width + x]
        if (c === null) {
          x++
          continue
        }
        const start = x
        while (x < this.width && this.px[y * this.width + x] === c) x++
        const len = x - start
        let list = runs.get(c)
        if (!list) {
          list = []
          runs.set(c, list)
        }
        list.push(`M${start} ${y}h${len}v1h-${len}z`)
      }
    }
    return [...runs].map(([fill, parts]) => ({ fill, d: parts.join('') }))
  }

  private inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height
  }
}
