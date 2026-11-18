import { getNode } from '../fs'
import { resolvePath } from '../path'
import { isDir, type Command } from '../types'

// cd is built into bash, so its errors start with "bash: cd:".
export const cd: Command = {
  name: 'cd',
  summary: 'change directory',
  usage: 'cd [path]',
  description:
    'Moves you into another directory. With no path, goes home (~). "cd .." goes up one level.',
  run: ({ args, state }) => {
    if (args.length > 1) return { stderr: 'bash: cd: too many arguments', code: 1 }
    const target = args[0] ?? '~'
    const abs = resolvePath(state.cwd, target, state.home)
    const node = getNode(state.fs, abs)

    if (!node) return { stderr: `bash: cd: ${target}: No such file or directory`, code: 1 }
    if (!isDir(node)) return { stderr: `bash: cd: ${target}: Not a directory`, code: 1 }
    state.cwd = abs
    state.env.PWD = abs
    return { state }
  },
}
