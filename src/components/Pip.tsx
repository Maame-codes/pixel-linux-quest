import styles from './Pip.module.css'

export type PipMood = 'happy' | 'think' | 'cheer'

type Rect = readonly [x: number, y: number, w: number, h: number, fill: string]

// Palette shortcuts for the 16x16 sprite.
const D = '#0f1020' // outline / dark
const W = '#f4f4f4' // body white
const B = '#ef7d57' // beak and feet

// Pip the penguin, pixel for pixel from the design reference.
const SPRITE: readonly Rect[] = [
  [6, 0, 4, 1, D],
  [4, 1, 8, 1, D],
  [3, 2, 10, 1, D],
  [3, 3, 2, 1, D], [5, 3, 2, 1, W], [7, 3, 2, 1, D], [9, 3, 2, 1, W], [11, 3, 2, 1, D],
  [2, 4, 3, 1, D], [5, 4, 1, 1, W], [6, 4, 3, 1, D], [9, 4, 1, 1, W], [10, 4, 4, 1, D],
  [2, 5, 3, 1, D], [5, 5, 2, 1, W], [7, 5, 2, 1, B], [9, 5, 2, 1, W], [11, 5, 3, 1, D],
  [2, 6, 4, 1, D], [6, 6, 4, 1, B], [10, 6, 4, 1, D],
  [1, 7, 3, 1, D], [4, 7, 8, 1, W], [12, 7, 3, 1, D],
  [1, 8, 2, 1, D], [3, 8, 10, 1, W], [13, 8, 2, 1, D],
  [0, 9, 3, 1, D], [3, 9, 10, 1, W], [13, 9, 3, 1, D],
  [0, 10, 2, 1, D], [3, 10, 10, 1, W], [14, 10, 2, 1, D],
  [3, 11, 10, 1, W],
  [3, 12, 1, 1, D], [4, 12, 8, 1, W], [12, 12, 1, 1, D],
  [4, 13, 2, 1, D], [6, 13, 4, 1, W], [10, 13, 2, 1, D],
  [3, 14, 4, 1, B], [9, 14, 4, 1, B],
]

type PipProps = {
  size?: number
  /** Reserved for future expressions; the sprite is the same for now. */
  mood?: PipMood
  title?: string
  className?: string
}

export function Pip({ size = 48, mood = 'happy', title = 'Pip the penguin', className }: PipProps) {
  return (
    <svg
      className={className ? `${styles.pip} ${className}` : styles.pip}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      role="img"
      aria-label={title}
      data-mood={mood}
    >
      {SPRITE.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
    </svg>
  )
}
