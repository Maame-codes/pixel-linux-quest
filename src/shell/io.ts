// Reading files and making new ones, with permission checks, for commands.

import { dirname } from './path'
import { canChangeDir, lookup, permits, type Errno } from './perm'
import { isDir, type DirNode, type ShellState } from './types'

export type ReadResult = { ok: true; content: string } | { ok: false; errno: Errno }

/** Open a file for reading: it must exist, be readable by the user, and not be a directory. */
export function readText(state: ShellState, abs: string): ReadResult {
  const found = lookup(state, abs)
  if (found.error) return { ok: false, errno: found.error }
  if (!permits(state, abs, found.node, 'r')) return { ok: false, errno: 'EACCES' }
  if (isDir(found.node)) return { ok: false, errno: 'EISDIR' }
  return { ok: true, content: found.node.content }
}

export type ParentResult = { ok: true; dir: DirNode; abs: string } | { ok: false; errno: Errno }

/** The directory a new name would go in, if the user may add names to it. */
export function writableParent(state: ShellState, abs: string): ParentResult {
  const parentAbs = dirname(abs)
  const found = lookup(state, parentAbs)
  if (found.error) return { ok: false, errno: found.error }
  if (!isDir(found.node)) return { ok: false, errno: 'ENOTDIR' }
  if (!canChangeDir(state, parentAbs, found.node)) return { ok: false, errno: 'EACCES' }
  return { ok: true, dir: found.node, abs: parentAbs }
}
