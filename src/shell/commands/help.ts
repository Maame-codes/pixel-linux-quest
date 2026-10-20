import type { Command } from '../types'

export const help: Command = {
  name: 'help',
  summary: 'list the commands you can use',
  usage: 'help',
  description: 'Shows every command unlocked in this level, with a one-line description.',
  run: ({ unlocked, lookup }) => {
    const names = Array.from(new Set([...unlocked, 'help', 'clear'])).sort((a, b) =>
      a.localeCompare(b),
    )
    const lines = names.map((name) => {
      const cmd = lookup(name)
      const summary = cmd ? cmd.summary : ''
      return '  ' + name.padEnd(8) + summary
    })
    return {
      stdout:
        'Commands you can use:\n' +
        lines.join('\n') +
        "\n\nTry 'man NAME' or 'NAME --help' for more on any command.",
    }
  },
}
