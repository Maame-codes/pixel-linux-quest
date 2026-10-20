import { dir, file } from '../../shell'
import type { Level } from '../types'

const seedFs = dir({
  home: dir({
    pip: dir({ 'readme.txt': file('Absolute paths start at /. Relative paths start here.') }),
  }),
  var: dir({
    log: dir({ 'boot.log': file('system started ok') }),
    lib: dir({ 'data.txt': file('odds and ends') }),
  }),
  etc: dir({ 'hostname.txt': file('island') }),
})

export const findingYourWay: Level = {
  id: 'w2-l3-finding-your-way',
  world: 2,
  level: 3,
  title: 'Finding Your Way',
  blurb: 'Absolute paths, relative paths, and the ~ shortcut.',
  xp: 50,
  lessonPages: [
    'Every place on the system has a **path**. An **absolute path** starts at the root `/` and spells out the whole way there, like `/var/log`. It works no matter where you are standing.',
    'A **relative path** starts from where you are right now. If you are in `/var`, then `log` means `/var/log`, and `../lib` means go up one and into `lib`.',
    '`~` is a shortcut for your home directory, and `pwd` always prints your location as an absolute path. Use whichever path is shorter to type!',
  ],
  test: {
    kind: 'challenge',
    seedFs,
    startDir: '/home/pip',
    commands: ['cd', 'pwd', 'ls'],
    objectives: [
      {
        id: 'pwd',
        label: 'Print your absolute location with pwd',
        hint: 'Type pwd to see the full path of where you are.',
        answer: 'pwd',
        check: (_s, last) => last.input.trim() === 'pwd' && last.code === 0,
      },
      {
        id: 'abs',
        label: 'Visit the system logs at /var/log (absolute path)',
        hint: 'Use the full path: cd /var/log',
        answer: 'cd /var/log',
        check: (s) => s.cwd === '/var/log',
      },
      {
        id: 'rel',
        label: 'From the logs, use a relative path to reach /var/lib',
        hint: 'You are in /var/log. Go up one and into lib: cd ../lib',
        answer: 'cd ../lib',
        check: (s) => s.cwd === '/var/lib',
      },
    ],
  },
}
