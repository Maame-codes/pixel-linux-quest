import type { PixelScene } from '../scene'
import { sceneUnix } from './s1-unix'
import { sceneSpread } from './s2-spread'
import { sceneGnu } from './s3-gnu'
import { sceneLinus } from './s4-linus'
import { sceneGpl } from './s5-gpl'
import { sceneToday } from './s6-today'
import { sceneYourTurn } from './s7-your-turn'

/** Scene builders keyed by intro scene id (see src/content/intro.ts). */
export const SCENES: Readonly<Record<string, () => PixelScene>> = {
  unix: sceneUnix,
  spread: sceneSpread,
  gnu: sceneGnu,
  linus: sceneLinus,
  gpl: sceneGpl,
  today: sceneToday,
  'your-turn': sceneYourTurn,
}
