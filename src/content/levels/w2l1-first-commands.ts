import { dir, file } from '../../shell'
import type { Level } from '../types'

const seedFs = dir({
  home: dir({
    pip: dir({
      'welcome.txt': file('Welcome to Penguin Island!'),
      'island-map.txt': file('X marks the treasure.'),
      gear: dir({ 'torch.txt': file('a trusty torch') }),
    }),
  }),
})

export const firstCommands: Level = {
  id: 'w2-l1-first-commands',
  world: 2,
  level: 1,
  title: 'First Commands',
  blurb: 'Meet pwd, whoami and ls — your first three commands.',
  xp: 40,
  lessonPages: [
    'A **command** is a word you type and run by pressing Enter. The terminal does the job and prints the result. Let’s learn three gentle ones.',
    '- `whoami` tells you which user you are.\n- `pwd` prints the directory you are standing in ("print working directory").\n- `ls` lists the files and folders where you are.',
    'Type one, press Enter, read the reply. Stuck? Type `help` any time to see the commands you can use.',
  ],
  test: {
    kind: 'challenge',
    seedFs,
    startDir: '/home/pip',
    commands: ['whoami', 'pwd', 'ls', 'cat', 'echo'],
    objectives: [
      {
        id: 'whoami',
        label: 'Find out who you are with whoami',
        hint: 'Type whoami and press Enter.',
        answer: 'whoami',
        check: (_s, last) => last.input.trim() === 'whoami' && last.code === 0,
      },
      {
        id: 'pwd',
        label: 'Print where you are with pwd',
        hint: 'Type pwd to see your current directory.',
        answer: 'pwd',
        check: (_s, last) => last.input.trim() === 'pwd' && last.code === 0,
      },
      {
        id: 'ls',
        label: 'List what is here with ls',
        hint: 'Type ls to look around.',
        answer: 'ls',
        check: (_s, last) => last.input.trim().split(/\s+/)[0] === 'ls' && last.code === 0,
      },
    ],
  },
}
