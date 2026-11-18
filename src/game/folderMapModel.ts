// The live folder map: a pure model of the filesystem around the learner,
// built from the shell state. No React here, so it is easy to test.

import { getDir, getNode, isDir, listDir, type ShellState } from '../shell'

export type MapNode = {
  name: string
  /** Absolute path. */
  path: string
  kind: 'dir' | 'file'
  /** Pip is standing here (the current directory). */
  current: boolean
  /** A directory whose contents are drawn below it. */
  open: boolean
  children: MapNode[]
  /** How many items in this directory are not drawn ("+N more"). */
  more: number
}

export type FolderMap = {
  root: MapNode
  /** The current directory as an absolute path. */
  cwd: string
  /** The directory Pip stands on in the map (cwd, or its nearest drawn ancestor). */
  pipAt: string
}

export type FolderMapOptions = {
  /** Where the map starts. Defaults to the home directory. */
  root?: string
  /** Most items drawn per folder before "+N more". */
  maxItems?: number
  /** Folders off Pip's path are opened only this many levels below the root. */
  openDepth?: number
  /** The map is never deeper than this many levels below its root. */
  maxDepth?: number
}

const DEFAULTS = { maxItems: 6, openDepth: 2, maxDepth: 4 }

function segments(path: string): string[] {
  return path.split('/').filter(Boolean)
}

function joinPath(parent: string, name: string): string {
  return parent === '/' ? `/${name}` : `${parent}/${name}`
}

function isInside(path: string, dirPath: string): boolean {
  return dirPath === '/' || path === dirPath || path.startsWith(dirPath + '/')
}

/** The deepest folder that contains both paths. */
function commonAncestor(a: string, b: string): string {
  const sa = segments(a)
  const sb = segments(b)
  const out: string[] = []
  for (let i = 0; i < Math.min(sa.length, sb.length) && sa[i] === sb[i]; i++) out.push(sa[i])
  return '/' + out.join('/')
}

/** The deepest folder on `path` that still exists. */
function existingAncestor(state: ShellState, path: string): string {
  const segs = segments(path)
  while (segs.length > 0 && !getDir(state.fs, '/' + segs.join('/'))) segs.pop()
  return '/' + segs.join('/')
}

/**
 * Build the map. It starts at the home directory (or opts.root). If Pip has
 * wandered above it, the map starts higher up so Pip is always on it; if Pip
 * is very deep, it starts lower so it never gets too deep to draw.
 */
export function buildFolderMap(state: ShellState, opts: FolderMapOptions = {}): FolderMap {
  const maxItems = opts.maxItems ?? DEFAULTS.maxItems
  const openDepth = opts.openDepth ?? DEFAULTS.openDepth
  const maxDepth = opts.maxDepth ?? DEFAULTS.maxDepth

  const pipAt = existingAncestor(state, state.cwd)
  let rootPath = existingAncestor(state, opts.root ?? state.home)
  if (!isInside(pipAt, rootPath)) rootPath = commonAncestor(rootPath, pipAt)
  const pipSegs = segments(pipAt)
  const extra = pipSegs.length - segments(rootPath).length - maxDepth
  if (extra > 0) rootPath = '/' + pipSegs.slice(0, segments(rootPath).length + extra).join('/')

  const build = (path: string, name: string, depth: number): MapNode => {
    const node = getNode(state.fs, path)
    const base = { name, path, current: path === pipAt, children: [], more: 0 }
    if (!isDir(node)) return { ...base, kind: 'file', open: false }

    const onPipPath = isInside(pipAt, path)
    const open = depth < maxDepth && (onPipPath || depth < openDepth)
    if (!open) return { ...base, kind: 'dir', open: false }

    const names = listDir(node)
    let shown = names.slice(0, maxItems)
    // The folder Pip is heading into always stays visible.
    const pipChild = names.find((n) => isInside(pipAt, joinPath(path, n)))
    if (pipChild && !shown.includes(pipChild)) shown = [...shown.slice(0, maxItems - 1), pipChild]
    return {
      ...base,
      kind: 'dir',
      open: true,
      children: shown.map((n) => build(joinPath(path, n), n, depth + 1)),
      more: names.length - shown.length,
    }
  }

  return { root: build(rootPath, rootPath, 0), cwd: state.cwd, pipAt }
}

// ---- Drawing helpers ------------------------------------------------------

export type MapRow =
  | {
      kind: 'dir' | 'file'
      key: string
      name: string
      path: string
      depth: number
      current: boolean
      open: boolean
      /** For each level above: does a line carry on down past this row? */
      guides: boolean[]
      /** Last item in its folder (draws └ instead of ├). */
      last: boolean
    }
  | { kind: 'more'; key: string; count: number; depth: number; guides: boolean[]; last: true }

/** Flatten the tree into rows, top to bottom, with what each row needs to draw its lines. */
export function flattenFolderMap(map: FolderMap): MapRow[] {
  const rows: MapRow[] = []
  const walk = (node: MapNode, depth: number, guides: boolean[], last: boolean) => {
    rows.push({
      kind: node.kind,
      key: node.path,
      name: node.name,
      path: node.path,
      depth,
      current: node.current,
      open: node.open,
      guides,
      last,
    })
    const childGuides = depth === 0 ? [] : [...guides, !last]
    node.children.forEach((child, i) => {
      const isLast = i === node.children.length - 1 && node.more === 0
      walk(child, depth + 1, childGuides, isLast)
    })
    if (node.more > 0) {
      rows.push({
        kind: 'more',
        key: `${node.path}/+more`,
        count: node.more,
        depth: depth + 1,
        guides: childGuides,
        last: true,
      })
    }
  }
  walk(map.root, 0, [], true)
  return rows
}

/** Every path drawn on the map. */
export function mapPaths(map: FolderMap): Set<string> {
  const out = new Set<string>()
  const walk = (n: MapNode) => {
    out.add(n.path)
    n.children.forEach(walk)
  }
  walk(map.root)
  return out
}

/** Paths drawn on `next` that were not on `prev`: the ones that pop in. */
export function newPaths(prev: FolderMap | null, next: FolderMap): Set<string> {
  if (!prev) return new Set()
  const before = mapPaths(prev)
  return new Set([...mapPaths(next)].filter((p) => !before.has(p)))
}

/** Plain-text outline of the map for screen readers, one line per item. */
export function describeFolderMap(map: FolderMap): string[] {
  const lines: string[] = []
  const walk = (n: MapNode, parent: string | null) => {
    const kind = n.kind === 'dir' ? 'folder' : 'file'
    const where = parent ? `, in ${parent}` : ''
    const here = n.current ? ' (you are here)' : ''
    lines.push(`${n.name}, ${kind}${where}${here}`)
    n.children.forEach((c) => walk(c, n.name))
    if (n.more > 0) lines.push(`and ${n.more} more in ${n.name}`)
  }
  walk(map.root, null)
  return lines
}
