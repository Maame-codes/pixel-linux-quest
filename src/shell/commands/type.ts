import type { Command } from '../types'

/** Commands that are built into bash itself rather than separate programs. */
export const BUILTINS = ['cd', 'echo', 'help', 'history', 'pwd', 'type']

export const typeCmd: Command = {
  name: 'type',
  summary: 'say what kind of command a name is',
  usage: 'type NAME...',
  description:
    'Tells you whether a name is a command built into the shell or a program file, and where that program lives.',
  run: ({ args, lookup }) => {
    const out: string[] = []
    const err: string[] = []
    for (const name of args) {
      if (BUILTINS.includes(name)) out.push(`${name} is a shell builtin`)
      else if (lookup(name)) out.push(`${name} is /usr/bin/${name}`)
      else err.push(`bash: type: ${name}: not found`)
    }
    return {
      stdout: out.join('\n') || undefined,
      stderr: err.join('\n') || undefined,
      code: err.length > 0 ? 1 : 0,
    }
  },
}
