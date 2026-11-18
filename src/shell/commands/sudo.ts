import type { Command } from '../types'

// The engine runs "sudo COMMAND" by running COMMAND, so this entry only
// handles a bare "sudo" and gives help and man something to show.
export const sudo: Command = {
  name: 'sudo',
  summary: 'run a command as the superuser (root)',
  usage: 'sudo COMMAND',
  description:
    'Runs one command with root powers, so it can change anything on the system. A real system asks for your password first. Use it with care.',
  run: () => ({ stderr: 'usage: sudo -h | -K | -k | -V', code: 1 }),
}
