import type { Command } from '../types'
import { ls } from './ls'

// GNU coreutils really ships dir: it lists a directory like ls does.
export const dir: Command = {
  name: 'dir',
  summary: 'list what is here (a cousin of ls)',
  usage: 'dir [path]',
  description: 'Lists a directory, much like ls. It is part of GNU coreutils.',
  run: (ctx) => {
    const out = ls.run(ctx)
    return {
      ...out,
      stderr: out.stderr?.replace(/^ls:/, 'dir:'),
    }
  },
}
