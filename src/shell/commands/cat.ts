import { readText } from '../io'
import { resolvePath } from '../path'
import { ERRNO_TEXT } from '../perm'
import type { Command } from '../types'

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
      const read = readText(state, resolvePath(state.cwd, target, state.home))
      if (read.ok) out.push(read.content.replace(/\n$/, ''))
      else err.push(`cat: ${target}: ${ERRNO_TEXT[read.errno]}`)
    }
    return {
      stdout: out.join('\n') || undefined,
      stderr: err.join('\n') || undefined,
      code: err.length > 0 ? 1 : 0,
    }
  },
}
