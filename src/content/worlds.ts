export type World = {
  num: number
  name: string
  /** Shown on the world map. */
  topic: string
  /** How many levels this world has (for map progress pips). */
  levelCount: number
}

export const WORLDS: World[] = [
  {
    num: 1,
    name: 'Penguin Island',
    topic: 'What Linux is, the big distro families, and what happens when a machine boots.',
    levelCount: 3,
  },
  {
    num: 2,
    name: 'Command Caves',
    topic: 'Your first commands, moving around, and finding help with man pages.',
    levelCount: 5,
  },
  {
    num: 3,
    name: 'File Forest',
    topic: 'Copy, move and delete files, read logs, find lost files and lock them with permissions. Ends with a boss level.',
    levelCount: 6,
  },
  {
    num: 4,
    name: 'Process Peaks',
    topic: 'Running programs, jobs, and your user environment.',
    levelCount: 4,
  },
  {
    num: 5,
    name: 'Text Tundra',
    topic: 'Editors, grep, pipes and bending text to your will.',
    levelCount: 4,
  },
  {
    num: 6,
    name: 'Script Castle',
    topic: 'Bash scripts, networking and security. The final boss lives here.',
    levelCount: 4,
  },
]

export function getWorld(num: number): World | undefined {
  return WORLDS.find((w) => w.num === num)
}
