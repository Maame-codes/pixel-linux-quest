import type { Command } from '../types'

export const pwd: Command = {
  name: 'pwd',
  summary: 'print the current directory',
  usage: 'pwd',
  description: 'Prints the full path of the directory you are in right now.',
  run: ({ state }) => ({ stdout: state.cwd }),
}
