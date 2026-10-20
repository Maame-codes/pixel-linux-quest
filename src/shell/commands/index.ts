import type { Command } from '../types'

import { cat } from './cat'
import { cd } from './cd'
import { clear } from './clear'
import { echo } from './echo'
import { help } from './help'
import { history } from './history'
import { ls } from './ls'
import { man } from './man'
import { mkdir } from './mkdir'
import { pwd } from './pwd'
import { touch } from './touch'
import { whoami } from './whoami'

const ALL: Command[] = [cat, cd, clear, echo, help, history, ls, man, mkdir, pwd, touch, whoami]

/** All commands the engine knows how to run, keyed by name. */
export const registry: Record<string, Command> = Object.fromEntries(
  ALL.map((cmd) => [cmd.name, cmd]),
)

/** Look up a command's metadata by name. */
export function lookupCommand(name: string): Command | undefined {
  return registry[name]
}
