import type { Command } from '../types'

export const man: Command = {
  name: 'man',
  summary: 'read the manual for a command',
  usage: 'man COMMAND',
  description: 'Shows the manual page for a command: what it does and how to use it.',
  run: ({ args, lookup }) => {
    const target = args[0]
    if (!target) {
      return { stderr: 'What manual page do you want? For example, try: man ls', code: 1 }
    }
    const cmd = lookup(target)
    if (!cmd) {
      return { stderr: `No manual entry for ${target}`, code: 16 }
    }
    const parts = [
      `NAME`,
      `  ${cmd.name} - ${cmd.summary}`,
      ``,
      `SYNOPSIS`,
      `  ${cmd.usage ?? cmd.name}`,
    ]
    if (cmd.description) {
      parts.push(``, `DESCRIPTION`, `  ${cmd.description}`)
    }
    return { stdout: parts.join('\n') }
  },
}
