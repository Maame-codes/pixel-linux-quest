import { dir, file, getNode, isDir, isFile } from '../../shell'
import { ran } from '../checks'
import type { Level } from '../types'

const HOME = '/home/pip'

/** The server room's log: a quiet morning, then smoke. */
function fireLog(): string[] {
  const lines: string[] = []
  for (let i = 0; i < 37; i++) {
    const min = String(i).padStart(2, '0')
    lines.push(`2026-11-20 10:${min}:00 INFO rack 3 temperature ${24 + (i % 3)}C`)
  }
  lines.push(
    '2026-11-20 10:37:12 ALERT smoke detected near rack 3',
    '2026-11-20 10:37:20 ALERT rack 3 temperature 92C',
    '2026-11-20 10:37:21 CRITICAL fans failed, shutting down the web server',
  )
  return lines
}

export const FIRE_LOG = fireLog()

const seedFs = dir({
  home: dir({
    pip: dir({
      'keys.txt': file('Server room door code: 4512'),
      backups: dir(),
      server: dir({
        'web.conf': file('listen=80\nroot=/srv/www'),
        'start.sh': file('#!/bin/bash\necho "web server starting"'),
        logs: dir({ 'fire.log': file(FIRE_LOG.join('\n')) }),
        tmp: dir({
          'a.tmp': file('(smoke)'),
          'b.tmp': file('(smoke)'),
          'c.tmp': file('(smoke)'),
          'd.tmp': file('(smoke)'),
        }),
        rooms: dir({
          east: dir({
            closet: dir({ 'evacuation-plan.txt': file('Exit through the north door. Meet at the big pine.') }),
          }),
          west: dir({ 'mop.txt': file('a mop') }),
        }),
      }),
    }),
  }),
})

/** Files that must survive the fire. */
export const MUST_KEEP = [
  'keys.txt',
  'server/web.conf',
  'server/start.sh',
  'server/logs/fire.log',
  'server/rooms/east/closet/evacuation-plan.txt',
]

const at = (s: Parameters<typeof getNode>[0], path: string) => getNode(s, `${HOME}/${path}`)
const modeOf = (s: Parameters<typeof getNode>[0], path: string) => at(s, path)?.mode ?? 0
const W2 = 'You learned this in World 2.'

export const forestFire: Level = {
  id: 'w3-l6-forest-fire',
  world: 3,
  level: 6,
  title: 'Forest Fire',
  blurb: 'The server room is on fire! Everything from File Forest, against the clock.',
  xp: 150,
  lessonPages: [
    '**Boss level: Forest Fire.** Smoke in the server room! The web server is down, its log is filling up and the backups are in danger. You will need everything you learned in File Forest: `cp`, `mv`, `rm`, `rmdir`, `head`, `tail`, `wc`, `find` and `chmod`.',
    'There is a timer, but **no penalty**: if it runs out, just try again, as often as you like. Prefer no time pressure? Press TIMER to switch it off (it is in Settings too).\n\nSome tasks need commands from World 2, and Pip gives no hints for those. On a boss level, SHOW ANSWER appears after three tries.',
  ],
  test: {
    kind: 'challenge',
    seedFs,
    startDir: HOME,
    boss: { timeLimitSec: 8 * 60 },
    commands: [
      'ls',
      'cd',
      'pwd',
      'whoami',
      'cat',
      'mkdir',
      'touch',
      'cp',
      'mv',
      'rm',
      'rmdir',
      'head',
      'tail',
      'wc',
      'find',
      'chmod',
    ],
    failure: (s) => {
      const lost = MUST_KEEP.find((p) => !at(s.fs, p))
      if (!lost) return null
      return `Oh no, ${lost} was lost in the fire! It was important. Press RESTART LEVEL to try again, no penalty.`
    },
    objectives: [
      {
        id: 'who',
        label: 'First, check which user you are logged in as',
        hint: W2,
        answer: 'whoami',
        recall: true,
        check: (_s, last) => ran(last, 'whoami'),
      },
      {
        id: 'backup',
        label: 'Save server/web.conf: copy it into the backups folder',
        hint: 'Copy it, and give the folder as the destination.',
        answer: 'cp server/web.conf backups',
        check: (s) => isFile(at(s.fs, 'backups/web.conf')),
      },
      {
        id: 'log',
        label: 'Read the last 3 lines of server/logs/fire.log to see what is burning',
        hint: 'The newest lines of a log are at the end.',
        answer: 'tail -n 3 server/logs/fire.log',
        check: (_s, last) => ran(last, 'tail') && last.stdout === FIRE_LOG.slice(-3).join('\n'),
      },
      {
        id: 'plan',
        label: 'Find evacuation-plan.txt, somewhere inside server',
        hint: 'Search by name, starting in server.',
        answer: 'find server -name evacuation-plan.txt',
        check: (_s, last) => ran(last, 'find') && last.stdout.includes('rooms/east/closet/evacuation-plan.txt'),
      },
      {
        id: 'smoke',
        label: 'Clear the smoke: delete every .tmp file in server/tmp',
        hint: 'A * pattern can name them all at once.',
        answer: 'rm server/tmp/*.tmp',
        check: (s) => {
          const tmp = at(s.fs, 'server/tmp')
          return !tmp || (isDir(tmp) && !Object.keys(tmp.children).some((n) => n.endsWith('.tmp')))
        },
      },
      {
        id: 'tmpdir',
        label: 'Remove the now empty server/tmp folder, the safe way',
        hint: 'One command only removes folders that are empty.',
        answer: 'rmdir server/tmp',
        check: (s) => at(s.fs, 'server/tmp') === null,
      },
      {
        id: 'keys',
        label: 'Lock keys.txt so only you can read and write it',
        hint: 'In numbers: read 4 plus write 2 for you, nothing for anyone else.',
        answer: 'chmod 600 keys.txt',
        check: (s) => (modeOf(s.fs, 'keys.txt') & 0o777) === 0o600,
      },
      {
        id: 'start',
        label: 'Make server/start.sh runnable for its owner, ready for a restart',
        hint: 'Add x for u.',
        answer: 'chmod u+x server/start.sh',
        check: (s) => (modeOf(s.fs, 'server/start.sh') & 0o100) !== 0,
      },
      {
        id: 'safe-zone',
        label: 'Make a folder called safe-zone in your home, where everyone can meet',
        hint: W2,
        answer: 'mkdir safe-zone',
        recall: true,
        check: (s) => isDir(at(s.fs, 'safe-zone')),
      },
    ],
  },
}
