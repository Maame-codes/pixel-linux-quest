import { describe, expect, it } from 'vitest'

import { PixelCanvas } from './canvas'
import { drawText, textWidth } from './font'

describe('PixelCanvas', () => {
  it('fills rectangles and clips anything off the canvas', () => {
    const cv = new PixelCanvas(4, 3).rect(2, 1, 5, 5, '#fff')
    expect(cv.get(2, 1)).toBe('#fff')
    expect(cv.get(3, 2)).toBe('#fff')
    expect(cv.get(1, 1)).toBeNull()
    expect(cv.get(4, 1)).toBeNull()
  })

  it('stamps sprites from a text map, skipping characters not in the legend', () => {
    const cv = new PixelCanvas(4, 2).sprite(0, 0, ['ab.', '.a?'], { a: '#111', b: '#222' })
    expect(cv.get(0, 0)).toBe('#111')
    expect(cv.get(1, 0)).toBe('#222')
    expect(cv.get(2, 0)).toBeNull()
    expect(cv.get(1, 1)).toBe('#111')
    expect(cv.get(2, 1)).toBeNull()
  })

  it('can mirror a sprite', () => {
    const cv = new PixelCanvas(3, 1).sprite(0, 0, ['a..'], { a: '#111' }, true)
    expect(cv.get(2, 0)).toBe('#111')
    expect(cv.get(0, 0)).toBeNull()
  })

  it('exports one path per colour, made of horizontal runs', () => {
    const cv = new PixelCanvas(4, 2).rect(0, 0, 3, 1, '#aaa').pix(3, 0, '#bbb').pix(1, 1, '#aaa')
    expect(cv.toPaths()).toEqual([
      { fill: '#aaa', d: 'M0 0h3v1h-3zM1 1h1v1h-1z' },
      { fill: '#bbb', d: 'M3 0h1v1h-1z' },
    ])
  })

  it('stamps one canvas on top of another', () => {
    const top = new PixelCanvas(2, 1).pix(1, 0, '#bbb')
    const cv = new PixelCanvas(2, 1).rect(0, 0, 2, 1, '#aaa').stamp(top)
    expect(cv.get(0, 0)).toBe('#aaa')
    expect(cv.get(1, 0)).toBe('#bbb')
  })
})

describe('pixel font', () => {
  it('draws digits 3px wide with a 1px gap', () => {
    const cv = new PixelCanvas(8, 5)
    expect(drawText(cv, 0, 0, '11', '#000')).toBe(8)
    expect(cv.get(1, 0)).toBe('#000')
    expect(cv.get(5, 0)).toBe('#000')
  })

  it('measures variable-width text', () => {
    expect(textWidth('KERNEL')).toBe(24)
    expect(textWidth('')).toBe(0)
  })

  it('refuses characters it has no glyph for', () => {
    expect(() => drawText(new PixelCanvas(4, 5), 0, 0, '@', '#000')).toThrow()
  })
})
