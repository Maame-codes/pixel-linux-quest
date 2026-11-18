import type { ComponentType } from 'react'

import type { GameFrameProps } from './GameFrame'

/** What the Break Room passes to a running game. */
export type PlayProps = Omit<GameFrameProps<unknown>, 'game'>

export type ArcadeGame = {
  id: string
  name: string
  /** One line for the menu. */
  blurb: string
  /** The playable game, or null while its cabinet is still being built. */
  Play: ComponentType<PlayProps> | null
}

/** The Break Room's games, in cabinet order (left to right). */
export const ARCADE_GAMES: readonly ArcadeGame[] = [
  {
    id: 'packet-snake',
    name: 'Packet Snake',
    blurb: 'Steer a network cable and gobble data packets.',
    Play: null,
  },
  {
    id: 'bug-smash',
    name: 'Bug Smash',
    blurb: 'Smash the bugs popping out of folders. Not Pip!',
    Play: null,
  },
  {
    id: 'bit-breaker',
    name: 'Bit Breaker',
    blurb: 'Bounce a ball to clear out old files.',
    Play: null,
  },
]
