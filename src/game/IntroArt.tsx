import styles from './IntroArt.module.css'

// Simple pixel scenes drawn on a 32x18 grid, one per intro scene.
type Rect = readonly [x: number, y: number, w: number, h: number, fill: string]

const P = {
  bg: '#1a1c2c',
  deep: '#0f1020',
  panel: '#333c57',
  panel2: '#29366f',
  blue: '#3b5dc9',
  sky: '#41a6f6',
  cyan: '#73eff7',
  white: '#f4f4f4',
  soft: '#c5d2db',
  grey: '#94b0c2',
  slate: '#566c86',
  yellow: '#ffcd75',
  orange: '#ef7d57',
  lime: '#a7f070',
  green: '#38b764',
}

const SCENES: Record<string, Rect[]> = {
  // 1969 Bell Labs: a computer cabinet and two engineers at night.
  unix: [
    [0, 0, 32, 18, P.deep],
    [2, 2, 1, 1, P.white],
    [28, 3, 1, 1, P.white],
    [16, 1, 1, 1, P.soft],
    [0, 15, 32, 3, P.slate],
    [4, 6, 8, 9, P.panel],
    [5, 7, 6, 3, P.cyan],
    [5, 11, 1, 1, P.orange],
    [7, 11, 1, 1, P.lime],
    [9, 11, 1, 1, P.yellow],
    [20, 8, 2, 2, P.white],
    [20, 10, 2, 4, P.blue],
    [24, 8, 2, 2, P.white],
    [24, 10, 2, 4, P.orange],
  ],
  // Unix spreads: many monitors, loosely linked, at different heights.
  spread: [
    [0, 0, 32, 18, P.bg],
    [0, 16, 32, 2, P.slate],
    [2, 9, 5, 4, P.panel],
    [3, 10, 3, 2, P.cyan],
    [10, 7, 5, 4, P.panel],
    [11, 8, 3, 2, P.sky],
    [18, 10, 5, 4, P.panel],
    [19, 11, 3, 2, P.cyan],
    [25, 7, 5, 4, P.panel],
    [26, 8, 3, 2, P.sky],
    [7, 11, 3, 1, P.grey],
    [15, 9, 3, 1, P.grey],
    [23, 11, 2, 1, P.grey],
  ],
  // GNU: a wall of free tools with one slot (the kernel) still missing.
  gnu: [
    [0, 0, 32, 18, P.bg],
    [0, 16, 32, 2, P.slate],
    [9, 4, 4, 3, P.lime],
    [14, 4, 4, 3, P.green],
    [19, 4, 4, 3, P.lime],
    [9, 8, 4, 3, P.green],
    [14, 8, 4, 3, P.lime],
    [19, 8, 4, 3, P.green],
    [9, 12, 4, 3, P.lime],
    [13, 11, 6, 5, P.yellow],
    [14, 12, 4, 3, P.deep],
    [19, 12, 4, 3, P.green],
  ],
  // 1991 Linus: a desk, a monitor full of code, and a tiny egg.
  linus: [
    [0, 0, 32, 18, P.bg],
    [0, 15, 32, 3, P.slate],
    [6, 13, 20, 2, P.panel],
    [9, 4, 8, 7, P.panel],
    [10, 5, 6, 5, P.deep],
    [11, 6, 4, 1, P.lime],
    [11, 7, 3, 1, P.lime],
    [11, 8, 2, 1, P.lime],
    [20, 7, 2, 2, P.white],
    [19, 9, 4, 4, P.panel2],
    [24, 11, 2, 2, P.white],
  ],
  // 1992 GPL: two halves click together, a penguin, distros appear.
  gpl: [
    [0, 0, 32, 18, P.bg],
    [0, 16, 32, 2, P.slate],
    [5, 7, 6, 6, P.green],
    [13, 7, 6, 6, P.lime],
    [11, 8, 2, 1, P.yellow],
    [11, 11, 2, 1, P.yellow],
    [22, 7, 4, 6, P.white],
    [23, 8, 1, 1, P.deep],
    [24, 8, 1, 1, P.deep],
    [23, 10, 2, 1, P.orange],
    [22, 13, 1, 1, P.orange],
    [25, 13, 1, 1, P.orange],
    [3, 15, 2, 1, P.orange],
    [7, 15, 2, 1, P.sky],
    [11, 15, 2, 1, P.yellow],
  ],
  // Today: a cloud, a server rack, a phone, a little globe.
  today: [
    [0, 0, 32, 18, P.bg],
    [0, 16, 32, 2, P.slate],
    [3, 3, 8, 2, P.white],
    [4, 2, 6, 1, P.white],
    [14, 4, 5, 10, P.panel],
    [15, 5, 3, 1, P.cyan],
    [15, 7, 3, 1, P.cyan],
    [15, 9, 3, 1, P.lime],
    [15, 11, 3, 1, P.lime],
    [23, 6, 4, 8, P.panel],
    [24, 7, 2, 5, P.sky],
    [6, 9, 6, 6, P.green],
    [7, 10, 2, 1, P.cyan],
    [9, 12, 2, 1, P.cyan],
  ],
  // Your turn: Pip with a flag, a path, a far-off castle under the sun.
  'your-turn': [
    [0, 0, 32, 12, P.sky],
    [0, 12, 32, 6, P.green],
    [27, 1, 3, 3, P.yellow],
    [14, 12, 4, 6, P.slate],
    [6, 6, 5, 7, P.white],
    [7, 7, 1, 1, P.deep],
    [9, 7, 1, 1, P.deep],
    [8, 8, 1, 1, P.orange],
    [6, 13, 2, 1, P.orange],
    [9, 13, 2, 1, P.orange],
    [12, 3, 1, 6, P.slate],
    [13, 3, 3, 2, P.yellow],
    [23, 6, 6, 6, P.panel],
    [22, 5, 1, 1, P.panel],
    [29, 5, 1, 1, P.panel],
    [25, 3, 1, 2, P.orange],
  ],
}

export function IntroArt({ sceneId }: { sceneId: string }) {
  const rects = SCENES[sceneId] ?? SCENES.unix
  return (
    <svg
      className={styles.art}
      viewBox="0 0 32 18"
      role="img"
      aria-label="Pixel art illustrating the story"
      preserveAspectRatio="xMidYMid slice"
    >
      {rects.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
    </svg>
  )
}
