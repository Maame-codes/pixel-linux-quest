import { getDir, getNode, insertNode } from '../fs'
import { dirname, resolvePath } from '../path'
import { dir, type Command } from '../types'

export const mkdir: Command = {
  name: 'mkdir',
  summary: 'make a directory',
  usage: 'mkdir NAME',
  description: 'Creates a new, empty directory with the name you give it.',
  run: ({ args, state }) => {
    const target = args[0]
    if (!target) {
      return { stderr: 'mkdir: missing operand', code: 1 }
    }
    const abs = resolvePath(state.cwd, target, state.home)
    if (getNode(state.fs, abs)) {
      return { stderr: `mkdir: cannot create directory '${target}': File exists`, code: 1 }
    }
    if (!getDir(state.fs, dirname(abs))) {
      return {
        stderr: `mkdir: cannot create directory '${target}': No such file or directory`,
        code: 1,
      }
    }
    insertNode(state.fs, abs, dir())
    return { state }
  },
}
