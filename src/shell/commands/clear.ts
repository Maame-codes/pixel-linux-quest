import type { Command } from '../types'

export const clear: Command = {
  name: 'clear',
  summary: 'clear the terminal screen',
  usage: 'clear',
  description: 'Wipes the visible scrollback. Your files and location are unchanged.',
  run: () => ({ clear: true }),
}
