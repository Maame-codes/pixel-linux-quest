import { PixelCanvas } from './canvas'
import { PIP, PIP_LEGEND, PIP_STEP } from './sprites'

export const SCENE_W = 128
export const SCENE_H = 72

/**
 * How an overlay layer animates. Every animation uses CSS steps() so pixels
 * snap on and off, and all of them stop under prefers-reduced-motion.
 *
 * - blink / blinkLate: 1.2s on-off, the late one is the opposite half.
 * - slow: 2.4s on-off.
 * - frame0..2: a three-frame loop (1.8s), one frame visible at a time.
 * - waddleA / waddleB: Pip's two walking frames (0.8s).
 *
 * With reduced motion, blink, slow, frame0 and waddleA stay visible as a
 * still picture; the others are hidden.
 */
export type LayerAnim =
  | 'blink'
  | 'blinkLate'
  | 'slow'
  | 'frame0'
  | 'frame1'
  | 'frame2'
  | 'waddleA'
  | 'waddleB'

export type SceneLayer = { name: string; anim: LayerAnim; canvas: PixelCanvas }

export type PixelScene = {
  /** Text alternative for the whole picture. */
  label: string
  base: PixelCanvas
  layers: SceneLayer[]
}

/** Shown when reduced motion freezes the picture. */
export const STILL_ANIMS: ReadonlySet<LayerAnim> = new Set(['blink', 'slow', 'frame0', 'waddleA'])

/** Collects a base drawing and its animated overlay layers. */
export class SceneBuilder {
  readonly base = new PixelCanvas(SCENE_W, SCENE_H)
  private readonly layers: SceneLayer[] = []

  /** A new transparent overlay layer, drawn above the base in creation order. */
  layer(name: string, anim: LayerAnim): PixelCanvas {
    const canvas = new PixelCanvas(SCENE_W, SCENE_H)
    this.layers.push({ name, anim, canvas })
    return canvas
  }

  /** Pip waddling with feet at y + 15. The step frame is 1px higher. */
  pip(x: number, y: number, flip = false): void {
    this.layer('pipA', 'waddleA').sprite(x, y, PIP, PIP_LEGEND, flip)
    this.layer('pipB', 'waddleB').sprite(x, y - 1, PIP_STEP, PIP_LEGEND, flip)
  }

  build(label: string): PixelScene {
    return { label, base: this.base, layers: this.layers }
  }
}

/** Flatten a scene to one canvas as it looks when frozen (reduced motion). */
export function stillFrame(scene: PixelScene): PixelCanvas {
  const out = new PixelCanvas(SCENE_W, SCENE_H).stamp(scene.base)
  for (const l of scene.layers) if (STILL_ANIMS.has(l.anim)) out.stamp(l.canvas)
  return out
}
