import { writableParent } from '../io'
import { parseOptions } from '../options'
import { basename, resolvePath } from '../path'
import { ERRNO_TEXT, isRoot, lookup, newFile, permits, statNode, touched } from '../perm'
import type { Command } from '../types'

export const touch: Command = {
  name: 'touch',
  summary: 'create an empty file',
  usage: 'touch NAME...',
  description:
    'Creates an empty file for each name you give it. If the file already exists, its contents stay the same and only its time changes.',
  run: ({ args, state }) => {
    const opts = parseOptions('touch', args, { flags: 'c', long: { 'no-create': 'c' } })
    if (opts.error) return { stderr: opts.error, code: 1 }
    if (opts.operands.length === 0) {
      return { stderr: "touch: missing file operand\nTry 'touch --help' for more information.", code: 1 }
    }
    const err: string[] = []
    for (const target of opts.operands) {
      const abs = resolvePath(state.cwd, target, state.home)
      const found = lookup(state, abs)
      if (found.node) {
        // Setting the time to now needs write permission, or owning the file.
        const owns = statNode(state, abs, found.node).owner === state.user
        if (!owns && !isRoot(state) && !permits(state, abs, found.node, 'w')) {
          err.push(`touch: cannot touch '${target}': Permission denied`)
        } else touched(found.node)
        continue
      }
      if (opts.flags.has('c')) continue
      const parent = writableParent(state, abs)
      const errno = found.error === 'EACCES' ? 'EACCES' : parent.ok ? null : parent.errno
      if (errno || !parent.ok) {
        err.push(`touch: cannot touch '${target}': ${ERRNO_TEXT[errno ?? 'EACCES']}`)
        continue
      }
      parent.dir.children[basename(abs)] = newFile(state)
      touched(parent.dir)
    }
    return { state, stderr: err.join('\n') || undefined, code: err.length > 0 ? 1 : 0 }
  },
}
