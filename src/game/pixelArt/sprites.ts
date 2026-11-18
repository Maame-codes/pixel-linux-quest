import type { Legend, SpriteRows } from './canvas'
import { C } from './palette'

// ---------------------------------------------------------------- Pip

/** Pip the penguin, 16x15, standing. Same pixels as the <Pip /> component. */
export const PIP: SpriteRows = [
  '......KKKK......',
  '....KKKKKKKK....',
  '...KKKKKKKKKK...',
  '...KKWWKKWWKK...',
  '..KKKWBKKWBKKK..',
  '..KKKWWOOWWKKK..',
  '..KKKKOOOOKKKK..',
  '.KKKWWWWWWWWKKK.',
  '.KKWWWWWWWWWWKK.',
  'KKKWWWWWWWWWWKKK',
  'KK.WWWWWWWWWW.KK',
  '...WWWWWWWWWW...',
  '...KWWWWWWWWK...',
  '....KKWWWWKK....',
  '...OOOO..OOOO...',
]

/** Second waddle frame: a step, one foot tucked in and both flippers out. Drawn 1px higher. */
export const PIP_STEP: SpriteRows = [
  '......KKKK......',
  '....KKKKKKKK....',
  '...KKKKKKKKKK...',
  '...KKWWKKWWKK...',
  '..KKKWBKKWBKKK..',
  '..KKKWWOOWWKKK..',
  '..KKKKOOOOKKKK..',
  '.KKKWWWWWWWWKKK.',
  'KKKWWWWWWWWWWKKK',
  'KK.WWWWWWWWWW.KK',
  'K..WWWWWWWWWW..K',
  '...WWWWWWWWWW...',
  '...KWWWWWWWWK...',
  '....KKWWWWKK....',
  '....OOO..OOOO...',
]

export const PIP_LEGEND: Legend = { K: C.deep, W: C.white, B: C.deep, O: C.orange }

// ---------------------------------------------------------------- People
// Generic pixel figures. h hair, s skin, e eye, t top, p trousers, k shoes,
// b beard or collar, c chair.

/** Standing, facing right, one arm reaching forward. 11x20. */
export const PERSON_STAND: SpriteRows = [
  '...hhhh....',
  '..hhhhhh...',
  '..hhssss...',
  '..hsssess..',
  '..hsssss...',
  '...ssss....',
  '....ss.....',
  '..tttttt...',
  '.tttttttss.',
  '.tttttt....',
  '.tttttt....',
  '.stttttt...',
  '.s.pppp....',
  '...pppp....',
  '...pp.pp...',
  '...pp.pp...',
  '...pp.pp...',
  '...pp.pp...',
  '...pp.pp...',
  '..kkk.kkk..',
]

/** Sitting on a stool, facing right, typing. 12x17. */
export const PERSON_SIT: SpriteRows = [
  '...hhhh.....',
  '..hhhhhh....',
  '..hhssss....',
  '..hsssess...',
  '..hbbbbbb...',
  '...bbbbb....',
  '....bbb.....',
  '..tttttt....',
  '.tttttttttss',
  '.tttttt.....',
  '.tttttt.....',
  '.pppppppp...',
  '.pppppppp...',
  '......pp....',
  '......pp....',
  '......pp....',
  '......kkk...',
]

/** Standing, both arms up in a cheer. 12x20. */
export const PERSON_CHEER: SpriteRows = [
  's...hhhh...s',
  's..hhhhhh..s',
  't..hhssss..t',
  't..hsssess.t',
  't..hsssss..t',
  'tt..ssss..tt',
  '.t...ss...t.',
  '.tttttttttt.',
  '...tttttt...',
  '...tttttt...',
  '...tttttt...',
  '...tttttt...',
  '....pppp....',
  '....pppp....',
  '....pp.pp...',
  '....pp.pp...',
  '....pp.pp...',
  '....pp.pp...',
  '....pp.pp...',
  '...kkk.kkk..',
]

/** Standing, facing right, scratching their head (thinking). 11x20. */
export const PERSON_THINK: SpriteRows = [
  '...hhhh....',
  '..hhhhhhs..',
  '..hhssssst.',
  '..hsssesst.',
  '..hsssss.t.',
  '...ssss..t.',
  '....ss...t.',
  '..tttttttt.',
  '.tttttt....',
  '.tttttt....',
  '.tttttt....',
  '.stttttt...',
  '.s.pppp....',
  '...pppp....',
  '...pp.pp...',
  '...pp.pp...',
  '...pp.pp...',
  '...pp.pp...',
  '...pp.pp...',
  '..kkk.kkk..',
]

/** Seated, seen from behind, on a chair with a tall back. 14x24. */
export const PERSON_BACK_SIT: SpriteRows = [
  '....hhhhhh....',
  '...hhhhhhhh...',
  '...hhhhhhhh...',
  '..shhhhhhhhs..',
  '...hhhhhhhh...',
  '....hhhhhh....',
  '.....ssss.....',
  '...tttttttt...',
  '..tttttttttt..',
  '.tttttttttttt.',
  '.tttttttttttt.',
  '.tttccccccttt.',
  '.ttcccccccctt.',
  '.ttcccccccctt.',
  '..tcccccccct..',
  '...cccccccc...',
  '...cccccccc...',
  '..cccccccccc..',
  '......cc......',
  '......cc......',
  '......cc......',
  '....cccccc....',
  '...c..cc..c...',
  '..cc......cc..',
]

export type PersonColours = {
  hair: string
  skin: string
  top: string
  trousers?: string
  shoes?: string
  /** Beard or collar colour for PERSON_SIT. Defaults to the skin. */
  beard?: string
  chair?: string
}

/** Build a legend for any person sprite. */
export function personLegend(p: PersonColours): Legend {
  return {
    h: p.hair,
    s: p.skin,
    e: C.deep,
    t: p.top,
    p: p.trousers ?? C.bg,
    k: p.shoes ?? C.deep,
    b: p.beard ?? p.skin,
    c: p.chair ?? C.slate,
  }
}
