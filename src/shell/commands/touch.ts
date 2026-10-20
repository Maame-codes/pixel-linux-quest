import { getDir, getNode, insertNode } from '../fs'
import { dirname, resolvePath } from '../path'
import { file, type Command } from '../types'

export const touch: Command = {
  name: 'touch',
  summary: 'create an empty file',
  usage: 'touch NAME',
  description:
    'Creates an empty file with the name you give it. If the file already exists, nothing changes.',
  run: ({ args, state }) => {
    const target = args[0]
    if (!target) {
      return { stderr: 'touch: missing file operand', code: 1 }
    }
    const abs = resolvePath(state.cwd, target, state.home)
    const existing = getNode(state.fs, abs)
    if (existing) {
      // touch on an existing file/dir is a no-op success here.
      return { state }
    }
    if (!getDir(state.fs, dirname(abs))) {
      return { stderr: `touch: cannot touch '${target}': No such file or directory`, code: 1 }
    }
    insertNode(state.fs, abs, file())
    return { state }
  },
}
