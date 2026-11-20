import { parseOptions, tryHelp } from '../options'
import { basename, dirname, resolvePath } from '../path'
import { ERRNO_TEXT, lookup, touched, unlinkError, type Errno } from '../perm'
import { isDir, type Command, type DirNode, type ShellState } from '../types'

/** Remove one empty directory. Returns the error, or null. */
function removeEmpty(state: ShellState, abs: string, typed: string): Errno | null {
  const last = typed.replace(/\/+$/, '').split('/').pop()
  if (last === '.') return 'EINVAL'
  const found = lookup(state, abs)
  if (found.error) return found.error
  if (!isDir(found.node)) return 'ENOTDIR'
  if (abs === '/') return 'EBUSY'
  if (Object.keys(found.node.children).length > 0) return 'ENOTEMPTY'
  const parentAbs = dirname(abs)
  const parent = lookup(state, parentAbs).node as DirNode
  const e = unlinkError(state, parentAbs, parent, abs, found.node)
  if (e) return e
  delete parent.children[basename(abs)]
  touched(parent)
  return null
}

export const rmdir: Command = {
  name: 'rmdir',
  summary: 'remove empty directories',
  usage: 'rmdir [-p] DIRECTORY...',
  description:
    'Removes a directory, but only if it is empty. This makes it a safe way to tidy up: it never deletes files. -p also removes the empty parents named in the path.',
  run: ({ args, state }) => {
    const opts = parseOptions('rmdir', args, { flags: 'pv', long: { parents: 'p', verbose: 'v' } })
    if (opts.error) return { stderr: opts.error, code: 1 }
    if (opts.operands.length === 0) return { stderr: `rmdir: missing operand\n${tryHelp('rmdir')}`, code: 1 }

    const errors: string[] = []
    const said: string[] = []
    for (const op of opts.operands) {
      // With -p, "a/b/c" removes c, then b, then a.
      let typed = op.replace(/\/+$/, '') || op
      for (;;) {
        if (opts.flags.has('v')) said.push(`rmdir: removing directory, '${typed}'`)
        const e = removeEmpty(state, resolvePath(state.cwd, typed, state.home), typed)
        if (e) {
          errors.push(`rmdir: failed to remove '${typed}': ${ERRNO_TEXT[e]}`)
          break
        }
        if (!opts.flags.has('p') || !typed.includes('/')) break
        typed = typed.slice(0, typed.lastIndexOf('/'))
        if (typed === '') break
      }
    }
    return {
      state,
      stdout: said.join('\n') || undefined,
      stderr: errors.join('\n') || undefined,
      code: errors.length > 0 ? 1 : 0,
    }
  },
}
