import { getDir, getNode, insertNode } from '../fs'
import { dirname, resolvePath } from '../path'
import { file, type Command } from '../types'

export const touch: Command = {
  name: 'touch',
  summary: 'create an empty file',
  usage: 'touch NAME...',
  description:
    'Creates an empty file for each name you give it. If the file already exists, its contents stay the same.',
  run: ({ args, state }) => {
    if (args.length === 0) {
      return { stderr: "touch: missing file operand\nTry 'touch --help' for more information.", code: 1 }
    }
    const err: string[] = []
    for (const target of args) {
      const abs = resolvePath(state.cwd, target, state.home)
      // touch on something that exists only updates its timestamp.
      if (getNode(state.fs, abs)) continue
      if (!getDir(state.fs, dirname(abs))) {
        err.push(`touch: cannot touch '${target}': No such file or directory`)
        continue
      }
      insertNode(state.fs, abs, file())
    }
    return { state, stderr: err.join('\n') || undefined, code: err.length > 0 ? 1 : 0 }
  },
}
