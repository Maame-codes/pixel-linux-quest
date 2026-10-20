import type { Level } from '../types'

import { whatIsLinux } from './w1l1-what-is-linux'
import { distroFamilies } from './w1l2-distro-families'
import { howItBoots } from './w1l3-how-it-boots'
import { firstCommands } from './w2l1-first-commands'
import { movingAround } from './w2l2-moving-around'
import { findingYourWay } from './w2l3-finding-your-way'
import { digAFolder } from './w2l4-dig-a-folder'
import { gettingHelp } from './w2l5-getting-help'

/** Every level, sorted into play order (by world, then by level). */
export const LEVELS: Level[] = [
  whatIsLinux,
  distroFamilies,
  howItBoots,
  firstCommands,
  movingAround,
  findingYourWay,
  digAFolder,
  gettingHelp,
].sort((a, b) => a.world - b.world || a.level - b.level)

const BY_ID = new Map(LEVELS.map((lvl) => [lvl.id, lvl]))

export function getLevel(id: string): Level | undefined {
  return BY_ID.get(id)
}

export function getLevelsByWorld(world: number): Level[] {
  return LEVELS.filter((lvl) => lvl.world === world).sort((a, b) => a.level - b.level)
}

/** Ids in play order, used to decide what unlocks next. */
export const LEVEL_ORDER: string[] = LEVELS.map((lvl) => lvl.id)
