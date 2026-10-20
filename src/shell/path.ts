// Absolute/relative path handling for the virtual filesystem.

/** Collapse ".", ".." and redundant slashes in an absolute path. */
export function normalizePath(path: string): string {
  const out: string[] = []
  for (const seg of path.split('/')) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') {
      out.pop()
      continue
    }
    out.push(seg)
  }
  return '/' + out.join('/')
}

/**
 * Resolve a user-typed path against the current directory.
 * Handles "~", "~/x", absolute and relative paths. Returns an absolute path.
 */
export function resolvePath(cwd: string, input: string, home: string): string {
  let p = input.trim()
  if (p === '') return cwd
  if (p === '~') p = home
  else if (p.startsWith('~/')) p = home + '/' + p.slice(2)
  if (!p.startsWith('/')) p = cwd + '/' + p
  return normalizePath(p)
}

/** The final segment of an absolute path ("/a/b" -> "b"). Root -> "". */
export function basename(path: string): string {
  const segs = path.split('/').filter(Boolean)
  return segs.length ? segs[segs.length - 1] : ''
}

/** The parent of an absolute path ("/a/b" -> "/a"). Root -> "/". */
export function dirname(path: string): string {
  const segs = path.split('/').filter(Boolean)
  segs.pop()
  return '/' + segs.join('/')
}

/** Shorten an absolute path for the prompt, replacing home with "~". */
export function shortenPath(path: string, home: string): string {
  if (path === home) return '~'
  if (path.startsWith(home + '/')) return '~' + path.slice(home.length)
  return path
}
