// Owners, groups and rwx permission bits, checked the way the Linux kernel
// does for a normal user. root (the user while a command runs under sudo)
// may read and write anything.

import { basename } from './path'
import { isDir, type DirNode, type FileNode, type FsNode, type NodeMeta, type ShellState } from './types'

/** The usual umask: new files get 644 and new directories 755. */
export const UMASK = 0o022
export const FILE_MODE = 0o666 & ~UMASK
export const DIR_MODE = 0o777 & ~UMASK

export type Errno = 'ENOENT' | 'EACCES' | 'ENOTDIR' | 'EISDIR' | 'EPERM' | 'ENOTEMPTY' | 'EEXIST' | 'EINVAL' | 'EBUSY'

/** The text Linux prints for each error (strerror). */
export const ERRNO_TEXT: Record<Errno, string> = {
  ENOENT: 'No such file or directory',
  EACCES: 'Permission denied',
  ENOTDIR: 'Not a directory',
  EISDIR: 'Is a directory',
  EPERM: 'Operation not permitted',
  ENOTEMPTY: 'Directory not empty',
  EEXIST: 'File exists',
  EINVAL: 'Invalid argument',
  EBUSY: 'Device or resource busy',
}

export type Stat = Required<NodeMeta>

/** Whose things are these by default? The home directory belongs to its user, everything else to root. */
function defaultOwner(home: string, abs: string): string {
  if (home !== '/' && (abs === home || abs.startsWith(home + '/'))) return basename(home) || 'root'
  return 'root'
}

/**
 * Fill in owner, group, mode and time wherever a seed left them out. Seeds
 * only need to spell out the unusual ones (a 600 diary, a root-owned file).
 */
export function fillMeta(root: DirNode, home: string, mtime: number): void {
  const walk = (node: FsNode, abs: string) => {
    const owner = defaultOwner(home, abs)
    node.owner ??= owner
    node.group ??= node.owner
    node.mode ??= isDir(node) ? DIR_MODE : FILE_MODE
    node.mtime ??= mtime
    if (isDir(node)) {
      for (const [name, child] of Object.entries(node.children)) walk(child, abs === '/' ? `/${name}` : `${abs}/${name}`)
    }
  }
  walk(root, '/')
}

/** A node's owner, group, mode and time (with defaults if a node was made without them). */
export function statNode(state: ShellState, abs: string, node: FsNode): Stat {
  const owner = node.owner ?? defaultOwner(state.home, abs)
  return {
    owner,
    group: node.group ?? owner,
    mode: node.mode ?? (isDir(node) ? DIR_MODE : FILE_MODE),
    mtime: node.mtime ?? 0,
  }
}

export function isRoot(state: ShellState): boolean {
  return state.user === 'root'
}

/** The groups a user belongs to. Each user here has just their own group. */
function groupsOf(user: string): string[] {
  return [user]
}

/** May the current user read (r), write (w) or execute / enter (x) this node? */
export function permits(state: ShellState, abs: string, node: FsNode, want: 'r' | 'w' | 'x'): boolean {
  const st = statNode(state, abs, node)
  if (isRoot(state)) {
    // root can do anything, except run a file that nobody may execute.
    return want !== 'x' || isDir(node) || (st.mode & 0o111) !== 0
  }
  const bit = want === 'r' ? 4 : want === 'w' ? 2 : 1
  let bits: number
  if (st.owner === state.user) bits = (st.mode >> 6) & 7
  else if (groupsOf(state.user).includes(st.group)) bits = (st.mode >> 3) & 7
  else bits = st.mode & 7
  return (bits & bit) !== 0
}

export type Found = { node: FsNode; error: null } | { node: null; error: 'ENOENT' | 'EACCES' | 'ENOTDIR' }

/**
 * Walk to an absolute path the way the kernel does: every directory on the
 * way must exist, be a directory, and let the user in (x).
 */
export function lookup(state: ShellState, abs: string): Found {
  let node: FsNode = state.fs
  let path = '/'
  for (const seg of abs.split('/').filter(Boolean)) {
    if (!isDir(node)) return { node: null, error: 'ENOTDIR' }
    if (!permits(state, path, node, 'x')) return { node: null, error: 'EACCES' }
    const next: FsNode | undefined = node.children[seg]
    if (!next) return { node: null, error: 'ENOENT' }
    node = next
    path = path === '/' ? `/${seg}` : `${path}/${seg}`
  }
  return { node, error: null }
}

/** May the user add or remove names in this directory? (needs w and x) */
export function canChangeDir(state: ShellState, abs: string, d: DirNode): boolean {
  return permits(state, abs, d, 'w') && permits(state, abs, d, 'x')
}

/**
 * May the user delete or rename `child` out of directory `parent`? Needs w
 * and x on the directory; in a sticky directory like /tmp, only the owner
 * of the file (or of the directory, or root) may.
 */
export function unlinkError(
  state: ShellState,
  parentAbs: string,
  parent: DirNode,
  childAbs: string,
  child: FsNode,
): Errno | null {
  if (!canChangeDir(state, parentAbs, parent)) return 'EACCES'
  const p = statNode(state, parentAbs, parent)
  if ((p.mode & 0o1000) !== 0 && !isRoot(state)) {
    const c = statNode(state, childAbs, child)
    if (c.owner !== state.user && p.owner !== state.user) return 'EPERM'
  }
  return null
}

/** A new, empty file owned by the current user (mode 644). */
export function newFile(state: ShellState, content = '', mode = FILE_MODE): FileNode {
  return { kind: 'file', content, mode, owner: state.user, group: state.user, mtime: Date.now() }
}

/** A new, empty directory owned by the current user (mode 755). */
export function newDir(state: ShellState, mode = DIR_MODE): DirNode {
  return { kind: 'dir', children: {}, mode, owner: state.user, group: state.user, mtime: Date.now() }
}

/** Mark a node as just changed. */
export function touched(node: FsNode): void {
  node.mtime = Date.now()
}

/** "rwxr-xr-x" for the permission bits, with s/S and t/T for the special bits. */
export function permString(mode: number): string {
  const triplet = (bits: number, special: boolean, on: string, off: string) =>
    (bits & 4 ? 'r' : '-') + (bits & 2 ? 'w' : '-') + (special ? (bits & 1 ? on : off) : bits & 1 ? 'x' : '-')
  return (
    triplet((mode >> 6) & 7, (mode & 0o4000) !== 0, 's', 'S') +
    triplet((mode >> 3) & 7, (mode & 0o2000) !== 0, 's', 'S') +
    triplet(mode & 7, (mode & 0o1000) !== 0, 't', 'T')
  )
}

/** The mode column of ls -l: a type letter (d or -) and the nine permission letters. */
export function modeString(node: FsNode, mode: number): string {
  return (isDir(node) ? 'd' : '-') + permString(mode)
}
