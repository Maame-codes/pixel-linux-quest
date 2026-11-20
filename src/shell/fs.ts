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

/** Join a directory path and a name ("/" + "a" -> "/a", "/x" + "a" -> "/x/a"). */
export function joinPath(dirPath: string, name: string): string {
  return dirPath === '/' ? `/${name}` : `${dirPath}/${name}`
}

/** Join what the user typed and a name, the way GNU tools show it ("dir/" + "a" -> "dir/a"). */
export function joinShown(typed: string, name: string): string {
  return typed.endsWith('/') ? `${typed}${name}` : `${typed}/${name}`
}

/**
 * The lines of a text file, without the newline at the end. A file's text
 * is taken to end with a newline (as text files normally do), so "a\nb"
 * and "a\nb\n" are both two lines. An empty file has none.
 */
export function fileLines(content: string): string[] {
  if (content === '') return []
  return content.replace(/\n$/, '').split('\n')
}

/** The size of a file in bytes (UTF-8), counting the newline at the end. */
export function fileBytes(content: string): number {
  if (content === '') return 0
  const bytes = new TextEncoder().encode(content).length
  return content.endsWith('\n') ? bytes : bytes + 1
}
