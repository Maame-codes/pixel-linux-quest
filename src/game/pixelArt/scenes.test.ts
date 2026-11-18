import { describe, expect, it } from 'vitest'

import referenceSvg from '../../../design-reference/intro-scene-1969.svg?raw'
import { INTRO_SCENES } from '../../content/intro'
import type { PixelCanvas } from './canvas'
import { SCENE_H, SCENE_W, stillFrame } from './scene'
import { SCENES } from './scenes'
import { CRASH_SCENES } from './scenes/crash'

function pathsText(cv: PixelCanvas): string {
  return cv
    .toPaths()
    .map((p) => `${p.fill}|${p.d}`)
    .join('\n')
}

function referenceLayers(svg: string): Map<string, string> {
  const layers = new Map<string, string>()
  for (const g of svg.matchAll(/<g id="([^"]+)"[^>]*>(.*?)<\/g>/g)) {
    const paths = [...g[2].matchAll(/<path fill="([^"]+)" d="([^"]+)"/g)].map((p) => `${p[1]}|${p[2]}`)
    layers.set(g[1], paths.join('\n'))
  }
  return layers
}

describe('intro scenes', () => {
  it('has a scene for every intro story step', () => {
    for (const step of INTRO_SCENES) expect(SCENES[step.id], step.id).toBeDefined()
  })

  it('scene 1 matches the 1969 reference art pixel for pixel', () => {
    const ref = referenceLayers(referenceSvg)
    const scene = SCENES.unix()
    expect(pathsText(scene.base)).toBe(ref.get('base'))
    for (const name of ['stars', 'lightsA', 'lightsB', 'reelA', 'reelB', 'scopeB', 'cursor']) {
      const layer = scene.layers.find((l) => l.name === name)
      expect(layer, name).toBeDefined()
      expect(pathsText(layer!.canvas), name).toBe(ref.get(name))
    }
  })

  for (const [id, build] of Object.entries({ ...SCENES, ...CRASH_SCENES })) {
    describe(id, () => {
      const scene = build()

      it('fills the whole 128x72 frame', () => {
        const still = stillFrame(scene)
        for (let y = 0; y < SCENE_H; y++) {
          for (let x = 0; x < SCENE_W; x++) expect(still.get(x, y), `${x},${y}`).not.toBeNull()
        }
      })

      it('has Pip waddling in two frames', () => {
        const anims = scene.layers.map((l) => l.anim)
        expect(anims).toContain('waddleA')
        expect(anims).toContain('waddleB')
      })

      it('has something else animated too', () => {
        expect(scene.layers.filter((l) => !l.anim.startsWith('waddle')).length).toBeGreaterThan(0)
      })

      it('describes itself for screen readers', () => {
        expect(scene.label.length).toBeGreaterThan(20)
      })
    })
  }
})
