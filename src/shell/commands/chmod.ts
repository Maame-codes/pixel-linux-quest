import { joinPath, joinShown, listDir } from '../fs'
import { tryHelp } from '../options'
import { resolvePath } from '../path'
import { ERRNO_TEXT, UMASK, isRoot, lookup, permString, statNode } from '../perm'
import { isDir, type Command, type FsNode, type ShellState } from '../types'

const WHO_BITS = { u: 0o4700, g: 0o2070, o: 0o1007 } as const

/**
 * Work out a new mode from a numeric mode (644, 0755) or a symbolic one
 * (u+x, go-r, a=r, u=rw,go=). Returns null if the mode is not valid.
 */
export function applyMode(spec: string, current: number, isDirectory: boolean): number | null {
  if (/^[0-7]+$/.test(spec)) {
    if (spec.length > 4) return null
    return parseInt(spec, 8)
  }
  let mode = current
  for (const clause of spec.split(',')) {
    const m = /^([ugoa]*)((?:[-+=][rwxXstugo]*)+)$/.exec(clause)
    if (!m) return null
    const whoText = m[1]
    let who = 0
    for (const w of whoText.includes('a') ? 'ugo' : whoText) who |= WHO_BITS[w as 'u' | 'g' | 'o']
    // No u, g, o or a: like "a", but the bits in the umask are left alone.
    const masked = whoText === ''
    if (masked) who = 0o7777
    for (const action of m[2].match(/[-+=][rwxXstugo]*/g) ?? []) {
      const op = action[0]
      const perms = action.slice(1)
      let bits = 0
      for (const p of perms) {
        if (p === 'r') bits |= 0o444
        else if (p === 'w') bits |= 0o222
        else if (p === 'x') bits |= 0o111
        else if (p === 'X') bits |= isDirectory || (current & 0o111) !== 0 ? 0o111 : 0
        else if (p === 's') bits |= 0o6000
        else if (p === 't') bits |= 0o1000
        else {
          // Copy another class's bits: g=u gives the group what the owner has.
          const shift = p === 'u' ? 6 : p === 'g' ? 3 : 0
          const t = (mode >> shift) & 7
          bits |= t * 0o111
        }
      }
      let affect = bits & who
      if (masked) affect &= ~UMASK
      if (op === '+') mode |= affect
      else if (op === '-') mode &= ~affect
      else {
        // "=": clear this class's permission bits, then set the given ones.
        const clear = masked ? 0o777 & ~UMASK : who & 0o777
        mode = (mode & ~clear) | affect
      }
    }
  }
  return mode
}

const octal = (mode: number) => mode.toString(8).padStart(4, '0')

export const chmod: Command = {
  name: 'chmod',
  summary: 'change who may read, write or run a file',
  usage: 'chmod MODE FILE...',
  description:
    'Changes the permissions of files and directories. MODE can be three digits, like 600 or 755 (owner, group, others; 4 = read, 2 = write, 1 = execute, added up), or letters like u+x, go-r or a+r (who: u owner, g group, o others, a all; + adds, - removes). Only the owner (or root) may change them.',
  run: ({ args, state }) => {
    let recursive = false
    let verbose = false
    let spec: string | null = null
    const files: string[] = []
    let done = false
    for (const a of args) {
      if (!done && a === '--') done = true
      else if (!done && (a === '-R' || a === '--recursive')) recursive = true
      else if (!done && (a === '-v' || a === '--verbose')) verbose = true
      else if (spec === null) spec = a
      else files.push(a)
    }
    if (spec === null) return { stderr: `chmod: missing operand\n${tryHelp('chmod')}`, code: 1 }
    if (applyMode(spec, 0o644, false) === null) {
      return { stderr: `chmod: invalid mode: ‘${spec}’\n${tryHelp('chmod')}`, code: 1 }
    }
    if (files.length === 0) return { stderr: `chmod: missing operand after ‘${spec}’\n${tryHelp('chmod')}`, code: 1 }

    const err: string[] = []
    const said: string[] = []
    const change = (s: ShellState, abs: string, shown: string, node: FsNode) => {
      const st = statNode(s, abs, node)
      if (st.owner !== s.user && !isRoot(s)) {
        err.push(`chmod: changing permissions of '${shown}': Operation not permitted`)
        return
      }
      const next = applyMode(spec, st.mode, isDir(node)) ?? st.mode
      node.mode = next
      if (verbose) {
        said.push(
          next === st.mode
            ? `mode of '${shown}' retained as ${octal(next)} (${permString(next)})`
            : `mode of '${shown}' changed from ${octal(st.mode)} (${permString(st.mode)}) to ${octal(next)} (${permString(next)})`,
        )
      }
      if (recursive && isDir(node)) {
        for (const name of listDir(node)) change(s, joinPath(abs, name), joinShown(shown, name), node.children[name])
      }
    }

    for (const shown of files) {
      const abs = resolvePath(state.cwd, shown, state.home)
      const found = lookup(state, abs)
      if (found.error) {
        err.push(`chmod: cannot access '${shown}': ${ERRNO_TEXT[found.error]}`)
        continue
      }
      // Changing permissions does not change the contents, so ls -l keeps the old time.
      change(state, abs, shown, found.node)
    }
    return {
      state,
      stdout: said.join('\n') || undefined,
      stderr: err.join('\n') || undefined,
      code: err.length > 0 ? 1 : 0,
    }
  },
}
