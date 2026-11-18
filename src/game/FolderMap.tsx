import { useMemo, useState, type CSSProperties } from 'react'

import { Pip } from '../components/Pip'
import type { ShellState } from '../shell'
import { PixelCanvas, type SpriteRows } from './pixelArt/canvas'
import { C } from './pixelArt/palette'
import {
  buildFolderMap,
  describeFolderMap,
  flattenFolderMap,
  newPaths,
  type FolderMap as FolderMapModel,
  type FolderMapOptions,
  type MapRow,
} from './folderMapModel'
import styles from './FolderMap.module.css'

// Layout in CSS pixels. Icons are drawn at 2x, Pip at 1.5x.
const ROW_H = 34
const INDENT = 40
const GUTTER = 28
const ICON_W = 32
const PIP_SIZE = 24

const FOLDER: SpriteRows = [
  '.KKKKK..........',
  'KTTTTTK.........',
  'KTTTTTTKKKKKKKK.',
  'KLLLLLLLLLLLLLLK',
  'KFFFFFFFFFFFFFFK',
  'KFFFFFFFFFFFFFFK',
  'KFFFFFFFFFFFFFFK',
  'KFFFFFFFFFFFFFFK',
  'KFFFFFFFFFFFFFFK',
  'KFFFFFFFFFFFFFFK',
  'KFFFFFFFFFFFFFFK',
  'KDDDDDDDDDDDDDDK',
  '.KKKKKKKKKKKKKK.',
]

const FOLDER_OPEN: SpriteRows = [
  '.KKKKK..........',
  'KTTTTTK.........',
  'KTTTTTTKKKKKKKK.',
  'KTTKWWWWWWWWWKTK',
  'KTTKWSSSSSSSWKTK',
  'KKKKKKKKKKKKKKKK',
  'KLLLLLLLLLLLLLLK',
  'KFFFFFFFFFFFFFFK',
  'KFFFFFFFFFFFFFFK',
  'KFFFFFFFFFFFFFFK',
  'KFFFFFFFFFFFFFFK',
  'KDDDDDDDDDDDDDDK',
  '.KKKKKKKKKKKKKK.',
]

const FILE: SpriteRows = [
  'KKKKKKK...',
  'KWWWWWKK..',
  'KWWWWWKWK.',
  'KWWWWWKKKK',
  'KWSSSSSSWK',
  'KWWWWWWWWK',
  'KWSSSSSSWK',
  'KWWWWWWWWK',
  'KWSSSSWWWK',
  'KWWWWWWWWK',
  'KKKKKKKKKK',
]

const FOLDER_COLOURS = { K: C.deep, T: C.blue, L: C.cyan, F: C.sky, D: C.blue, W: C.white, S: C.grey }
const HERE_COLOURS = { K: C.deep, T: C.orange, L: C.white, F: C.yellow, D: C.orange, W: C.white, S: C.grey }
const FILE_COLOURS = { K: C.deep, W: C.white, S: C.grey }

type IconKind = 'folder' | 'folderOpen' | 'folderHere' | 'folderOpenHere' | 'file'

// Icons are drawn once with the same pixel helper as the intro scenes.
const ICONS: Record<IconKind, { w: number; h: number; paths: { fill: string; d: string }[] }> = (() => {
  const draw = (rows: SpriteRows, legend: Record<string, string>) => {
    const cv = new PixelCanvas(rows[0].length, rows.length)
    cv.sprite(0, 0, rows, legend)
    return { w: rows[0].length, h: rows.length, paths: cv.toPaths() }
  }
  return {
    folder: draw(FOLDER, FOLDER_COLOURS),
    folderOpen: draw(FOLDER_OPEN, FOLDER_COLOURS),
    folderHere: draw(FOLDER, HERE_COLOURS),
    folderOpenHere: draw(FOLDER_OPEN, HERE_COLOURS),
    file: draw(FILE, FILE_COLOURS),
  }
})()

