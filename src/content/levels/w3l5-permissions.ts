import { dir, file, getNode } from '../../shell'
import { ran, wordsOf } from '../checks'
import type { Level } from '../types'

const HOME = '/home/pip'

const seedFs = dir({
  home: dir({
    pip: dir({
      'diary.txt': file('Dear diary, today I learned chmod.'),
      'shopping.txt': file('sardines\nmore sardines'),
      site: dir({
        'start.sh': file('#!/bin/bash\necho "Starting the forest website"'),
        'site.conf': file('port=8080'),
      }),
    }),
  }),
})

const modeOf = (s: Parameters<typeof getNode>[0], path: string) => getNode(s, `${HOME}/${path}`)?.mode ?? 0

export const permissions: Level = {
  id: 'w3-l5-permissions',
  world: 3,
  level: 5,
  title: 'Permissions',
  blurb: 'Lock your diary so only you can read it, and make a script runnable, with ls -l and chmod.',
  xp: 80,
  lessonPages: [
    '**Mission:** your diary can be read by everyone on this computer. Time to lock it.\n\nEvery file has an **owner**, a **group**, and permissions for three kinds of people: the owner (**u**ser), the **g**roup, and everyone else (**o**thers).',
    '`ls -l` shows them. Take `-rw-r--r-- 1 pip pip 42 Nov 20 09:14 notes.txt`:\n\n- the first `-` means a file (`d` means a directory)\n- `rw-`: the owner can read and write\n- `r--`: the group can only read\n- `r--`: others can only read\n\nThen come the number of links, the owner (`pip`), the group (`pip`), the size in bytes, the date and the name.',
    '`chmod` changes the permissions. Each one has a number: **r = 4, w = 2, x = 1**. Add them up for each kind of person, in the order owner, group, others.\n\n- `chmod 640 plans.txt`: owner 6 (4 + 2, read and write), group 4 (read), others 0 (nothing).\n- `chmod 755 tool.sh`: rwx for the owner, r-x for everyone else.',
    'Or use letters: who (`u`, `g`, `o`, or `a` for all), then `+` to add or `-` to remove, then `r`, `w` or `x`.\n\n- `chmod u+x backup.sh` lets the owner run it.\n- `chmod go-r plans.txt` stops the group and others reading it.\n\nOn a directory, `x` means you may go inside.',
  ],
  test: {
    kind: 'challenge',
    seedFs,
    startDir: HOME,
    commands: ['ls', 'cd', 'pwd', 'cat', 'cp', 'mv', 'rm', 'rmdir', 'head', 'tail', 'wc', 'find', 'chmod'],
    objectives: [
      {
        id: 'look',
        label: 'Look at the permissions of everything here with ls -l',
        hint: 'ls with the -l option shows the long listing.',
        answer: 'ls -l',
        check: (_s, last) => ran(last, 'ls') && wordsOf(last).some((w) => /^-[a-zA-Z]*l/.test(w)),
      },
      {
        id: 'diary',
        label: 'Lock diary.txt so only you can read and write it (600)',
        hint: 'You get 6 (read 4 + write 2). The group and others get 0.',
        answer: 'chmod 600 diary.txt',
        check: (s) => (modeOf(s.fs, 'diary.txt') & 0o777) === 0o600,
      },
      {
        id: 'script',
        label: 'Make site/start.sh runnable for you, its owner (u+x)',
        hint: 'u for the owner, + to add, x for execute.',
        answer: 'chmod u+x site/start.sh',
        check: (s) => (modeOf(s.fs, 'site/start.sh') & 0o100) !== 0,
      },
      {
        id: 'read',
        label: 'Make sure you can still read your diary',
        hint: 'You learned this in World 2.',
        answer: 'cat diary.txt',
        recall: true,
        check: (_s, last) => ran(last, 'cat') && last.stdout.includes('Dear diary'),
      },
    ],
  },
}
