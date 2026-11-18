import { getDir, getNode, insertNode } from '../fs'
import { dirname, resolvePath } from '../path'
import { dir, type Command } from '../types'

export const mkdir: Command = {
  name: 'mkdir',
  summary: 'make a directory',
  usage: 'mkdir NAME...',
  description: 'Creates a new, empty directory for each name you give it.',
  run: ({ args, state }) => {
    if (args.length === 0) {
      return { stderr: "mkdir: missing operand\nTry 'mkdir --help' for more information.", code: 1 }
    }
    const err: string[] = []
    for (const target of args) {
      const abs = resolvePath(state.cwd, target, state.home)
      if (getNode(state.fs, abs)) {
        err.push(`mkdir: cannot create directory '${target}': File exists`)
      } else if (!getDir(state.fs, dirname(abs))) {
        err.push(`mkdir: cannot create directory '${target}': No such file or directory`)
      } else {
        insertNode(state.fs, abs, dir())
      }
    }
    return { state, stderr: err.join('\n') || undefined, code: err.length > 0 ? 1 : 0 }
  },
}
