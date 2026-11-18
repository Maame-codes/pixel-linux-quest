import { dir, file } from '../../shell'
import type { Level } from '../types'

const seedFs = dir({
  home: dir({
    pip: dir({
      'readme.txt': file('Explore the cave, then visit the lake.'),
      cave: dir({
        tunnel: dir({ 'crystal.txt': file('a glowing crystal') }),
      }),
      lake: dir({ 'boat.txt': file('a little wooden boat') }),
    }),
  }),
})

export const movingAround: Level = {
  id: 'w2-l2-moving-around',
  world: 2,
  level: 2,
  title: 'Moving Around',
  blurb: 'Walk the directory tree with cd and ..',
  xp: 50,
  lessonPages: [
    'Directories nest inside each other like a tree. To walk into one, use `cd NAME` ("change directory"). Use `ls` first if you want to see what is around you.',
    'To step **back up** one level, use `cd ..`. Two dots mean "the directory above this one". You can chain them: `cd ../..` goes up twice.',
    'You can also combine steps. From deep in the tree, `cd ../../lake` goes up two levels and then down into `lake`. Give it a try in the quest!',
    'A trick to save typing: type the start of a name and press **Tab**. If only one name fits, the terminal finishes it for you, so `cd ca` becomes `cd cave/`. If several names fit, press Tab again to see them all. No Tab key on your phone? Use the TAB button.',
  ],
  test: {
    kind: 'challenge',
    seedFs,
    startDir: '/home/pip',
    commands: ['cd', 'ls', 'pwd'],
    objectives: [
      {
        id: 'cave',
        label: 'Walk into the cave',
        hint: 'Type cd cave to enter the cave.',
        answer: 'cd cave',
        check: (s) => s.cwd === '/home/pip/cave',
      },
      {
        id: 'tunnel',
        label: 'Go deeper into the tunnel',
        hint: 'From the cave, cd tunnel takes you deeper.',
        answer: 'cd tunnel',
        check: (s) => s.cwd === '/home/pip/cave/tunnel',
      },
      {
        id: 'lake',
        label: 'Find your way to the lake',
        hint: 'The lake sits next to the cave. From the tunnel, go up twice then into lake: cd ../../lake.',
        answer: 'cd ../../lake',
        check: (s) => s.cwd === '/home/pip/lake',
      },
    ],
  },
}
