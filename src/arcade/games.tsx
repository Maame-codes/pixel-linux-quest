import type { ComponentType } from 'react'

import { GameFrame, type GameFrameProps } from './GameFrame'
import { bitBreaker } from './games/bitBreaker'
import { bugSmash } from './games/bugSmash'
import { packetSnake } from './games/packetSnake'

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
    blurb: packetSnake.blurb,
    Play: (props) => <GameFrame game={packetSnake} {...props} />,
  },
  {
    id: 'bug-smash',
    name: 'Bug Smash',
    blurb: bugSmash.blurb,
    Play: (props) => <GameFrame game={bugSmash} {...props} />,
  },
  {
    id: 'bit-breaker',
    name: 'Bit Breaker',
    blurb: bitBreaker.blurb,
    Play: (props) => <GameFrame game={bitBreaker} {...props} />,
  },
]
