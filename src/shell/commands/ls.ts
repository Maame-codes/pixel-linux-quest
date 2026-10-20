import { getNode, listDir } from '../fs'
import { resolvePath } from '../path'
import { isDir, isFile, type Command } from '../types'

export const ls: Command = {
  name: 'ls',
  summary: 'list what is here',
  usage: 'ls [path]',
  description: 'Lists the files and directories at the given path, or the current directory.',
  run: ({ args, state }) => {
    const target = args[0] ?? '.'
    const abs = resolvePath(state.cwd, target, state.home)
    const node = getNode(state.fs, abs)

    if (!node) {
      return { stderr: `ls: cannot access '${target}': No such file or directory`, code: 2 }
    }
    if (isFile(node)) {
      // ls of a single file just echoes the name back.
      return { stdout: target }
    }
    if (isDir(node)) {
      return { stdout: listDir(node).join('  ') }
    }
    return { stdout: '' }
  },
}
