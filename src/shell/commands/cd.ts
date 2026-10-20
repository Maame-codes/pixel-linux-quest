import { getNode } from '../fs'
import { resolvePath } from '../path'
import { isDir, isFile, type Command } from '../types'

export const cd: Command = {
  name: 'cd',
  summary: 'change directory',
  usage: 'cd [path]',
  description:
    'Moves you into another directory. With no path, goes home (~). "cd .." goes up one level.',
  run: ({ args, state }) => {
    const target = args[0] ?? '~'
    const abs = resolvePath(state.cwd, target, state.home)
    const node = getNode(state.fs, abs)

    if (!node) {
      return { stderr: `cd: ${target}: No such file or directory`, code: 1 }
    }
    if (isFile(node)) {
      return { stderr: `cd: ${target}: Not a directory`, code: 1 }
    }
    if (isDir(node)) {
      state.cwd = abs
      state.env.PWD = abs
      return { state }
    }
    return { stderr: `cd: ${target}: Not a directory`, code: 1 }
  },
}