function Icon({ kind }: { kind: IconKind }) {
  const icon = ICONS[kind]
  return (
    <svg
      className={styles.icon}
      width={icon.w * 2}
      height={icon.h * 2}
      viewBox={`0 0 ${icon.w} ${icon.h}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {icon.paths.map((p) => (
        <path key={p.fill} fill={p.fill} d={p.d} />
      ))}
    </svg>
  )
}

function iconFor(row: Extract<MapRow, { kind: 'dir' | 'file' }>): IconKind {
  if (row.kind === 'file') return 'file'
  if (row.current) return row.open ? 'folderOpenHere' : 'folderHere'
  return row.open ? 'folderOpen' : 'folder'
}

/** The tree lines in front of a row: carried-on verticals, then the ├ or └ elbow. */
function Lines({ row }: { row: MapRow }) {
  if (row.depth === 0) return null
  const cell = row.depth - 1
  return (
    <>
      {row.guides.map((on, k) =>
        on ? <span key={k} className={styles.vline} style={{ left: GUTTER + k * INDENT + 15 }} /> : null,
      )}
      <span
        className={`${styles.vline} ${row.last ? styles.vlineHalf : ''}`}
        style={{ left: GUTTER + cell * INDENT + 15 }}
      />
      <span
        className={styles.hline}
        style={{ left: GUTTER + cell * INDENT + 15, width: INDENT - 15 }}
      />
    </>
  )
}

type FolderMapProps = {
  state: ShellState
  options?: FolderMapOptions
  /** The sandbox's collapse: rows tumble down and Pip panics. */
  collapsing?: boolean
  className?: string
}

/** A pixel-art map of the folders around the learner, with Pip standing in the current one. */
export function FolderMap({ state, options, collapsing = false, className }: FolderMapProps) {
  const map = useMemo(() => buildFolderMap(state, options), [state, options])

  // Remember the previous map to know what just appeared and where Pip came from.
  const [track, setTrack] = useState<{ map: FolderMapModel; fresh: Set<string>; announce: string }>(
    () => ({ map, fresh: new Set(), announce: '' }),
  )
  if (track.map !== map) {
    const moved = track.map.cwd !== map.cwd
    setTrack({
      map,
      fresh: newPaths(track.map, map),
      announce: moved ? `You are in ${map.cwd}` : track.announce,
    })
  }

  const rows = flattenFolderMap(map)
  const pipIndex = Math.max(
    0,
    rows.findIndex((r) => r.kind !== 'more' && r.path === map.pipAt),
  )
  const pipRow = rows[pipIndex]
  const pipStyle: CSSProperties = {
    transform: `translate(${GUTTER + pipRow.depth * INDENT - PIP_SIZE - 2}px, ${
      pipIndex * ROW_H + (ROW_H - PIP_SIZE) / 2 - 3
    }px)`,
  }
  const outline = describeFolderMap(map)

  return (
    <section className={[styles.map, className].filter(Boolean).join(' ')} aria-labelledby="folder-map-title">
      <div className={styles.head}>
        <h2 id="folder-map-title" className={styles.title}>
          MAP
        </h2>
        <span className={styles.where}>{map.cwd}</span>
      </div>

      <div
        className={`${styles.rows} ${collapsing ? styles.collapsing : ''}`}
        style={{ height: rows.length * ROW_H }}
        aria-hidden="true"
      >
        {rows.map((row, i) => {
          const fresh = row.kind !== 'more' && track.fresh.has(row.path)
          const style = { top: i * ROW_H, height: ROW_H, '--i': i } as CSSProperties
          const x = GUTTER + row.depth * INDENT
          return (
            <div key={row.key} className={`${styles.row} ${fresh ? styles.pop : ''}`} style={style}>
              <Lines row={row} />
              {row.kind === 'more' ? (
                <span className={styles.more} style={{ left: x + 6 }}>
                  +{row.count} more
                </span>
              ) : (
                <>
                  <span className={styles.iconSlot} style={{ left: x }}>
                    <Icon kind={iconFor(row)} />
                  </span>
                  <span
                    className={`${styles.name} ${row.current ? styles.here : ''} ${
                      row.kind === 'dir' ? styles.dirName : ''
                    }`}
                    style={{ left: x + ICON_W + 8, maxWidth: `calc(100% - ${x + ICON_W + 8}px)` }}
                  >
                    {row.name}
                  </span>
                </>
              )}
            </div>
          )
        })}
        <div className={`${styles.pip} ${collapsing ? styles.panic : ''}`} style={pipStyle}>
          <Pip size={PIP_SIZE} title="" />
        </div>
      </div>

      <ul className="sr-only">
        {outline.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        {track.announce}
      </p>
    </section>
  )
}
