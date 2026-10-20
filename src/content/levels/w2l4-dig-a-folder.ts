import { dir, file, getNode, isDir, isFile } from '../../shell'
import type { Level } from '../types'

const seedFs = dir({
  home: dir({
    pip: dir({
      'notes.txt': file('Pip’s notes: find the treasure. bring snacks.'),
      snacks: dir({ 'fish.txt': file('><>  ><>  ><>') }),
    }),
  }),
})

export const digAFolder: Level = {
  id: 'w2-l4-dig-a-folder',
  world: 2,
  level: 4,
  title: 'Dig a Folder',
  blurb: 'Make a directory, step inside it, and create a file.',
  xp: 50,
  lessonPages: [
    'On Linux, folders are called **directories**. Everything lives in one big tree that starts at `/` (the root). Your home on this island is `/home/pip`, and `~` is a handy shortcut for it.',
    'Two commands build things:\n\n- `mkdir NAME` makes a new directory.\n- `touch NAME` creates a new, empty file.\n\nTo go inside a directory you just made, use `cd NAME`. And `cd ..` steps back up one level.',
    'Can’t see what you made? `ls` lists everything in the directory you are standing in. Type it any time to look around.',
  ],
  test: {
    kind: 'challenge',
    seedFs,
    startDir: '/home/pip',
    commands: ['ls', 'pwd', 'cd', 'mkdir', 'touch', 'cat', 'echo', 'whoami'],
    objectives: [
      {
        id: 'look',
        label: 'Look around with ls',
        hint: 'First, look around. Type ls and press Enter.',
        answer: 'ls',
        check: (_shell, last) => last.input.trim().split(/\s+/)[0] === 'ls' && last.code === 0,
      },
      {
        id: 'mkdir',
        label: 'Make a directory called treasure',
        hint: 'See notes.txt and snacks? Now make a new directory called treasure.',
        answer: 'mkdir treasure',
        check: (shell) => isDir(getNode(shell.fs, `${shell.home}/treasure`)),
      },
      {
        id: 'cd',
        label: 'Move into treasure',
        hint: 'Directory made! Step inside it with cd.',
        answer: 'cd treasure',
        check: (shell) => shell.cwd === `${shell.home}/treasure`,
      },
      {
        id: 'touch',
        label: 'Create map.txt inside it',
        hint: 'You are in. Create an empty file called map.txt with touch.',
        answer: 'touch map.txt',
        check: (shell) => isFile(getNode(shell.fs, `${shell.home}/treasure/map.txt`)),
      },
    ],
  },
}
