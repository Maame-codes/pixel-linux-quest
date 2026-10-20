import type { Command } from '../types'

export const whoami: Command = {
  name: 'whoami',
  summary: 'print your username',
  usage: 'whoami',
  description: 'Prints the name of the user you are logged in as.',
  run: ({ state }) => ({ stdout: state.user }),
}
