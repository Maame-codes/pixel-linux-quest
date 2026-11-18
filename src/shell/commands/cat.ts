import { getNode } from '../fs'
import { resolvePath } from '../path'
import { isDir, isFile, type Command } from '../types'

export const cat: Command = {
  name: 'cat',
  summary: 'show the contents of a file',
  usage: 'cat FILE...',
  description: 'Prints the whole contents of one or more files to the screen.',
  run: ({ args, state }) => {
    // A real cat with no file waits for keyboard input until Ctrl+D. This
    // terminal cannot wait, so it acts as if Ctrl+D came straight away.
    if (args.length === 0) return {}
    const out: string[] = []
    const err: string[] = []
    for (const target of args) {
      const node = getNode(state.fs, resolvePath(state.cwd, target, state.home))
      if (!node) err.push(`cat: ${target}: No such file or directory`)
      else if (isDir(node)) err.push(`cat: ${target}: Is a directory`)
      else if (isFile(node)) out.push(node.content)
    }
    return {
      stdout: out.join('\n') || undefined,
      stderr: err.join('\n') || undefined,
      code: err.length > 0 ? 1 : 0,
    }
  },
}
