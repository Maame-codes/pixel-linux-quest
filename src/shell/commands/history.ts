import type { Command } from '../types'

export const history: Command = {
  name: 'history',
  summary: 'show the commands you have typed',
  usage: 'history',
  description: 'Lists the commands you have run this session, numbered from the start.',
  run: ({ state }) => {
    // The current "history" command has already been recorded by the engine.
    const lines = state.history.map((line, i) => '  ' + String(i + 1).padStart(3) + '  ' + line)
    return { stdout: lines.join('\n') }
  },
}
