import type { Level } from '../types'

import { digAFolder } from './w2l4-dig-a-folder'

/** Every level in the game, in play order. */
export const LEVELS: Level[] = [digAFolder]

const BY_ID = new Map(LEVELS.map((lvl) => [lvl.id, lvl]))

export function getLevel(id: string): Level | undefined {
  return BY_ID.get(id)
}

export function getLevelsByWorld(world: number): Level[] {
  return LEVELS.filter((lvl) => lvl.world === world).sort((a, b) => a.level - b.level)
}

/** Ids in play order, used to decide what unlocks next. */
export const LEVEL_ORDER: string[] = LEVELS.map((lvl) => lvl.id)
