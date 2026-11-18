import type { ColourPath } from './pixelArt/canvas'
import { type LayerAnim, SCENE_H, SCENE_W } from './pixelArt/scene'
import { SCENES } from './pixelArt/scenes'
import { ROOM_SCENES } from './pixelArt/scenes/break-room'
import { CRASH_SCENES } from './pixelArt/scenes/crash'
import styles from './IntroArt.module.css'

type RenderedScene = {
  label: string
  base: ColourPath[]
  layers: { name: string; anim: LayerAnim; paths: ColourPath[] }[]
}

const ANIM_CLASS: Record<LayerAnim, string> = {
  blink: styles.blink,
  blinkLate: styles.blinkLate,
  slow: styles.slow,
  frame0: styles.frame0,
  frame1: styles.frame1,
  frame2: styles.frame2,
  waddleA: styles.waddleA,
  waddleB: styles.waddleB,
}

// Scenes are drawn once, on first use, then reused.
const cache = new Map<string, RenderedScene>()

function renderScene(sceneId: string): RenderedScene {
  const cached = cache.get(sceneId)
  if (cached) return cached
  const build = SCENES[sceneId] ?? CRASH_SCENES[sceneId] ?? ROOM_SCENES[sceneId] ?? SCENES.unix
  const scene = build()
  const rendered: RenderedScene = {
    label: scene.label,
    base: scene.base.toPaths(),
    layers: scene.layers.map((l) => ({ name: l.name, anim: l.anim, paths: l.canvas.toPaths() })),
  }
  cache.set(sceneId, rendered)
  return rendered
}

function Paths({ paths }: { paths: ColourPath[] }) {
  return paths.map((p) => <path key={p.fill} fill={p.fill} d={p.d} />)
}

/** One intro story scene as 128x72 pixel art, with blinking and waddling layers. */
export function IntroArt({ sceneId }: { sceneId: string }) {
  const scene = renderScene(sceneId)
  return (
    <svg
      className={styles.art}
      viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
      role="img"
      aria-label={scene.label}
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
    >
      <g>
        <Paths paths={scene.base} />
      </g>
      {scene.layers.map((l, i) => (
        <g key={`${l.name}-${i}`} className={ANIM_CLASS[l.anim]}>
          <Paths paths={l.paths} />
        </g>
      ))}
    </svg>
  )
}
