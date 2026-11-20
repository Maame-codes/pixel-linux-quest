import { writableParent } from '../io'
import { parseOptions } from '../options'
import { basename, dirname, resolvePath } from '../path'
import { ERRNO_TEXT, lookup, newDir, touched } from '../perm'
import { isDir, type Command, type ShellState } from '../types'

/** Make one directory (and with -p, its missing parents). Returns an error text, or null. */
function makeOne(state: ShellState, abs: string, shown: string, parents: boolean, said: string[]): string | null {
  const found = lookup(state, abs)
  if (found.node) {
    if (parents && isDir(found.node)) return null
    return `mkdir: cannot create directory '${shown}': File exists`
  }
  const parent = writableParent(state, abs)
  if (!parent.ok) {
    if (parents && parent.errno === 'ENOENT') {
      const upShown = shown.replace(/\/+$/, '').replace(/\/[^/]*$/, '') || dirname(abs)
      const e = makeOne(state, dirname(abs), upShown, true, said)
      return e ?? makeOne(state, abs, shown, true, said)
    }
    return `mkdir: cannot create directory '${shown}': ${ERRNO_TEXT[parent.errno]}`
  }
  parent.dir.children[basename(abs)] = newDir(state)
  touched(parent.dir)
  said.push(`mkdir: created directory '${shown}'`)
  return null
}

export const mkdir: Command = {
  name: 'mkdir',
  summary: 'make a directory',
  usage: 'mkdir [-p] NAME...',
  description:
    'Creates a new, empty directory for each name you give it. -p also makes any missing parent directories, and does not mind if the directory is already there.',
  run: ({ args, state }) => {
    const opts = parseOptions('mkdir', args, { flags: 'pv', long: { parents: 'p', verbose: 'v' } })
    if (opts.error) return { stderr: opts.error, code: 1 }
    if (opts.operands.length === 0) {
      return { stderr: "mkdir: missing operand\nTry 'mkdir --help' for more information.", code: 1 }
    }
    const err: string[] = []
    const said: string[] = []
    for (const target of opts.operands) {
      const e = makeOne(state, resolvePath(state.cwd, target, state.home), target, opts.flags.has('p'), said)
      if (e) err.push(e)
    }
    return {
      state,
      stdout: opts.flags.has('v') ? said.join('\n') || undefined : undefined,
      stderr: err.join('\n') || undefined,
      code: err.length > 0 ? 1 : 0,
    }
  },
}
