import { getNode } from '../fs'
import { resolvePath } from '../path'
import { isDir, isFile, type Command } from '../types'

export const cat: Command = {
  name: 'cat',
  summary: 'show the contents of a file',
  usage: 'cat FILE',
  description: 'Prints the whole contents of a file to the screen.',
  run: ({ args, state }) => {
    const target = args[0]
    if (!target) {
      return { stderr: 'cat: missing file operand', code: 1 }
    }
    const abs = resolvePath(state.cwd, target, state.home)
    const node = getNode(state.fs, abs)
    if (!node) {
      return { stderr: `cat: ${target}: No such file or directory`, code: 1 }
    }
    if (isDir(node)) {
      return { stderr: `cat: ${target}: Is a directory`, code: 1 }
    }
    if (isFile(node)) {
      return { stdout: node.content }
    }
    return { stdout: '' }
  },
}
