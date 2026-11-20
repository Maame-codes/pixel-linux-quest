import { resolvePath } from '../path'
import { ERRNO_TEXT, lookup, permits } from '../perm'
import { isDir, type Command } from '../types'

// cd is built into bash, so its errors start with "bash: cd:".
export const cd: Command = {
  name: 'cd',
  summary: 'change directory',
  usage: 'cd [path]',
  description:
    'Moves you into another directory. With no path, goes home (~). "cd .." goes up one level. You need x (execute) permission on a directory to go into it.',
  run: ({ args, state }) => {
    if (args.length > 1) return { stderr: 'bash: cd: too many arguments', code: 1 }
    const target = args[0] ?? '~'
    const abs = resolvePath(state.cwd, target, state.home)
    const found = lookup(state, abs)

    if (found.error) return { stderr: `bash: cd: ${target}: ${ERRNO_TEXT[found.error]}`, code: 1 }
    if (!isDir(found.node)) return { stderr: `bash: cd: ${target}: Not a directory`, code: 1 }
    if (!permits(state, abs, found.node, 'x')) return { stderr: `bash: cd: ${target}: Permission denied`, code: 1 }
    state.cwd = abs
    state.env.PWD = abs
    return { state }
  },
}
