// Read/write helpers over the directory tree.

import { dirname, basename } from './path'
import { isDir, type DirNode, type FsNode } from './types'

/** Get the node at an absolute path, or null if it does not exist. */
export function getNode(root: DirNode, absPath: string): FsNode | null {
  const segs = absPath.split('/').filter(Boolean)
  let node: FsNode = root
  for (const seg of segs) {
    if (!isDir(node)) return null
    const next: FsNode | undefined = node.children[seg]
    if (!next) return null
    node = next
  }
  return node
}

/** Get the directory node at an absolute path, or null if missing / not a dir. */
export function getDir(root: DirNode, absPath: string): DirNode | null {
  const node = getNode(root, absPath)
  return isDir(node) ? node : null
}

/** Sorted child names of a directory. */
export function listDir(d: DirNode): string[] {
  return Object.keys(d.children).sort((a, b) => a.localeCompare(b))
}

/**
 * Insert a node at an absolute path. Returns false if the parent is missing
 * or is not a directory. Mutates the tree in place.
 */
export function insertNode(root: DirNode, absPath: string, node: FsNode): boolean {
  const parent = getDir(root, dirname(absPath))
  if (!parent) return false
  parent.children[basename(absPath)] = node
  return true
}
