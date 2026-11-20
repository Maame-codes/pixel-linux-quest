import type { Command } from '../types'

import { cat } from './cat'
import { cd } from './cd'
import { chmod } from './chmod'
import { cp } from './cp'
import { clear } from './clear'
import { dir } from './dir'
import { echo } from './echo'
import { find } from './find'
import { head, tail } from './head'
import { help } from './help'
import { history } from './history'
import { ls } from './ls'
import { man } from './man'
import { mkdir } from './mkdir'
import { mv } from './mv'
import { pwd } from './pwd'
import { rm } from './rm'
import { rmdir } from './rmdir'
import { sudo } from './sudo'
import { touch } from './touch'
import { typeCmd } from './type'
import { wc } from './wc'
import { whoami } from './whoami'

const ALL: Command[] = [
  cat,
  cd,
  chmod,
  clear,
  cp,
  dir,
  echo,
  find,
  head,
  help,
  history,
  ls,
  man,
  mkdir,
  mv,
  pwd,
  rm,
  rmdir,
  sudo,
  tail,
  touch,
  typeCmd,
  wc,
  whoami,
]

/** All commands the engine knows how to run, keyed by name. */
export const registry: Record<string, Command> = Object.fromEntries(
  ALL.map((cmd) => [cmd.name, cmd]),
)

/** Every command name the engine implements (the sandbox unlocks them all). */
export const ALL_COMMANDS: string[] = ALL.map((cmd) => cmd.name)

/** Look up a command's metadata by name. */
export function lookupCommand(name: string): Command | undefined {
  return registry[name]
}
