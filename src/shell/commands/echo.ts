import type { Command } from '../types'

export const echo: Command = {
  name: 'echo',
  summary: 'print a line of text',
  usage: 'echo [text...]',
  description: 'Writes its arguments back out, separated by spaces.',
  run: ({ args }) => ({ stdout: args.join(' ') }),
}
